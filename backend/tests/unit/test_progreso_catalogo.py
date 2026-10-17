"""Registro por catálogo: fuerza, cardio, recursos reales y continuidad del historial."""
from uuid import uuid4
from unittest.mock import Mock

import pytest

from app.blueprints.ejercicios import services as catalogo
from app.blueprints.progreso import services
from app.domain.models import RegistroSerie
from app.repositories.supabase_progreso import SupabaseProgresoRepository, _row_a_registro


def ejercicio(categoria="maquina", gym="mock-gym", nombre="Ejercicio de prueba"):
    recursos = [catalogo._repo.guardar_recurso(gym, {
        "nombre": f"Recurso {n}", "tipo": "maquina" if n == 1 else "equipamiento",
        "numero_maquina": str(len(catalogo._repo.recursos) + 1), "descripcion": "",
    }) for n in (1, 2)]
    return catalogo._repo.guardar_ejercicio(gym, {
        "nombre": nombre, "categoria": categoria, "grupos_musculares": ["piernas"],
        "descripcion": "", "video_url": "", "imagen_url": "",
    }, [r["id"] for r in recursos])


def fuerza(e, **cambios):
    return {"ejercicio_catalogo_id": e["id"], "modalidad": "fuerza", "peso_unidad": "kg",
            "peso_valor": 20, "repeticiones_valor": 10, "recurso_ids": [e["recursos"][0]["id"]], **cambios}


def cardio(e, **cambios):
    return {"ejercicio_catalogo_id": e["id"], "modalidad": "cardio", "duracion_segundos": 1200,
            "distancia_metros": 2500, "recurso_ids": [e["recursos"][0]["id"]], **cambios}


def registrar(client, auth, datos):
    resp = client.post("/api/progreso", headers=auth.as_alumno(), json=datos)
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()["data"]


def test_fuerza_conserva_libras_y_normaliza_para_la_evolucion(client, mock_auth):
    e = ejercicio()
    r = registrar(client, mock_auth, fuerza(e, peso_unidad="lb", peso_valor=100,
                  alumno_id="otro", gimnasio_id="otro", nombre_libre="falso", peso_kg=9999))
    assert r["alumno_id"] == "u-alu-001" and r["gimnasio_id"] == "mock-gym"
    assert r["peso"] == "100 lb" and r["peso_valor"] == 100 and r["peso_unidad"] == "lb"
    assert r["peso_kg"] == pytest.approx(45.359237)
    assert r["nombre_libre"] == e["nombre"]
    assert [x["id"] for x in r["recursos"]] == [e["recursos"][0]["id"]]
    registrar(client, mock_auth, fuerza(e, peso_valor=50))
    evolucion = client.get(f'/api/progreso/evolucion?ejercicio=catalogo:{e["id"]}', headers=mock_auth.as_alumno()).get_json()["data"]
    assert evolucion["pr_historico"] == 50
    assert evolucion["puntos"][0]["cantidad_series"] == 2


def test_renombrar_ejercicio_no_fragmenta_el_historial(client, mock_auth):
    e = ejercicio()
    registrar(client, mock_auth, fuerza(e))
    catalogo._repo.ejercicios[e["id"]]["nombre"] = "Nuevo nombre"
    registrar(client, mock_auth, fuerza(e))
    filas = client.get("/api/progreso", headers=mock_auth.as_alumno()).get_json()["data"]
    filas = [f for f in filas if f.get("ejercicio_catalogo_id") == e["id"]]
    assert len(filas) == 1 and filas[0]["cantidad_series"] == 2
    assert filas[0]["ejercicio"] == "Nuevo nombre"


