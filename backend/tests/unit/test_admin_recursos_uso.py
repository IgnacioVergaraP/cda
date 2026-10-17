"""Etapa 4: uso efectivamente informado, cobertura, filtros y paginación."""
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.blueprints.admin import services
from app.blueprints.ejercicios import services as catalogo
from app.domain.models import RegistroSerie
from app.repositories.supabase_progreso import SupabaseProgresoRepository
from app.repositories.supabase_catalogo import SupabaseCatalogoRepository


@pytest.fixture
def escenario(mock_auth, monkeypatch):
    class Reloj(datetime):
        @classmethod
        def now(cls, tz=None):
            return cls(2026, 10, 17, 15, tzinfo=timezone.utc)
    monkeypatch.setattr(services, "datetime", Reloj)
    services._progreso_repo()._registros.clear()


def recurso(nombre, tipo="maquina", numero=None, gym="mock-gym"):
    return catalogo._repo.guardar_recurso(gym, {
        "nombre": nombre, "tipo": tipo, "numero_maquina": numero, "descripcion": "",
    })


def registro(recursos=(), alumno="u-alu-001", fecha="2026-10-16T12:00:00+00:00", gym="mock-gym", modalidad="fuerza"):
    repo = services._progreso_repo()
    r = RegistroSerie(id=f"uso-{len(repo._registros)}", alumno_id=alumno, gimnasio_id=gym, fecha=fecha,
                     ejercicio_tipo="libre", nombre_libre="Ejercicio", numero_serie=1,
                     peso="20 kg", repeticiones="10", modalidad=modalidad, recursos=list(recursos))
    repo._registros.append(r)
    return r


def dashboard(client, auth, query=""):
    resp = client.get("/api/admin/dashboard/uso" + query, headers=auth.as_admin())
    assert resp.status_code == 200, resp.get_json()
    return resp.get_json()["data"]


def test_recursos_compartidos_y_cobertura_sin_duplicar_entrenamientos(client, mock_auth, escenario):
    banco = recurso("Banco", "equipamiento", "B-01")
    barra = recurso("Barra", "equipamiento")
    registro([banco, barra])
    registro([banco], alumno="u-alu-002", modalidad="cardio")
    registro()
    data = dashboard(client, mock_auth)
    assert data["total_registros"] == 3
    assert data["registros_con_recursos"] == 2 and data["registros_sin_recursos"] == 1
    assert data["registros_fuerza"] == 2 and data["registros_cardio"] == 1
    assert data["alumnos_con_registros"] == 2
    assert data["total_usos"] == 3 and data["recursos_usados"] == 2
    assert data["top_usadas"][0] == {
        "recurso_id": banco["id"], "nombre": "Banco", "tipo": "equipamiento", "numero_maquina": "B-01",
        "cantidad_registros": 2, "registros_fuerza": 1, "registros_cardio": 1, "alumnos_unicos": 2,
    }
    assert data["top_usadas"][1]["recurso_id"] == barra["id"]


def test_no_infiere_uso_por_pertenecer_al_catalogo_o_a_una_maquina(client, mock_auth, escenario):
    e = catalogo._repo.listar_ejercicios("mock-gym")[0]
    r = registro()
    r.ejercicio_catalogo_id = e["id"]
    r.ejercicio_tipo = "maquina"
    r.maquina_id = e["maquina_origen_id"]
    data = dashboard(client, mock_auth)
    assert data["total_registros"] == 1 and data["registros_sin_recursos"] == 1
    assert data["total_usos"] == 0 and data["top_usadas"] == []


def test_menos_usados_prioriza_ceros_aunque_haya_mas_de_cinco_usados(client, mock_auth, escenario):
    cero = recurso("000 Sin uso")
    for n in range(6):
        r = recurso(f"Utilizado {n}")
        for _ in range(n + 1):
            registro([r])
    data = dashboard(client, mock_auth)
    assert len(data["top_usadas"]) == 5 and len(data["menos_usadas"]) == 5
    assert data["top_usadas"][0]["cantidad_registros"] == 6
    assert all(r["cantidad_registros"] == 0 for r in data["menos_usadas"])
    assert data["menos_usadas"][0]["recurso_id"] == cero["id"]


def test_filtro_tipo_cambia_rankings_pero_conserva_cobertura_del_periodo(client, mock_auth, escenario):
    maquina = recurso("Polea", "maquina")
    equipo = recurso("Banco", "equipamiento")
    zona = recurso("Suelo", "infraestructura")
    registro([maquina, equipo])
    registro([zona], modalidad="cardio")
    registro()
    data = dashboard(client, mock_auth, "?tipo=infraestructura")
    assert data["total_recursos"] == data["recursos_usados"] == data["total_usos"] == 1
    assert data["recursos_sin_uso"] == 0
    assert data["top_usadas"][0]["recurso_id"] == zona["id"]
    assert data["total_registros"] == 3 and data["registros_sin_recursos"] == 1


