"""Etapa 2: identidad del catálogo, compatibilidad y aislamiento de rutinas."""
from uuid import uuid4
from unittest.mock import Mock

import pytest

from app.blueprints.ejercicios import services as catalogo
from app.blueprints.rutinas import services as rutinas
from app.domain.models import Ejercicio, Rutina
from app.repositories.supabase_rutinas import SupabaseRutinasRepository, _row_a_ejercicio


def nuevo_catalogo(categoria="maquina", gimnasio="mock-gym"):
    recurso = catalogo._repo.guardar_recurso(gimnasio, {
        "nombre": "Equipo de prueba", "tipo": "maquina", "numero_maquina": "12", "descripcion": "",
    })
    return catalogo._repo.guardar_ejercicio(gimnasio, {
        "nombre": "Movimiento del catálogo", "categoria": categoria, "grupos_musculares": ["piernas"],
        "descripcion": "Instrucciones del catálogo", "imagen_url": "", "video_url": "",
    }, [recurso["id"]])


def payload(ejercicio_id):
    return {"titulo": "Rutina con catálogo", "grupos_musculares": ["piernas"], "ejercicios": [{
        "ejercicio_catalogo_id": ejercicio_id, "series": 3, "repeticiones": "10", "peso_sugerido": "20 kg",
        # Estos datos del cliente no deben sustituir la identidad del catálogo.
        "tipo": "maquina", "maquina_id": "inventada", "nombre": "Nombre falso",
    }]}


@pytest.mark.parametrize("categoria", ["maquina", "libre", "cardio"])
def test_alumno_selecciona_catalogo_y_servidor_resuelve_identidad(client, mock_auth, categoria):
    elegido = nuevo_catalogo(categoria)
    resp = client.post("/api/rutinas", json=payload(elegido["id"]), headers=mock_auth.as_alumno())
    assert resp.status_code == 201, resp.get_json()
    rutina = resp.get_json()["data"]
    e = rutina["ejercicios"][0]
    assert e["ejercicio_catalogo_id"] == elegido["id"]
    assert e["catalogo"]["categoria"] == categoria
    assert e["catalogo"]["recursos"][0]["numero_maquina"] == "12"
    assert e["tipo"] == "libre" and e["nombre"] == elegido["nombre"]
    assert "maquina_id" not in e
    detalle = client.get(f'/api/rutinas/{rutina["id"]}', headers=mock_auth.as_alumno()).get_json()["data"]
    assert detalle["ejercicios"][0]["catalogo"] == elegido


def test_catalogo_migrado_conserva_referencia_que_usa_el_progreso(client, mock_auth):
    elegido = catalogo._repo.listar_ejercicios("mock-gym")[0]
    resp = client.post("/api/rutinas", json=payload(elegido["id"]), headers=mock_auth.as_alumno())
    assert resp.status_code == 201
    e = resp.get_json()["data"]["ejercicios"][0]
    assert e["maquina_id"] == elegido["maquina_origen_id"]
    assert e["catalogo"]["id"] == elegido["id"]


@pytest.mark.parametrize("profesor", [False, True])
def test_editar_y_duplicar_conservan_catalogo(client, mock_auth, profesor):
    elegido = nuevo_catalogo()
    datos = payload(elegido["id"])
    url = "/api/profesor/rutinas" if profesor else "/api/rutinas"
    headers = mock_auth.as_profesor if profesor else mock_auth.as_alumno
    if profesor:
        datos["alumno_id"] = "u-alu-001"
    resp = client.post(url, json=datos, headers=headers())
    assert resp.status_code == 201, resp.get_json()
    id = resp.get_json()["data"]["id"]
    datos["ejercicios"][0]["series"] = 5
    editada = client.put(f"{url}/{id}", json=datos, headers=headers())
    assert editada.status_code == 200, editada.get_json()
    e = editada.get_json()["data"]["ejercicios"][0]
    assert e["series"] == 5 and e["catalogo"]["id"] == elegido["id"]
    if profesor:
        copia = client.post(f"{url}/{id}/duplicar", json={"nuevo_alumno_id": "u-alu-002"}, headers=headers())
        assert copia.status_code == 201, copia.get_json()
        assert copia.get_json()["data"]["ejercicios"][0]["ejercicio_catalogo_id"] == elegido["id"]