def test_cardio_agrega_duracion_distancia_y_permite_editar_sin_pesos(client, mock_auth):
    e = ejercicio("cardio")
    r = registrar(client, mock_auth, cardio(e))
    segundo = registrar(client, mock_auth, cardio(e, duracion_segundos=600, distancia_metros=None))
    assert segundo["numero_serie"] == r["numero_serie"] + 1
    assert r["peso_kg"] is None and r["repeticiones_valor"] is None
    url = f'/api/progreso/evolucion?ejercicio=catalogo:{e["id"]}'
    ev = client.get(url, headers=mock_auth.as_alumno()).get_json()["data"]
    assert ev["modalidad"] == "cardio" and ev["pr_historico"] is None
    assert ev["puntos"][0]["duracion_segundos"] == 1800
    assert ev["puntos"][0]["distancia_metros"] == 2500
    editada = client.patch(f'/api/progreso/{r["id"]}', headers=mock_auth.as_alumno(), json={
        "modalidad": "cardio", "duracion_segundos": 900, "distancia_metros": 2000,
        "ejercicio_catalogo_id": str(uuid4()), "recurso_ids": [],
    })
    assert editada.status_code == 200
    actual = editada.get_json()["data"]
    assert actual["duracion_segundos"] == 900 and actual["ejercicio_catalogo_id"] == e["id"]
    assert actual["recursos"] == r["recursos"]
    sesion = client.get(f'/api/progreso/sesion?ejercicio=catalogo:{e["id"]}&fecha={r["fecha"][:10]}', headers=mock_auth.as_alumno()).get_json()["data"]
    assert sesion["series"][0]["duracion_segundos"] == 900


@pytest.mark.parametrize("solo", ["duracion", "distancia"])
def test_cardio_acepta_solo_un_tipo_de_medicion(client, mock_auth, solo):
    e = ejercicio("cardio")
    registrar(client, mock_auth, cardio(e, duracion_segundos=60 if solo == "duracion" else None,
                                     distancia_metros=100 if solo == "distancia" else None))


def test_peso_corporal_y_cero_no_se_pierden(client, mock_auth):
    e = ejercicio("libre")
    r = registrar(client, mock_auth, fuerza(e, peso_unidad="otro", peso_texto="Peso corporal", peso_valor=None))
    assert r["peso"] == "Peso corporal" and r["peso_kg"] is None
    r = registrar(client, mock_auth, fuerza(e, peso_valor=0))
    assert r["peso_valor"] == 0 and r["peso_kg"] == 0


def test_otro_se_conserva_como_texto_aunque_parezca_un_peso(client, mock_auth):
    e = ejercicio()
    registrar(client, mock_auth, fuerza(e, peso_unidad="otro", peso_texto="100 kg"))
    ev = client.get(f'/api/progreso/evolucion?ejercicio=catalogo:{e["id"]}', headers=mock_auth.as_alumno()).get_json()["data"]
    assert ev["pr_historico"] is None and ev["puntos"] == []


@pytest.mark.parametrize("cambios", [
    {"peso_valor": -1}, {"peso_valor": True}, {"peso_valor": float("inf")},
    {"peso_valor": 10**400}, {"peso_unidad": "ton"}, {"repeticiones_valor": 0},
    {"repeticiones_valor": 1.5}, {"peso_unidad": "otro", "peso_texto": ""},
    {"duracion_segundos": 10}, {"recurso_ids": []}, {"ejercicio_catalogo_id": "no-id"},
])
def test_rechaza_fuerza_invalida(client, mock_auth, cambios):
    e = ejercicio()
    assert client.post("/api/progreso", json=fuerza(e, **cambios), headers=mock_auth.as_alumno()).status_code == 400


@pytest.mark.parametrize("cambios", [
    {"duracion_segundos": None, "distancia_metros": None}, {"duracion_segundos": 0},
    {"duracion_segundos": 1.5}, {"distancia_metros": -1}, {"distancia_metros": float("nan")},
    {"peso_unidad": "kg"}, {"repeticiones_valor": 10},
])
def test_rechaza_cardio_invalido(client, mock_auth, cambios):
    e = ejercicio("cardio")
    assert client.post("/api/progreso", json=cardio(e, **cambios), headers=mock_auth.as_alumno()).status_code == 400


def test_rechaza_recursos_ajenos_no_asociados_y_repetidos(client, mock_auth):
    e = ejercicio()
    ajeno = ejercicio(gym="otro-gym")
    otro = ejercicio(nombre="Otro ejercicio")
    for ids in ([ajeno["recursos"][0]["id"]], [otro["recursos"][0]["id"]],
                [e["recursos"][0]["id"]] * 2, [e["recursos"][1]["id"]]):
        assert client.post("/api/progreso", json=fuerza(e, recurso_ids=ids), headers=mock_auth.as_alumno()).status_code == 400
    assert client.post("/api/progreso", json=fuerza(ajeno), headers=mock_auth.as_alumno()).status_code == 404


