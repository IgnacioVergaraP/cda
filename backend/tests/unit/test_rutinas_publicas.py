"""Publicaciones por gimnasio, autoría y copias personales independientes."""
from copy import deepcopy

import pytest

from app.blueprints.rutinas import services


PAYLOAD = {
    "titulo": "Preparación para tenis",
    "grupos_musculares": ["piernas"],
    "disciplina": "tenis", "nivel": "principiante",
    "objetivo": "Mejorar la fuerza", "equipamiento": "Sin equipamiento",
    "descripcion": "Realizar tres veces por semana.",
    "ejercicios": [{"tipo": "libre", "nombre": "Sentadillas", "series": 3,
                    "repeticiones": "12", "peso_sugerido": "Peso corporal"}],
}


def publicar(client, mock_auth, cambios=None):
    resp = client.post("/api/rutinas/publicas", json={**deepcopy(PAYLOAD), **(cambios or {})},
                       headers=mock_auth.as_profesor())
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()["data"]


def guardar(client, mock_auth, origen):
    resp = client.post(f'/api/rutinas/publicas/{origen["id"]}/guardar', headers=mock_auth.as_alumno())
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()["data"]


def test_publicar_fija_destino_y_autor(client, mock_auth):
    rutina = publicar(client, mock_auth, {"alumno_id": "u-alu-001", "profesor_id": "otro",
                                        "es_publica": False, "creada_por_alumno": True,
                                        "rutina_origen_id": "rt-001"})
    assert rutina["alumno_id"] is None
    assert rutina["es_publica"] is True
    assert rutina["creada_por_alumno"] is False
    assert rutina["rutina_origen_id"] is None
    assert rutina["profesor_id"] == "u-pro-001"
    assert rutina["disciplina"] == "tenis"
    propias = client.get("/api/rutinas", headers=mock_auth.as_alumno()).get_json()["data"]
    assert rutina["id"] not in [r["id"] for r in propias]
    asignadas = client.get("/api/profesor/rutinas", headers=mock_auth.as_profesor()).get_json()["data"]
    assert rutina["id"] not in [r["id"] for r in asignadas]


def test_alumno_no_puede_publicar_ni_gestionar(client, mock_auth):
    assert client.post("/api/rutinas/publicas", json=PAYLOAD, headers=mock_auth.as_alumno()).status_code == 403
    assert client.get("/api/rutinas/publicas/mias", headers=mock_auth.as_alumno()).status_code == 403
    assert client.get("/api/rutinas/publicas").status_code == 401


def test_catalogo_filtra_y_pagina(client, mock_auth):
    primera = publicar(client, mock_auth)
    publicar(client, mock_auth, {"disciplina": "futbol", "nivel": "avanzado", "titulo": "Fuerza para fútbol"})
    resp = client.get("/api/rutinas/publicas?disciplina=tenis&nivel=principiante&buscar=TENIS",
                      headers=mock_auth.as_alumno())
    assert resp.status_code == 200
    assert [r["id"] for r in resp.get_json()["data"]["items"]] == [primera["id"]]
    assert resp.get_json()["data"]["hay_mas"] is False
    # Más de una página, con orden estable y sin publicaciones repetidas.
    for i in range(24):
        publicar(client, mock_auth, {"titulo": f"Entrenamiento {i}"})
    p1 = client.get("/api/rutinas/publicas", headers=mock_auth.as_alumno()).get_json()["data"]
    p2 = client.get("/api/rutinas/publicas?desde=24", headers=mock_auth.as_alumno()).get_json()["data"]
    assert len(p1["items"]) == 24 and p1["hay_mas"]
    assert len(p2["items"]) == 2 and not p2["hay_mas"]
    assert not ({r["id"] for r in p1["items"]} & {r["id"] for r in p2["items"]})


@pytest.mark.parametrize("query", ["nivel=experto", "disciplina=invalida", "desde=-1", "desde=abc", "desde=100001"])
def test_catalogo_rechaza_filtros_invalidos(client, mock_auth, query):
    assert client.get(f"/api/rutinas/publicas?{query}", headers=mock_auth.as_alumno()).status_code == 400


@pytest.mark.parametrize("cambios", [{"disciplina": "otra"}, {"nivel": None}, {"objetivo": ""},
                                     {"equipamiento": "x" * 251}, {"descripcion": []}, {"ejercicios": []}])
