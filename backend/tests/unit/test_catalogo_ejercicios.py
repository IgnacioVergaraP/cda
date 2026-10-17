"""Etapa 1: catálogo, categorías, recursos y numeración por gimnasio."""
from uuid import uuid4
from unittest.mock import Mock

import pytest

from app.blueprints.ejercicios import services
from app.repositories.supabase_catalogo import SupabaseCatalogoRepository


def recurso(client, mock_auth, nombre="Polea alta", tipo="maquina", numero="A-03"):
    resp = client.post("/api/recursos", json={"nombre": nombre, "tipo": tipo, "numero_maquina": numero, "descripcion": "Recurso de prueba"}, headers=mock_auth.as_admin())
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()["data"]


def ejercicio(client, mock_auth, recursos, categoria="maquina", nombre="Jalón al pecho"):
    resp = client.post("/api/ejercicios", headers=mock_auth.as_admin(), json={
        "nombre": nombre, "categoria": categoria, "grupos_musculares": ["espalda"],
        "descripcion": "Descripción de prueba", "video_url": "", "imagen_url": "", "recurso_ids": [r["id"] for r in recursos],
    })
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()["data"]


def test_catalogo_inicial_y_compatibilidad_con_maquinas(client, mock_auth):
    antes = client.get("/api/maquinas", headers=mock_auth.as_alumno()).get_json()["data"]
    catalogo = client.get("/api/ejercicios", headers=mock_auth.as_alumno()).get_json()["data"]
    assert len(catalogo["items"]) == len(antes)
    assert {e["maquina_origen_id"] for e in catalogo["items"]} == {m["id"] for m in antes}
    assert all(e["recursos"] and e["recursos"][0]["numero_maquina"] is None for e in catalogo["items"])
    assert client.get("/api/rutinas/rt-001", headers=mock_auth.as_alumno()).status_code == 200


def test_multiples_recursos_y_varios_ejercicios_comparten_recurso(client, mock_auth):
    polea = recurso(client, mock_auth)
    banco = recurso(client, mock_auth, "Banco", "equipamiento", "B2")
    uno = ejercicio(client, mock_auth, [polea, banco])
    dos = ejercicio(client, mock_auth, [polea], nombre="Tríceps en polea")
    assert {r["id"] for r in uno["recursos"]} == {polea["id"], banco["id"]}
    assert dos["recursos"][0]["id"] == polea["id"]
    detalle = client.get(f'/api/ejercicios/{uno["id"]}', headers=mock_auth.as_alumno())
    assert detalle.status_code == 200
    assert {r["numero_maquina"] for r in detalle.get_json()["data"]["recursos"]} == {"A-03", "B2"}


def test_categorias_libre_y_cardio_con_infraestructura_y_equipamiento(client, mock_auth):
    zona = recurso(client, mock_auth, "Zona funcional", "infraestructura", None)
    trotadora = recurso(client, mock_auth, "Trotadora", "maquina", "12")
    libre = ejercicio(client, mock_auth, [zona], categoria="libre", nombre="Plancha")
    cardio = ejercicio(client, mock_auth, [trotadora], categoria="cardio", nombre="Caminata en trotadora")
    for categoria, esperado in (("libre", libre), ("cardio", cardio)):
        data = client.get(f"/api/ejercicios?categoria={categoria}", headers=mock_auth.as_alumno()).get_json()["data"]
        assert [e["id"] for e in data["items"]] == [esperado["id"]]


def test_numero_opcional_textual_unico_y_normalizado_por_gimnasio(client, mock_auth):
    uno = recurso(client, mock_auth, numero=" A-03 ")
    assert uno["numero_maquina"] == "A-03"
    dup = client.post("/api/recursos", json={"nombre": "Otra", "tipo": "maquina", "numero_maquina": "a-03"}, headers=mock_auth.as_admin())
    assert dup.status_code == 409
    assert recurso(client, mock_auth, numero="")["numero_maquina"] is None
    assert recurso(client, mock_auth, numero=None)["numero_maquina"] is None
    # El mismo número se puede usar en otro gimnasio.
    assert services._repo.guardar_recurso("otro-gym", {"nombre": "Otra", "tipo": "maquina", "numero_maquina": "A-03", "descripcion": ""})
    mismo = client.put(f'/api/recursos/{uno["id"]}', json={"nombre": "Polea", "tipo": "maquina", "numero_maquina": "A-03"}, headers=mock_auth.as_admin())
    assert mismo.status_code == 200


