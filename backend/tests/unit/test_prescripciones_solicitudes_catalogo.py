"""Cardio opcional y aprobación de propuestas con recursos reales."""
from uuid import uuid4
import pytest
from app.blueprints.ejercicios import services as catalogo
from app.blueprints.profesor import services as profesor
from tests.unit.test_rutinas_catalogo import nuevo_catalogo, payload


@pytest.mark.parametrize('indicaciones', [{}, {'intensidad': 'Moderada'}, {'duracion_minutos': 20}, {'distancia_km': 2.5}])
@pytest.mark.parametrize('destino', ['personal', 'profesor', 'publica'])
def test_cardio_opcional_persiste_edicion_y_copia(client, mock_auth, indicaciones, destino):
    ejercicio = nuevo_catalogo('cardio')
    datos = payload(ejercicio['id'])
    datos['ejercicios'][0] = {'ejercicio_catalogo_id': ejercicio['id'], 'prescripcion_cardio': indicaciones}
    url, headers = '/api/rutinas', mock_auth.as_alumno
    if destino == 'profesor':
        url, headers = '/api/profesor/rutinas', mock_auth.as_profesor
        datos['alumno_id'] = 'u-alu-001'
    elif destino == 'publica':
        url, headers = '/api/rutinas/publicas', mock_auth.as_profesor
        datos.update(disciplina='musculacion', nivel='principiante', objetivo='Resistencia', equipamiento='Equipo')
    resp = client.post(url, json=datos, headers=headers())
    assert resp.status_code == 201, resp.get_json()
    creada = resp.get_json()['data']
    prescripcion = creada['ejercicios'][0]['prescripcion_cardio']
    assert prescripcion == {'intensidad': None, 'duracion_minutos': None, 'distancia_km': None, **indicaciones}
    resp = client.put(f'{url}/{creada["id"]}', json=datos, headers=headers())
    assert resp.status_code == 200, resp.get_json()
    assert resp.get_json()['data']['ejercicios'][0]['prescripcion_cardio'] == prescripcion
    if destino == 'publica':
        copia = client.post(f'{url}/{creada["id"]}/guardar', headers=mock_auth.as_alumno())
    elif destino == 'profesor':
        copia = client.post(f'{url}/{creada["id"]}/duplicar', json={'nuevo_alumno_id': 'u-alu-002'}, headers=headers())
    else:
        return
    assert copia.status_code == 201, copia.get_json()
    assert copia.get_json()['data']['ejercicios'][0]['prescripcion_cardio'] == prescripcion


@pytest.mark.parametrize('prescripcion', [[], '20 min', {'intensidad': 2}, {'intensidad': 'x'*101},
    {'duracion_minutos': 0}, {'duracion_minutos': -1}, {'duracion_minutos': True},
    {'duracion_minutos': 10081}, {'distancia_km': '2'}, {'distancia_km': -1}, {'distancia_km': 1001}])
def test_prescripcion_invalida(client, mock_auth, prescripcion):
    datos = payload(nuevo_catalogo('cardio')['id'])
    datos['ejercicios'][0]['prescripcion_cardio'] = prescripcion
    assert client.post('/api/rutinas', json=datos, headers=mock_auth.as_alumno()).status_code == 400


def test_categoria_cardio_no_se_puede_falsificar_para_omitir_peso_y_reps(client, mock_auth):
    datos = payload(nuevo_catalogo('maquina')['id'])
    datos['ejercicios'][0] = {'ejercicio_catalogo_id': datos['ejercicios'][0]['ejercicio_catalogo_id'], 'prescripcion_cardio': {}}
    assert client.post('/api/rutinas', json=datos, headers=mock_auth.as_alumno()).status_code == 400


def propuesta(categoria='cardio', gym='mock-gym', tipo='maquina'):
    recurso = catalogo._repo.guardar_recurso(gym, {'nombre': 'Equipo compartido', 'tipo': tipo, 'numero_maquina': '99', 'descripcion': ''})
    return {'nombre': 'Ejercicio propuesto', 'categoria': categoria, 'recurso_ids': [recurso['id']],
        'grupos_musculares': [] if categoria == 'cardio' else ['piernas'], 'descripcion': 'Instrucciones de la propuesta.',
        'video_url': '', 'imagen_url': ''}