def test_no_confunde_modalidad_y_no_permite_editar_registros_ajenos(client, mock_auth):
    e = ejercicio("cardio")
    assert client.post("/api/progreso", json=fuerza(e), headers=mock_auth.as_alumno()).status_code == 400
    r = registrar(client, mock_auth, cardio(e))
    datos = {"modalidad": "cardio", "duracion_segundos": 600}
    assert client.patch(f'/api/progreso/{r["id"]}', json=datos, headers=mock_auth.as_user("u-alu-002")).status_code == 404
    assert client.patch(f'/api/progreso/{r["id"]}', json={"peso": "10 kg", "repeticiones": "10"}, headers=mock_auth.as_alumno()).status_code == 400


def test_rutina_debe_pertenecer_al_alumno_y_contener_el_ejercicio(client, mock_auth):
    e = ejercicio()
    datos_rutina = {"titulo": "Rutina de prueba", "grupos_musculares": [], "ejercicios": [{
        "ejercicio_catalogo_id": e["id"], "series": 3, "repeticiones": "10", "peso_sugerido": "20 kg"}]}
    r = client.post("/api/rutinas", json=datos_rutina, headers=mock_auth.as_alumno()).get_json()["data"]
    registrar(client, mock_auth, fuerza(e, rutina_id=r["id"]))
    otro = ejercicio(nombre="No pertenece a la rutina")
    assert client.post("/api/progreso", json=fuerza(otro, rutina_id=r["id"]), headers=mock_auth.as_alumno()).status_code == 400
    assert client.post("/api/progreso", json=fuerza(e, rutina_id="rt-004"), headers=mock_auth.as_alumno()).status_code == 404


def test_ejercicio_personalizado_admite_metricas_sin_catalogo(client, mock_auth):
    r = registrar(client, mock_auth, {"ejercicio_tipo": "libre", "nombre_libre": "Flexiones",
        "modalidad": "fuerza", "peso_unidad": "otro", "peso_texto": "Peso corporal", "repeticiones_valor": 12})
    assert r["ejercicio_catalogo_id"] is None and r["repeticiones_valor"] == 12


def test_edicion_de_cliente_antiguo_actualiza_metricas_derivadas(client, mock_auth):
    e = ejercicio()
    r = registrar(client, mock_auth, fuerza(e))
    resp = client.patch(f'/api/progreso/{r["id"]}', json={"peso": "100 lb", "repeticiones": "8"}, headers=mock_auth.as_alumno())
    assert resp.status_code == 200
    assert resp.get_json()["data"]["peso_kg"] == pytest.approx(45.359237)


def test_repositorio_envia_registro_y_recursos_en_una_rpc():
    repo = SupabaseProgresoRepository.__new__(SupabaseProgresoRepository)
    repo._sb = Mock()
    repo._sb.rpc.return_value.execute.return_value.data = "registro"
    repo.find_by_id = Mock(return_value="guardado")
    r = RegistroSerie(id="", alumno_id="alumno", fecha="", ejercicio_tipo="libre", numero_serie=1,
        peso="No aplica", repeticiones="No aplica", gimnasio_id="gym", ejercicio_catalogo_id=str(uuid4()),
        modalidad="cardio", duracion_segundos=60, recursos=[{"id": "recurso"}])
    assert repo.crear(r) == "guardado"
    args = repo._sb.rpc.call_args.args
    assert args[0] == "registrar_entrenamiento_catalogo"
    assert args[1]["p_recurso_ids"] == ["recurso"]
    assert args[1]["p_registro"]["duracion_segundos"] == 60
    assert "recursos" not in args[1]["p_registro"]


def test_prefijo_catalogo_y_escape_de_nombres_en_consultas():
    query = Mock()
    id = str(uuid4())
    SupabaseProgresoRepository._filtrar_ejercicio(query, "catalogo:" + id)
    query.eq.assert_called_once_with("ejercicio_catalogo_id", id)
    query.reset_mock()
    SupabaseProgresoRepository._filtrar_ejercicio(query, "press_100%")
    query.eq.return_value.ilike.assert_called_once_with("nombre_libre", r"press\_100\%")
