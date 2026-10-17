"""
Tests del builder de rutinas del profesor.
"""


_PAYLOAD_RUTINA = {
    "alumno_id": "u-alu-001",
    "titulo": "Rutina de prueba",
    "grupos_musculares": ["pecho", "triceps"],
    "ejercicios": [
        {
            "tipo": "maquina",
            "maquina_id": "mq-001",
            "series": 4,
            "repeticiones": "10",
            "peso_sugerido": "60 kg",
        },
        {
            "tipo": "libre",
            "nombre": "Fondos en paralelas",
            "descripcion": "Ejercicio de empuje.",
            "series": 3,
            "repeticiones": "Al fallo",
            "peso_sugerido": "Corporal",
        },
    ],
}


# -------- Listar --------

def test_listar_sin_token(client):
    resp = client.get("/api/profesor/rutinas")
    assert resp.status_code == 401


def test_listar_como_alumno_403(client, mock_auth):
    resp = client.get("/api/profesor/rutinas", headers=mock_auth.as_alumno())
    assert resp.status_code == 403


def test_listar_como_profesor(client, mock_auth):
    resp = client.get("/api/profesor/rutinas", headers=mock_auth.as_profesor())
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert isinstance(data, list)
    assert len(data) >= 5
    for r in data:
        assert r["profesor_id"] == "u-pro-001"


# -------- Crear --------

def test_crear_ok(client, mock_auth):
    resp = client.post(
        "/api/profesor/rutinas", json=_PAYLOAD_RUTINA, headers=mock_auth.as_profesor()
    )
    assert resp.status_code == 201
    data = resp.get_json()["data"]
    assert data["titulo"] == "Rutina de prueba"
    assert data["alumno_id"] == "u-alu-001"
    assert data["profesor_id"] == "u-pro-001"
    assert data["activa"] is True
    assert len(data["ejercicios"]) == 2
    assert data["ejercicios"][0]["maquina"]["nombre"] == "Press de banca"


def test_crear_sin_ejercicios_falla(client, mock_auth):
    payload = {**_PAYLOAD_RUTINA, "ejercicios": []}
    resp = client.post(
        "/api/profesor/rutinas", json=payload, headers=mock_auth.as_profesor()
    )
    assert resp.status_code == 400


def test_crear_alumno_inexistente(client, mock_auth):
    payload = {**_PAYLOAD_RUTINA, "alumno_id": "u-alu-999"}
    resp = client.post(
        "/api/profesor/rutinas", json=payload, headers=mock_auth.as_profesor()
    )
    assert resp.status_code == 400


def test_crear_maquina_inexistente_en_ejercicio(client, mock_auth):
    payload = {
        **_PAYLOAD_RUTINA,
        "ejercicios": [
            {
                "tipo": "maquina",
                "maquina_id": "mq-999",
                "series": 3,
                "repeticiones": "10",
                "peso_sugerido": "50 kg",
            },
        ],
    }
    resp = client.post(
        "/api/profesor/rutinas", json=payload, headers=mock_auth.as_profesor()
    )
    assert resp.status_code == 400


def test_crear_sin_peso_falla(client, mock_auth):
    payload = {
        **_PAYLOAD_RUTINA,
        "ejercicios": [
            {
                "tipo": "maquina",
                "maquina_id": "mq-001",
                "series": 3,
                "repeticiones": "10",
            },
        ],
    }
    resp = client.post(
        "/api/profesor/rutinas", json=payload, headers=mock_auth.as_profesor()
    )
    assert resp.status_code == 400


def test_crear_con_peso_vacio_falla(client, mock_auth):
    payload = {
        **_PAYLOAD_RUTINA,
        "ejercicios": [
            {
                "tipo": "maquina",
                "maquina_id": "mq-001",
                "series": 3,
                "repeticiones": "10",
                "peso_sugerido": "   ",
            },
        ],
    }
    resp = client.post(
        "/api/profesor/rutinas", json=payload, headers=mock_auth.as_profesor()
    )
    assert resp.status_code == 400