def test_limites_temporales_y_rangos(client, mock_auth, escenario):
    r = recurso("Polea")
    for fecha in ["2026-10-10T15:00:00+00:00", "2026-10-10T14:59:59+00:00",
                  "2026-10-17T14:59:59+00:00", "2026-10-17T15:00:00+00:00", "2027-01-01T00:00:00+00:00"]:
        registro([r], fecha=fecha)
    assert dashboard(client, mock_auth, "?rango=7d")["total_registros"] == 2
    assert dashboard(client, mock_auth, "?rango=30d")["total_registros"] == 3


def test_aislamiento_y_solo_alumnos_incluyendo_inactivos(client, mock_auth, escenario):
    r = recurso("Polea")
    ajeno = recurso("Equipo ajeno", gym="otro-gym")
    registro([r])
    registro([ajeno], gym="otro-gym")
    registro([r], alumno="u-pro-001")
    registro([r], alumno="u-alu-002")
    services._usuarios_repo.find_by_id("u-alu-002").activo = False
    data = dashboard(client, mock_auth)
    assert data["total_registros"] == 2 and data["total_usos"] == 2
    assert data["alumnos_con_registros"] == 2
    assert all(x["recurso_id"] != ajeno["id"] for x in data["menos_usadas"] + data["top_usadas"])


def test_empates_tienen_orden_estable_y_cada_recurso_se_cuenta_una_vez(client, mock_auth, escenario):
    b = recurso("Banco", "equipamiento", "B")
    a = recurso("Banco", "equipamiento", "A")
    registro([b, b, a])
    data = dashboard(client, mock_auth, "?tipo=equipamiento")
    assert data["total_usos"] == 2
    assert [r["numero_maquina"] for r in data["top_usadas"]] == ["A", "B"]


@pytest.mark.parametrize("query", ["?tipo=otro", "?tipo=cardio", "?rango=todo", "?rango=", "?tipo=maquina&gimnasio_id=ajeno&rango=invalido"])
def test_filtros_invalidos(client, mock_auth, query):
    assert client.get("/api/admin/dashboard/uso" + query, headers=mock_auth.as_admin()).status_code == 400


@pytest.mark.parametrize("rol", ["as_alumno", "as_profesor"])
def test_solo_admin_consulta_estadisticas(client, mock_auth, rol):
    assert client.get("/api/admin/dashboard/uso", headers=getattr(mock_auth, rol)()).status_code == 403


def test_informe_vacio_y_tipo_sin_recursos(client, mock_auth, escenario):
    data = dashboard(client, mock_auth, "?tipo=infraestructura")
    assert data["total_registros"] == data["total_recursos"] == data["registros_sin_recursos"] == 0
    assert data["top_usadas"] == data["menos_usadas"] == []


def consulta_simulada(paginas):
    query = Mock()
    for metodo in ("select", "eq", "gte", "lt", "order", "range"):
        getattr(query, metodo).return_value = query
    query.execute.side_effect = [SimpleNamespace(data=p) for p in paginas]
    sb = Mock()
    sb.table.return_value = query
    return sb, query


def test_lectura_de_progreso_pagina_mas_de_mil_sin_consultas_por_alumno():
    repo = SupabaseProgresoRepository.__new__(SupabaseProgresoRepository)
    repo._sb, query = consulta_simulada([[{"id": n} for n in range(1000)], [{"id": 1000}]])
    registros = list(repo.iterar_uso_recursos("gym", "2026-10-01T00:00:00+00:00", "2026-11-01T00:00:00+00:00"))
    assert len(registros) == 1001 and len({r["id"] for r in registros}) == 1001
    assert [c.args for c in query.range.call_args_list] == [(0, 999), (1000, 1999)]
    assert ("gimnasio_id", "gym") in [c.args for c in query.eq.call_args_list]
    assert ("alumno.rol", "alumno") in [c.args for c in query.eq.call_args_list]
    query.gte.assert_called_with("fecha", "2026-10-01T00:00:00+00:00")
    query.lt.assert_called_with("fecha", "2026-11-01T00:00:00+00:00")


def test_lectura_inventario_pagina_mas_de_mil_recursos():
    repo = SupabaseCatalogoRepository.__new__(SupabaseCatalogoRepository)
    repo._sb, query = consulta_simulada([[{"id": n} for n in range(1000)], [{"id": 1000}]])
    assert len(list(repo.iterar_recursos_uso("gym"))) == 1001
    assert [c.args for c in query.range.call_args_list] == [(0, 999), (1000, 1999)]
    query.eq.assert_called_with("gimnasio_id", "gym")