def test_publicar_valida_metadatos(client, mock_auth, cambios):
    resp = client.post("/api/rutinas/publicas", json={**PAYLOAD, **cambios}, headers=mock_auth.as_profesor())
    assert resp.status_code == 400


def test_publicar_valida_maquinas_del_gimnasio(client, mock_auth):
    resp = client.post("/api/rutinas/publicas", json={**PAYLOAD, "ejercicios": [
        {"tipo": "maquina", "maquina_id": "inexistente", "series": 3,
         "repeticiones": "10", "peso_sugerido": "20 kg"}]}, headers=mock_auth.as_profesor())
    assert resp.status_code == 400


def test_guardar_conserva_autoria_y_no_duplica(client, mock_auth):
    original = publicar(client, mock_auth)
    copia = guardar(client, mock_auth, original)
    assert copia["rutina_origen_id"] == original["id"]
    assert copia["id"] != original["id"]
    assert copia["alumno_id"] == "u-alu-001"
    assert copia["profesor_nombre"] == original["profesor_nombre"]
    assert copia["profesor_id"] == original["profesor_id"]
    assert copia["es_publica"] is False and copia["creada_por_alumno"] is False
    assert guardar(client, mock_auth, original)["id"] == copia["id"]
    detalle = client.get(f'/api/rutinas/publicas/{original["id"]}', headers=mock_auth.as_alumno()).get_json()["data"]
    assert detalle["copia_id"] == copia["id"]
    assert client.get(f'/api/rutinas/{copia["id"]}', headers=mock_auth.as_user("u-alu-002")).status_code == 404
    otro = client.post(f'/api/rutinas/publicas/{original["id"]}/guardar', headers=mock_auth.as_user("u-alu-002"))
    assert otro.status_code == 201 and otro.get_json()["data"]["id"] != copia["id"]


def test_editar_original_no_modifica_copia_y_retirar_la_conserva(client, mock_auth):
    original = publicar(client, mock_auth)
    copia = guardar(client, mock_auth, original)
    payload = deepcopy(PAYLOAD)
    payload["titulo"] = "Rutina modificada"
    payload["ejercicios"][0]["series"] = 5
    resp = client.put(f'/api/rutinas/publicas/{original["id"]}', json=payload, headers=mock_auth.as_profesor())
    assert resp.status_code == 200
    guardada = client.get(f'/api/rutinas/{copia["id"]}', headers=mock_auth.as_alumno()).get_json()["data"]
    assert guardada["titulo"] == PAYLOAD["titulo"]
    assert guardada["ejercicios"][0]["series"] == 3
    resp = client.patch(f'/api/rutinas/publicas/{original["id"]}/publicacion', json={"activa": False}, headers=mock_auth.as_profesor())
    assert resp.status_code == 200
    assert client.get("/api/rutinas/publicas", headers=mock_auth.as_alumno()).get_json()["data"]["items"] == []
    assert client.get(f'/api/rutinas/publicas/{original["id"]}', headers=mock_auth.as_alumno()).status_code == 404
    assert client.post(f'/api/rutinas/publicas/{original["id"]}/guardar', headers=mock_auth.as_user("u-alu-002")).status_code == 404
    assert client.get(f'/api/rutinas/{copia["id"]}', headers=mock_auth.as_alumno()).status_code == 200
    mias = client.get("/api/rutinas/publicas/mias", headers=mock_auth.as_profesor()).get_json()["data"]["items"]
    assert len(mias) == 1 and mias[0]["activa"] is False
    assert client.get(f'/api/rutinas/publicas/{original["id"]}/gestion', headers=mock_auth.as_profesor()).status_code == 200
    assert client.patch(f'/api/rutinas/publicas/{original["id"]}/publicacion', json={"activa": True}, headers=mock_auth.as_profesor()).status_code == 200
    assert client.get(f'/api/rutinas/publicas/{original["id"]}', headers=mock_auth.as_alumno()).status_code == 200


