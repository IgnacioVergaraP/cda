"""Persistencia del origen de las rutinas y filtro del catálogo docente."""
from unittest.mock import Mock

import pytest

from app.domain.models import Rutina
from app.repositories.supabase_rutinas import SupabaseRutinasRepository, _row_a_rutina


@pytest.mark.parametrize("creada_por_alumno", [True, False])
def test_repositorio_persiste_flag(creada_por_alumno):
    repo = SupabaseRutinasRepository.__new__(SupabaseRutinasRepository)
    repo._sb = Mock()
    repo._sb.table.return_value.insert.return_value.execute.return_value.data = [{"id": "nueva"}]
    rutina = Rutina(id="", titulo="Rutina", grupos_musculares=[],
                    alumno_id="alumno", gimnasio_id="gym", creada_por_alumno=creada_por_alumno)
    repo.find_by_id = Mock(return_value=rutina)
    repo.crear(rutina)
    row = repo._sb.table.return_value.insert.call_args.args[0]
    assert row["creada_por_alumno"] is creada_por_alumno
    assert row["alumno_id"] == "alumno"


@pytest.mark.parametrize("creada_por_alumno", [True, False])
def test_repositorio_lee_flag(creada_por_alumno):
    rutina = _row_a_rutina({"id": "rutina", "titulo": "Rutina", "alumno_id": "alumno",
                           "gimnasio_id": "gym", "creada_por_alumno": creada_por_alumno}, [])
    assert rutina.to_dict()["creada_por_alumno"] is creada_por_alumno


def test_listado_profesor_filtra_origen_en_base_de_datos():
    repo = SupabaseRutinasRepository.__new__(SupabaseRutinasRepository)
    query = Mock()
    query.select.return_value = query
    query.eq.return_value = query
    query.order.return_value = query
    query.execute.return_value.data = []
    repo._sb = Mock()
    repo._sb.table.return_value = query
    assert repo.listar_por_profesor("profesor", incluir_inactivas=True) == []
    query.eq.assert_any_call("profesor_id", "profesor")
    query.eq.assert_any_call("creada_por_alumno", False)