def test_editar_recurso_actualiza_numero_en_ficha_del_ejercicio(client, mock_auth):
    r = recurso(client, mock_auth)
    e = ejercicio(client, mock_auth, [r])
    resp = client.put(f'/api/recursos/{r["id"]}', headers=mock_auth.as_admin(), json={"nombre": "Polea", "tipo": "maquina", "numero_maquina": "19"})
    assert resp.status_code == 200
    detalle = client.get(f'/api/ejercicios/{e["id"]}', headers=mock_auth.as_alumno()).get_json()["data"]
    assert detalle["recursos"][0]["numero_maquina"] == "19"


def test_editar_ejercicio_reemplaza_asociaciones_y_conserva_origen(client, mock_auth):
    original = client.get("/api/ejercicios", headers=mock_auth.as_admin()).get_json()["data"]["items"][0]
    zona = recurso(client, mock_auth, "Zona libre", "infraestructura", None)
    resp = client.put(f'/api/ejercicios/{original["id"]}', headers=mock_auth.as_admin(), json={
        "nombre": "Ejercicio reclasificado", "categoria": "libre", "recurso_ids": [zona["id"]],
    })
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["maquina_origen_id"] == original["maquina_origen_id"]
    assert data["categoria"] == "libre"
    assert [r["id"] for r in data["recursos"]] == [zona["id"]]


def test_aislamiento_gimnasio_y_no_se_aceptan_identidades_del_payload(client, mock_auth):
    r = recurso(client, mock_auth)
    ajeno = services._repo.guardar_recurso("otro-gym", {"nombre": "Recurso ajeno", "tipo": "maquina", "numero_maquina": None, "descripcion": ""})
    resp = client.post("/api/ejercicios", headers=mock_auth.as_admin(), json={"nombre": "No permitido", "categoria": "maquina", "recurso_ids": [ajeno["id"]]})
    assert resp.status_code == 400
    assert client.put(f'/api/recursos/{ajeno["id"]}', headers=mock_auth.as_admin(), json={"nombre": "Cambio", "tipo": "maquina"}).status_code == 404
    e = ejercicio(client, mock_auth, [r])
    services._repo.ejercicios[e["id"]]["gimnasio_id"] = "otro-gym"
    assert client.get(f'/api/ejercicios/{e["id"]}', headers=mock_auth.as_alumno()).status_code == 404
    resp = client.post("/api/recursos", headers=mock_auth.as_admin(), json={"nombre": "Propio", "tipo": "maquina", "gimnasio_id": "otro-gym", "id": ajeno["id"]})
    assert resp.status_code == 201 and resp.get_json()["data"]["gimnasio_id"] == "mock-gym"
    assert resp.get_json()["data"]["id"] != ajeno["id"]


@pytest.mark.parametrize("rol", ["as_alumno", "as_profesor"])
def test_solo_admin_gestiona_y_todos_pueden_consultar(client, mock_auth, rol):
    headers = getattr(mock_auth, rol)
    assert client.get("/api/ejercicios", headers=headers()).status_code == 200
    assert client.get("/api/recursos", headers=headers()).status_code == 200
    assert client.post("/api/recursos", json={"nombre": "Polea", "tipo": "maquina"}, headers=headers()).status_code == 403
    assert client.post("/api/ejercicios", json={}, headers=headers()).status_code == 403
    assert client.put(f'/api/ejercicios/{uuid4()}', json={}, headers=headers()).status_code == 403
    assert client.get("/api/ejercicios").status_code == 401


@pytest.mark.parametrize("payload", [{"nombre": "", "tipo": "maquina"}, {"nombre": "A", "tipo": []},
                                     {"nombre": "A", "tipo": "otro"}, {"nombre": "A", "tipo": "maquina", "numero_maquina": 12},
                                     {"nombre": "A", "tipo": "maquina", "numero_maquina": "1" * 31}])
def test_valida_recursos(client, mock_auth, payload):
    assert client.post("/api/recursos", json=payload, headers=mock_auth.as_admin()).status_code == 400


@pytest.mark.parametrize("cambio", [{"categoria": []}, {"categoria": "otro"}, {"recurso_ids": []}, {"recurso_ids": ["invalido"]},
                                   {"video_url": "javascript:alert(1)"}, {"imagen_url": "http://ejemplo.com/a.png"},
                                   {"grupos_musculares": [1]}])
def test_valida_ejercicios(client, mock_auth, cambio):
    r = recurso(client, mock_auth)
    payload = {"nombre": "Ejercicio", "categoria": "maquina", "recurso_ids": [r["id"]], **cambio}
    assert client.post("/api/ejercicios", json=payload, headers=mock_auth.as_admin()).status_code == 400