def test_crear_ejercicio_libre_sin_nombre_falla(client, mock_auth):
    payload = {
        **_PAYLOAD_RUTINA,
        "ejercicios": [
            {
                "tipo": "libre",
                "series": 3,
                "repeticiones": "10",
                "peso_sugerido": "Corporal",
            },
        ],
    }
    resp = client.post(
        "/api/profesor/rutinas", json=payload, headers=mock_auth.as_profesor()
    )
    assert resp.status_code == 400


def test_crear_ejercicio_tipo_invalido(client, mock_auth):
    payload = {
        **_PAYLOAD_RUTINA,
        "ejercicios": [
            {
                "tipo": "cardio",
                "series": 3,
                "repeticiones": "10",
                "peso_sugerido": "Corporal",
            },
        ],
    }
    resp = client.post(
        "/api/profesor/rutinas", json=payload, headers=mock_auth.as_profesor()
    )
    assert resp.status_code == 400


# -------- Editar --------

def test_editar_ok(client, mock_auth):
    creada = client.post(
        "/api/profesor/rutinas", json=_PAYLOAD_RUTINA, headers=mock_auth.as_profesor()
    ).get_json()["data"]

    payload_edit = {
        "titulo": "Rutina editada",
        "grupos_musculares": ["pecho"],
        "ejercicios": [
            {
                "tipo": "maquina",
                "maquina_id": "mq-002",
                "series": 5,
                "repeticiones": "8",
                "peso_sugerido": "22 kg por mano",
            },
        ],
    }
    resp = client.put(
        f"/api/profesor/rutinas/{creada['id']}",
        json=payload_edit,
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["titulo"] == "Rutina editada"
    assert len(data["ejercicios"]) == 1


def test_editar_ajena_404(client, mock_auth):
    resp = client.put(
        "/api/profesor/rutinas/rt-001",
        json={
            "titulo": "Rutina ajena",
            "grupos_musculares": [],
            "ejercicios": [
                {
                    "tipo": "libre",
                    "nombre": "X",
                    "series": 1,
                    "repeticiones": "1",
                    "peso_sugerido": "N/A",
                },
            ],
        },
        headers=mock_auth.as_admin(),
    )
    assert resp.status_code == 404


def test_editar_sin_peso_falla(client, mock_auth):
    creada = client.post(
        "/api/profesor/rutinas", json=_PAYLOAD_RUTINA, headers=mock_auth.as_profesor()
    ).get_json()["data"]

    payload_edit = {
        "titulo": "Rutina editada",
        "grupos_musculares": ["pecho"],
        "ejercicios": [
            {
                "tipo": "maquina",
                "maquina_id": "mq-002",
                "series": 5,
                "repeticiones": "8",
            },
        ],
    }
    resp = client.put(
        f"/api/profesor/rutinas/{creada['id']}",
        json=payload_edit,
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 400


# -------- Archivar / Reactivar --------

def test_archivar_ok(client, mock_auth):
    creada = client.post(
        "/api/profesor/rutinas", json=_PAYLOAD_RUTINA, headers=mock_auth.as_profesor()
    ).get_json()["data"]
    resp = client.patch(
        f"/api/profesor/rutinas/{creada['id']}/archivar",
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 200
    assert resp.get_json()["data"]["activa"] is False


def test_reactivar_ok(client, mock_auth):
    creada = client.post(
        "/api/profesor/rutinas", json=_PAYLOAD_RUTINA, headers=mock_auth.as_profesor()
    ).get_json()["data"]
    client.patch(
        f"/api/profesor/rutinas/{creada['id']}/archivar",
        headers=mock_auth.as_profesor(),
    )
    resp = client.patch(
        f"/api/profesor/rutinas/{creada['id']}/reactivar",
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 200
    assert resp.get_json()["data"]["activa"] is True


# -------- Duplicar --------

def test_duplicar_ok(client, mock_auth):
    resp = client.post(
        "/api/profesor/rutinas/rt-001/duplicar",
        json={"nuevo_alumno_id": "u-alu-004"},
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 201
    data = resp.get_json()["data"]
    assert data["alumno_id"] == "u-alu-004"
    assert data["titulo"] == "Rutina de espalda y bíceps"
    assert data["profesor_id"] == "u-pro-001"
    assert len(data["ejercicios"]) == 4


def test_duplicar_a_alumno_inexistente(client, mock_auth):
    resp = client.post(
        "/api/profesor/rutinas/rt-001/duplicar",
        json={"nuevo_alumno_id": "u-alu-999"},
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 400


def test_duplicar_rutina_inexistente(client, mock_auth):
    resp = client.post(
        "/api/profesor/rutinas/rt-999/duplicar",
        json={"nuevo_alumno_id": "u-alu-001"},
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 404


# -------- Rutinas de un alumno --------

def test_rutinas_de_alumno(client, mock_auth):
    resp = client.get(
        "/api/profesor/alumnos/u-alu-001/rutinas",
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert len(data) == 3


def test_rutinas_de_alumno_incluir_inactivas(client, mock_auth):
    client.patch(
        "/api/profesor/rutinas/rt-001/archivar",
        headers=mock_auth.as_profesor(),
    )
    resp = client.get(
        "/api/profesor/alumnos/u-alu-001/rutinas?incluir_inactivas=true",
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert len(data) == 3


def test_rutinas_de_alumno_inexistente(client, mock_auth):
    resp = client.get(
        "/api/profesor/alumnos/u-alu-999/rutinas",
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 404


# -------- Editar datos del alumno --------

def test_editar_datos_alumno(client, mock_auth):
    resp = client.patch(
        "/api/profesor/alumnos/u-alu-001/perfil",
        json={
            "peso_actual": 74.0,
            "porcentaje_grasa": 13.8,
            "notas_profesor": "Excelente progreso este mes.",
        },
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["peso_actual"] == 74.0
    assert data["porcentaje_grasa"] == 13.8
    assert data["notas_profesor"] == "Excelente progreso este mes."
    assert data["origen_grasa"] == "profesor"
    assert data["cargado_por_id"] == "u-pro-001"


def test_editar_datos_alumno_inexistente(client, mock_auth):
    resp = client.patch(
        "/api/profesor/alumnos/u-alu-999/perfil",
        json={"peso_actual": 74.0},
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 404


def test_editar_datos_alumno_no_permite_nombre(client, mock_auth):
    resp = client.patch(
        "/api/profesor/alumnos/u-alu-001/perfil",
        json={"nombre": "Hackeado"},
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 400


def test_editar_datos_alumno_notas(client, mock_auth):
    resp = client.patch(
        "/api/profesor/alumnos/u-alu-002/perfil",
        json={"notas_profesor": "Buena técnica en sentadilla."},
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 200
    assert resp.get_json()["data"]["notas_profesor"] == "Buena técnica en sentadilla."


# -------- Integración con solicitud de rutina --------

def test_crear_rutina_resuelve_solicitud_activa(client, mock_auth):
    payload = {**_PAYLOAD_RUTINA, "alumno_id": "u-alu-004"}
    resp = client.post(
        "/api/profesor/rutinas", json=payload, headers=mock_auth.as_profesor()
    )
    assert resp.status_code == 201
    rutina = resp.get_json()["data"]

    solicitudes = client.get(
        "/api/profesor/solicitudes-rutina/tomadas",
        headers=mock_auth.as_profesor(),
    ).get_json()["data"]
    resueltas = [
        s for s in solicitudes
        if s["estado"] == "resuelta" and s["rutina_id"] == rutina["id"]
    ]
    assert len(resueltas) >= 1