def test_alumno_adapta_copia_sin_perder_autoria(client, mock_auth):
    original = publicar(client, mock_auth)
    copia = guardar(client, mock_auth, original)
    payload = {**PAYLOAD, "titulo": "Mi adaptación", "profesor_nombre": "Otro", "creada_por_alumno": True,
               "rutina_origen_id": None}
    resp = client.put(f'/api/rutinas/{copia["id"]}', json=payload, headers=mock_auth.as_alumno())
    assert resp.status_code == 200
    adaptada = resp.get_json()["data"]
    assert adaptada["titulo"] == "Mi adaptación"
    assert adaptada["profesor_nombre"] == original["profesor_nombre"]
    assert adaptada["rutina_origen_id"] == original["id"]
    assert adaptada["creada_por_alumno"] is False
    assert client.put(f'/api/rutinas/{copia["id"]}', json=payload, headers=mock_auth.as_user("u-alu-002")).status_code == 404
    assert client.put("/api/rutinas/rt-001", json=PAYLOAD, headers=mock_auth.as_alumno()).status_code == 404
    original_actual = client.get(f'/api/rutinas/publicas/{original["id"]}', headers=mock_auth.as_alumno()).get_json()["data"]
    assert original_actual["titulo"] == original["titulo"]


def test_copias_fuera_de_gestion_profesor(client, mock_auth):
    copia = guardar(client, mock_auth, publicar(client, mock_auth))
    for url in ("/api/profesor/rutinas", "/api/profesor/alumnos/u-alu-001/rutinas"):
        assert copia["id"] not in [r["id"] for r in client.get(url, headers=mock_auth.as_profesor()).get_json()["data"]]
    for metodo, ruta, payload in (("get", "", None), ("put", "", PAYLOAD),
                                  ("patch", "/archivar", None), ("patch", "/reactivar", None),
                                  ("post", "/duplicar", {"nuevo_alumno_id": "u-alu-002"})):
        resp = getattr(client, metodo)(f'/api/profesor/rutinas/{copia["id"]}{ruta}', json=payload, headers=mock_auth.as_profesor())
        assert resp.status_code == 404


def test_publicacion_aislada_por_gimnasio_y_autor(client, mock_auth):
    original = publicar(client, mock_auth)
    rutina = services._rutinas_repo.find_by_id(original["id"])
    rutina.gimnasio_id = "otro-gimnasio"
    assert client.get("/api/rutinas/publicas", headers=mock_auth.as_alumno()).get_json()["data"]["items"] == []
    for suffix in ("", "/gestion"):
        assert client.get(f'/api/rutinas/publicas/{rutina.id}{suffix}', headers=mock_auth.as_profesor()).status_code == 404
    assert client.post(f'/api/rutinas/publicas/{rutina.id}/guardar', headers=mock_auth.as_alumno()).status_code == 404
    assert client.put(f'/api/rutinas/publicas/{rutina.id}', json=PAYLOAD, headers=mock_auth.as_profesor()).status_code == 404
    rutina.gimnasio_id = "mock-gym"
    # Otro profesor del mismo gimnasio puede verla, pero no editarla ni retirarla.
    rutina.profesor_id = "otro-profesor"
    assert client.get(f'/api/rutinas/publicas/{rutina.id}', headers=mock_auth.as_profesor()).status_code == 200
    assert client.get(f'/api/rutinas/publicas/{rutina.id}/gestion', headers=mock_auth.as_profesor()).status_code == 404
    assert client.put(f'/api/rutinas/publicas/{rutina.id}', json=PAYLOAD, headers=mock_auth.as_profesor()).status_code == 404
    assert client.patch(f'/api/rutinas/publicas/{rutina.id}/publicacion', json={"activa": False}, headers=mock_auth.as_profesor()).status_code == 404


def test_profesor_no_guarda_copia_y_alumno_no_retira(client, mock_auth):
    original = publicar(client, mock_auth)
    assert client.post(f'/api/rutinas/publicas/{original["id"]}/guardar', headers=mock_auth.as_profesor()).status_code == 403
    assert client.patch(f'/api/rutinas/publicas/{original["id"]}/publicacion', json={"activa": False}, headers=mock_auth.as_alumno()).status_code == 403
    assert client.patch(f'/api/rutinas/publicas/{original["id"]}/publicacion', json={"activa": "false"}, headers=mock_auth.as_profesor()).status_code == 400


def test_asignadas_y_personales_no_se_pueden_guardar_como_publicas(client, mock_auth):
    assert client.post("/api/rutinas/publicas/rt-001/guardar", headers=mock_auth.as_alumno()).status_code == 404
    assert client.get("/api/rutinas/publicas/rt-001", headers=mock_auth.as_alumno()).status_code == 404