@pytest.mark.parametrize('categoria', ['maquina', 'libre', 'cardio'])
def test_aprobar_propuesta_crea_catalogo_sin_inventar_maquina_ni_recursos(client, mock_auth, categoria):
    datos = propuesta(categoria)
    recursos_antes, maquinas_antes = len(catalogo._repo.recursos), len(profesor._maquinas_repo.listar())
    resp = client.post('/api/profesor/solicitudes', json=datos, headers=mock_auth.as_profesor())
    assert resp.status_code == 201, resp.get_json()
    solicitud = resp.get_json()['data']
    assert solicitud['recursos'][0]['numero_maquina'] == '99'
    url = f'/api/profesor/admin/solicitudes/{solicitud["id"]}/aprobar'
    resp = client.post(url, headers=mock_auth.as_admin())
    assert resp.status_code == 200, resp.get_json()
    aprobada = resp.get_json()['data']
    ejercicio = catalogo.obtener_ejercicio(aprobada['ejercicio_catalogo_id_creado'], 'mock-gym')
    assert ejercicio['categoria'] == categoria
    assert [r['id'] for r in ejercicio['recursos']] == datos['recurso_ids']
    assert aprobada['maquina_id_creado'] is None
    assert len(profesor._maquinas_repo.listar()) == maquinas_antes
    assert len(catalogo._repo.recursos) == recursos_antes
    cuantos = len(catalogo._repo.ejercicios)
    assert client.post(url, headers=mock_auth.as_admin()).status_code == 400
    assert len(catalogo._repo.ejercicios) == cuantos


@pytest.mark.parametrize('caso', ['ajeno', 'vacio', 'inexistente', 'sin_maquina', 'sin_musculos', 'categoria_invalida'])
def test_propuesta_invalida_no_se_guarda(client, mock_auth, caso):
    datos = propuesta(gym='otro-gym' if caso == 'ajeno' else 'mock-gym')
    if caso == 'vacio': datos['recurso_ids'] = []
    if caso == 'inexistente': datos['recurso_ids'] = [str(uuid4())]
    if caso == 'sin_maquina':
        datos['categoria'] = 'maquina'
        catalogo._repo.recursos[datos['recurso_ids'][0]]['tipo'] = 'infraestructura'
    if caso == 'sin_musculos': datos['categoria'] = 'libre'
    if caso == 'categoria_invalida': datos['categoria'] = 'desconocida'
    antes = len(profesor._solicitudes_repo._solicitudes)
    assert client.post('/api/profesor/solicitudes', json=datos, headers=mock_auth.as_profesor()).status_code == 400
    assert len(profesor._solicitudes_repo._solicitudes) == antes


def test_aprobacion_revalida_recursos_y_conserva_pendiente_si_fallan(client, mock_auth):
    datos = propuesta('maquina')
    solicitud = client.post('/api/profesor/solicitudes', json=datos, headers=mock_auth.as_profesor()).get_json()['data']
    catalogo._repo.recursos[datos['recurso_ids'][0]]['tipo'] = 'infraestructura'
    antes = len(catalogo._repo.ejercicios)
    assert client.post(f'/api/profesor/admin/solicitudes/{solicitud["id"]}/aprobar', headers=mock_auth.as_admin()).status_code == 400
    assert profesor._solicitudes_repo.find_by_id(solicitud['id']).estado == 'pendiente'
    assert len(catalogo._repo.ejercicios) == antes


def test_repositorio_supabase_persiste_prescripcion_y_recupera_json():
    from unittest.mock import Mock
    from app.domain.models import Ejercicio, Rutina
    from app.repositories.supabase_rutinas import SupabaseRutinasRepository, _row_a_ejercicio
    repo = SupabaseRutinasRepository.__new__(SupabaseRutinasRepository)
    repo._sb = Mock()
    repo._sb.table.return_value.insert.return_value.execute.return_value.data = [{'id': 'rutina'}]
    repo.find_by_id = Mock(return_value='creada')
    p = {'intensidad': None, 'duracion_minutos': 20, 'distancia_km': 2.5}
    e = Ejercicio(id='', tipo='libre', nombre='Cardio', series=1, repeticiones='', prescripcion_cardio=p)
    r = Rutina(id='', titulo='Cardio', grupos_musculares=[], alumno_id='alumno', gimnasio_id='gym', ejercicios=[e])
    assert repo.crear(r) == 'creada'
    row = repo._sb.table.return_value.insert.call_args_list[1].args[0][0]
    assert row['prescripcion_cardio'] == p
    assert _row_a_ejercicio({**row, 'id': 'fila'}).prescripcion_cardio == p


def test_aprobar_supabase_usa_una_sola_rpc():
    from unittest.mock import Mock
    from app.repositories.supabase_solicitudes import SupabaseSolicitudesRepository
    repo = SupabaseSolicitudesRepository.__new__(SupabaseSolicitudesRepository)
    repo._sb = Mock()
    repo._sb.rpc.return_value.execute.return_value.data = {'id': 'solicitud', 'estado': 'aprobada',
        'solicitante_id': 'profesor', 'solicitante_nombre': 'Profesor', 'nombre': 'Cardio', 'gimnasio_id': 'gym',
        'categoria': 'cardio', 'recurso_ids': ['recurso'], 'ejercicio_catalogo_id_creado': 'ejercicio'}
    aprobada = repo.aprobar_catalogo(Mock(id='solicitud'), Mock(id='admin', gimnasio_id='gym'))
    assert aprobada.ejercicio_catalogo_id_creado == 'ejercicio'
    repo._sb.rpc.assert_called_once_with('aprobar_solicitud_catalogo', {'p_solicitud_id': 'solicitud', 'p_gimnasio_id': 'gym', 'p_admin_id': 'admin'})
    repo._sb.table.assert_not_called()