def test_publicacion_y_copia_personal_conservan_catalogo(client, mock_auth):
    elegido = nuevo_catalogo("libre")
    datos = {**payload(elegido["id"]), "disciplina": "musculacion", "nivel": "principiante",
             "objetivo": "Fuerza", "equipamiento": "Equipo de prueba"}
    resp = client.post("/api/rutinas/publicas", json=datos, headers=mock_auth.as_profesor())
    assert resp.status_code == 201, resp.get_json()
    original = resp.get_json()["data"]
    copia = client.post(f'/api/rutinas/publicas/{original["id"]}/guardar', headers=mock_auth.as_alumno())
    assert copia.status_code == 201
    guardada = copia.get_json()["data"]
    assert guardada["ejercicios"][0]["catalogo"]["id"] == elegido["id"]
    datos["ejercicios"][0]["series"] = 7
    assert client.put(f'/api/rutinas/publicas/{original["id"]}', json=datos, headers=mock_auth.as_profesor()).status_code == 200
    detalle = client.get(f'/api/rutinas/{guardada["id"]}', headers=mock_auth.as_alumno()).get_json()["data"]
    assert detalle["ejercicios"][0]["series"] == 3


@pytest.mark.parametrize("destino", ["personal", "profesor", "publica"])
@pytest.mark.parametrize("ajeno", [False, True])
def test_rechaza_catalogo_ajeno_o_inexistente_sin_crear_rutina(client, mock_auth, destino, ajeno):
    id = nuevo_catalogo(gimnasio="otro-gimnasio")["id"] if ajeno else str(uuid4())
    datos = payload(id)
    url = "/api/rutinas"
    headers = mock_auth.as_alumno
    if destino == "profesor":
        url = "/api/profesor/rutinas"
        datos["alumno_id"] = "u-alu-001"
        headers = mock_auth.as_profesor
    elif destino == "publica":
        url += "/publicas"
        datos.update(disciplina="musculacion", nivel="principiante", objetivo="Fuerza", equipamiento="Equipo")
        headers = mock_auth.as_profesor
    antes = len(rutinas._rutinas_repo._rutinas)
    assert client.post(url, json=datos, headers=headers()).status_code == 400
    assert len(rutinas._rutinas_repo._rutinas) == antes


def test_edicion_invalida_conserva_rutina_anterior(client, mock_auth):
    elegido = nuevo_catalogo()
    creada = client.post("/api/rutinas", json=payload(elegido["id"]), headers=mock_auth.as_alumno()).get_json()["data"]
    url = f'/api/rutinas/{creada["id"]}'
    assert client.put(url, json=payload(str(uuid4())), headers=mock_auth.as_alumno()).status_code == 400
    assert client.get(url, headers=mock_auth.as_alumno()).get_json()["data"] == creada


@pytest.mark.parametrize("id", ["no-uuid", 12, [], ""])
def test_rechaza_identificador_malformado(client, mock_auth, id):
    assert client.post("/api/rutinas", json=payload(id), headers=mock_auth.as_alumno()).status_code == 400


def test_repositorio_persiste_y_recupera_vinculo_catalogo():
    repo = SupabaseRutinasRepository.__new__(SupabaseRutinasRepository)
    repo._sb = Mock()
    repo._sb.table.return_value.insert.return_value.execute.return_value.data = [{"id": "rutina"}]
    repo.find_by_id = Mock(return_value="creada")
    id = str(uuid4())
    e = Ejercicio(id="", tipo="libre", nombre="Plancha", series=3, repeticiones="30 s", ejercicio_catalogo_id=id)
    r = Rutina(id="", titulo="Core", grupos_musculares=[], alumno_id="alumno", gimnasio_id="gym", ejercicios=[e])
    assert repo.crear(r) == "creada"
    row = repo._sb.table.return_value.insert.call_args_list[1].args[0][0]
    assert row["ejercicio_catalogo_id"] == id
    assert _row_a_ejercicio({**row, "id": "fila"}).ejercicio_catalogo_id == id