def test_categoria_maquina_requiere_maquina_y_error_no_modifica_asociacion(client, mock_auth):
    r = recurso(client, mock_auth)
    e = ejercicio(client, mock_auth, [r])
    zona = recurso(client, mock_auth, "Zona", "infraestructura", None)
    resp = client.put(f'/api/ejercicios/{e["id"]}', headers=mock_auth.as_admin(), json={"nombre": "No válido", "categoria": "maquina", "recurso_ids": [zona["id"]]})
    assert resp.status_code == 400
    actual = client.get(f'/api/ejercicios/{e["id"]}', headers=mock_auth.as_alumno()).get_json()["data"]
    assert actual["nombre"] == e["nombre"] and actual["recursos"][0]["id"] == r["id"]


def test_filtros_paginacion_y_busqueda_por_numero(client, mock_auth):
    r = recurso(client, mock_auth, numero="B-12")
    data = client.get("/api/recursos?buscar=B-12", headers=mock_auth.as_admin()).get_json()["data"]
    assert [x["id"] for x in data["items"]] == [r["id"]]
    for i in range(26):
        ejercicio(client, mock_auth, [r], nombre=f"Prueba {i:02d}")
    p1 = client.get("/api/ejercicios?buscar=Prueba", headers=mock_auth.as_alumno()).get_json()["data"]
    p2 = client.get("/api/ejercicios?buscar=Prueba&desde=24", headers=mock_auth.as_alumno()).get_json()["data"]
    assert len(p1["items"]) == 24 and p1["hay_mas"]
    assert len(p2["items"]) == 2 and not p2["hay_mas"]
    assert not ({e["id"] for e in p1["items"]} & {e["id"] for e in p2["items"]})
    for query in ("desde=-1", "desde=abc", "categoria=otro"):
        assert client.get(f"/api/ejercicios?{query}", headers=mock_auth.as_alumno()).status_code == 400
    assert client.get("/api/ejercicios/no-uuid", headers=mock_auth.as_alumno()).status_code == 400


def test_repositorio_usa_rpc_atomica_con_gimnasio_autenticado():
    repo = SupabaseCatalogoRepository.__new__(SupabaseCatalogoRepository)
    repo._sb = Mock()
    id = str(uuid4())
    repo._sb.rpc.return_value.execute.return_value.data = id
    repo.obtener_ejercicio = Mock(return_value={"id": id})
    payload = {"nombre": "Ejercicio"}
    assert repo.guardar_ejercicio("gym", payload, ["recurso"], None) == {"id": id}
    repo._sb.rpc.assert_called_once_with("guardar_ejercicio_catalogo", {
        "p_gimnasio_id": "gym", "p_ejercicio_id": None, "p_datos": payload, "p_recurso_ids": ["recurso"],
    })
    repo.obtener_ejercicio.assert_called_once_with(id, "gym")


def test_cambiar_tipo_recurso_preserva_la_categoria_del_ejercicio(client, mock_auth):
    r = recurso(client, mock_auth)
    e = ejercicio(client, mock_auth, [r])
    payload = {"nombre": r["nombre"], "tipo": "equipamiento", "numero_maquina": r["numero_maquina"]}
    assert client.put(f'/api/recursos/{r["id"]}', json=payload, headers=mock_auth.as_admin()).status_code == 400
    # Primero se puede reclasificar el movimiento; después, su recurso.
    assert client.put(f'/api/ejercicios/{e["id"]}', json={"nombre": e["nombre"], "categoria": "libre", "recurso_ids": [r["id"]]}, headers=mock_auth.as_admin()).status_code == 200
    assert client.put(f'/api/recursos/{r["id"]}', json=payload, headers=mock_auth.as_admin()).status_code == 200


def test_altas_del_flujo_anterior_aparecen_en_catalogo(client, mock_auth):
    from app.blueprints.profesor import services as profesor_services
    nueva = profesor_services._maquinas_repo.crear(
        nombre="Equipo recién aprobado", grupos_musculares=["piernas"], descripcion="Ejemplo",
        video_url="", gimnasio_id="mock-gym",
    )
    data = client.get("/api/ejercicios?buscar=recién aprobado", headers=mock_auth.as_alumno()).get_json()["data"]["items"]
    assert len(data) == 1 and data[0]["maquina_origen_id"] == nueva.id
    assert data[0]["recursos"][0]["maquina_origen_id"] == nueva.id
