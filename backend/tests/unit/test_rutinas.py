"""
Tests del blueprint rutinas (vista alumno).
"""


def test_listar_sin_token(client):
    resp = client.get("/api/rutinas")
    assert resp.status_code == 401


def test_listar_como_alumno(client, mock_auth):
    resp = client.get("/api/rutinas", headers=mock_auth.as_alumno())
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert isinstance(data, list)
    assert len(data) >= 3
    for r in data:
        assert {"id", "titulo", "grupos_musculares", "alumno_id", "ejercicios"} <= set(r.keys())


def test_listar_como_profesor_vacio(client, mock_auth):
    """El profesor no tiene rutinas mockeadas propias → array vacío."""
    resp = client.get("/api/rutinas", headers=mock_auth.as_profesor())
    assert resp.status_code == 200
    assert resp.get_json()["data"] == []


def test_detalle_ok(client, mock_auth):
    resp = client.get("/api/rutinas/rt-001", headers=mock_auth.as_alumno())
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["id"] == "rt-001"
    assert len(data["ejercicios"]) == 4
    ej0 = data["ejercicios"][0]
    assert ej0["tipo"] == "maquina"
    assert ej0["maquina_id"] == "mq-004"
    assert ej0["maquina"] is not None
    assert "nombre" in ej0["maquina"]


def test_detalle_con_ejercicio_libre(client, mock_auth):
    resp = client.get("/api/rutinas/rt-003", headers=mock_auth.as_alumno())
    data = resp.get_json()["data"]
    libres = [e for e in data["ejercicios"] if e["tipo"] == "libre"]
    assert len(libres) == 2
    assert libres[0]["nombre"]
    assert "maquina" not in libres[0] or libres[0].get("maquina") is None


def test_detalle_rutina_ajena_404(client, mock_auth):
    """El profesor no es dueño de las rutinas → 404."""
    resp = client.get("/api/rutinas/rt-001", headers=mock_auth.as_profesor())
    assert resp.status_code == 404
    assert resp.get_json()["error"]["name"] == "NotFound"


def test_detalle_no_existe_404(client, mock_auth):
    resp = client.get("/api/rutinas/rt-999", headers=mock_auth.as_alumno())
    assert resp.status_code == 404

# Creación de rutinas personales

def _rutina_personal_payload():
    return {
        "titulo": "Mi entrenamiento",
        "grupos_musculares": ["pecho"],
        "ejercicios": [
            {"tipo": "maquina", "maquina_id": "mq-001", "series": 3,
             "repeticiones": "10", "peso_sugerido": "20 kg"},
            {"tipo": "libre", "nombre": "Flexiones", "series": 3,
             "repeticiones": "12", "peso_sugerido": "Corporal"},
        ],
    }


def test_crear_rutina_personal_fija_autor_y_propietario(client, mock_auth):
    payload = _rutina_personal_payload()
    payload.update({"alumno_id": "u-alu-002", "gimnasio_id": "otro-gym",
                    "profesor_id": "u-pro-001", "profesor_nombre": "Profesor",
                    "creada_por_alumno": False})
    resp = client.post("/api/rutinas", json=payload, headers=mock_auth.as_alumno())
    assert resp.status_code == 201
    rutina = resp.get_json()["data"]
    assert rutina["creada_por_alumno"] is True
    assert rutina["alumno_id"] == "u-alu-001"
    assert rutina["gimnasio_id"] == "mock-gym"
    assert rutina["profesor_id"] is None
    assert rutina["profesor_nombre"] is None
    assert rutina["activa"] is True
    assert len(rutina["ejercicios"]) == 2
    assert rutina["ejercicios"][0]["maquina"]["nombre"] == "Press de banca"
    propias = client.get("/api/rutinas", headers=mock_auth.as_alumno()).get_json()["data"]
    assert any(r["id"] == rutina["id"] and r["creada_por_alumno"] for r in propias)
    ajena = client.get(f'/api/rutinas/{rutina["id"]}', headers=mock_auth.as_user("u-alu-002"))
    assert ajena.status_code == 404


def test_personales_no_aparecen_en_vistas_profesor(client, mock_auth):
    rutina = client.post("/api/rutinas", json=_rutina_personal_payload(),
                         headers=mock_auth.as_alumno()).get_json()["data"]
    for url in ("/api/profesor/rutinas", "/api/profesor/alumnos/u-alu-001/rutinas",
                "/api/profesor/alumnos/u-alu-001/rutinas?incluir_inactivas=true"):
        resp = client.get(url, headers=mock_auth.as_profesor())
        assert resp.status_code == 200
        assert all(r["id"] != rutina["id"] and not r["creada_por_alumno"]
                   for r in resp.get_json()["data"])
    detalle = client.get(f'/api/profesor/rutinas/{rutina["id"]}', headers=mock_auth.as_profesor())
    assert detalle.status_code == 404
    duplicar = client.post(f'/api/profesor/rutinas/{rutina["id"]}/duplicar',
                           json={"nuevo_alumno_id": "u-alu-002"}, headers=mock_auth.as_profesor())
    assert duplicar.status_code == 404


def test_crear_personal_sin_autenticacion(client):
    assert client.post("/api/rutinas", json=_rutina_personal_payload()).status_code == 401


def test_crear_personal_solo_alumnos(client, mock_auth):
    for headers in (mock_auth.as_profesor, mock_auth.as_admin):
        resp = client.post("/api/rutinas", json=_rutina_personal_payload(), headers=headers())
        assert resp.status_code == 403


def test_crear_personal_valida_payload(client, mock_auth):
    for cambios in ({"titulo": ""}, {"ejercicios": []}, {"ejercicios": [{}]},
                    {"ejercicios": _rutina_personal_payload()["ejercicios"] * 16}):
        payload = {**_rutina_personal_payload(), **cambios}
        resp = client.post("/api/rutinas", json=payload, headers=mock_auth.as_alumno())
        assert resp.status_code == 400
    resp = client.post("/api/rutinas", json=["invalido"], headers=mock_auth.as_alumno())
    assert resp.status_code == 400


def test_crear_personal_rechaza_maquina_ajena_o_inexistente(client, mock_auth, monkeypatch):
    from app.blueprints.rutinas import services
    payload = _rutina_personal_payload()
    payload["ejercicios"][0]["maquina_id"] = "otra-maquina"
    consultas = []

    def maquina_no_disponible(maquina_id, gimnasio_id):
        consultas.append((maquina_id, gimnasio_id))
        return None

    monkeypatch.setattr(services._maquinas_repo, "find_by_id", maquina_no_disponible)
    resp = client.post("/api/rutinas", json=payload, headers=mock_auth.as_alumno())
    assert resp.status_code == 400
    assert consultas == [("otra-maquina", "mock-gym")]
    assert resp.get_json()["error"]["name"] == "InvalidMaquina"


def test_rutinas_existentes_no_son_personales(client, mock_auth):
    resp = client.get("/api/rutinas/rt-001", headers=mock_auth.as_alumno())
    assert resp.get_json()["data"]["creada_por_alumno"] is False
