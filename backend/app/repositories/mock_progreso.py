"""
Implementación mock del repositorio de progreso.
"""
from copy import deepcopy
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from app.domain.models import RegistroSerie
from app.repositories.progreso_repository import ProgresoRepository


def _fecha(dias_atras: int, hora: int = 19, minuto: int = 30) -> str:
    dt = datetime.now().replace(hour=hora, minute=minuto, second=0, microsecond=0)
    dt = dt - timedelta(days=dias_atras)
    return dt.isoformat()


_REGISTROS_MOCK: List[RegistroSerie] = []


def _agregar(alumno_id, dias_atras, tipo, peso, reps, num, maquina=None, libre=None, rutina=None, hora=19, minuto=0):
    _REGISTROS_MOCK.append(
        RegistroSerie(
            id=f"rs-{len(_REGISTROS_MOCK) + 1:04d}",
            alumno_id=alumno_id,
            fecha=_fecha(dias_atras, hora, minuto),
            ejercicio_tipo=tipo,
            numero_serie=num,
            peso=peso,
            repeticiones=reps,
            gimnasio_id="mock-gym",
            maquina_id=maquina,
            nombre_libre=libre,
            rutina_id=rutina,
        )
    )


# ============ u-alu-001 — Juan Pérez ============
# Sesión de hoy: press de banca (rutina)
_agregar("u-alu-001", 0, "maquina", "60 kg", "10", 1, maquina="mq-001", rutina="rt-002", hora=19, minuto=10)
_agregar("u-alu-001", 0, "maquina", "60 kg", "9",  2, maquina="mq-001", rutina="rt-002", hora=19, minuto=14)
_agregar("u-alu-001", 0, "maquina", "60 kg", "8",  3, maquina="mq-001", rutina="rt-002", hora=19, minuto=18)
# Hace 3 días: press de banca
_agregar("u-alu-001", 3, "maquina", "57.5 kg", "10", 1, maquina="mq-001", rutina="rt-002")
_agregar("u-alu-001", 3, "maquina", "57.5 kg", "10", 2, maquina="mq-001", rutina="rt-002")
# Hace 7 días: press de banca
_agregar("u-alu-001", 7, "maquina", "55 kg", "10", 1, maquina="mq-001", rutina="rt-002")
_agregar("u-alu-001", 7, "maquina", "55 kg", "9",  2, maquina="mq-001", rutina="rt-002")
# Hace 10 días: sentadilla
_agregar("u-alu-001", 10, "maquina", "80 kg", "8", 1, maquina="mq-005")
_agregar("u-alu-001", 10, "maquina", "80 kg", "8", 2, maquina="mq-005")
_agregar("u-alu-001", 10, "maquina", "80 kg", "7", 3, maquina="mq-005")
# Hace 14 días: sentadilla
_agregar("u-alu-001", 14, "maquina", "77.5 kg", "8", 1, maquina="mq-005")
_agregar("u-alu-001", 14, "maquina", "77.5 kg", "8", 2, maquina="mq-005")
# Hace 5 días: plancha
_agregar("u-alu-001", 5, "maquina", "corporal", "45 segundos", 1, maquina="mq-010", hora=20, minuto=0)
_agregar("u-alu-001", 5, "maquina", "corporal", "50 segundos", 2, maquina="mq-010", hora=20, minuto=3)
# Hace 4 días: face pull libre
_agregar("u-alu-001", 4, "libre", "Banda media", "15", 1, libre="Face pull con banda elástica", rutina="rt-001", hora=19, minuto=30)
_agregar("u-alu-001", 4, "libre", "Banda media", "15", 2, libre="Face pull con banda elástica", rutina="rt-001", hora=19, minuto=34)

# ============ u-alu-002 — María González ============
# Hoy: sentadilla
_agregar("u-alu-002", 0, "maquina", "50 kg", "10", 1, maquina="mq-005", hora=18, minuto=0)
_agregar("u-alu-002", 0, "maquina", "50 kg", "10", 2, maquina="mq-005", hora=18, minuto=5)
# Hace 2 días: sentadilla
_agregar("u-alu-002", 2, "maquina", "47.5 kg", "10", 1, maquina="mq-005")
_agregar("u-alu-002", 2, "maquina", "47.5 kg", "10", 2, maquina="mq-005")
# Hace 5 días: curl bíceps
_agregar("u-alu-002", 5, "maquina", "8 kg por mano", "12", 1, maquina="mq-009")
_agregar("u-alu-002", 5, "maquina", "8 kg por mano", "12", 2, maquina="mq-009")

# ============ u-alu-003 — Carlos Rodríguez ============
# Hoy: press de banca
_agregar("u-alu-003", 0, "maquina", "75 kg", "8", 1, maquina="mq-001", hora=20, minuto=0)
_agregar("u-alu-003", 0, "maquina", "75 kg", "8", 2, maquina="mq-001", hora=20, minuto=5)
_agregar("u-alu-003", 0, "maquina", "75 kg", "7", 3, maquina="mq-001", hora=20, minuto=10)
# Hace 4 días: press de banca
_agregar("u-alu-003", 4, "maquina", "72.5 kg", "8", 1, maquina="mq-001")
_agregar("u-alu-003", 4, "maquina", "72.5 kg", "8", 2, maquina="mq-001")
# Hace 8 días: press inclinado
_agregar("u-alu-003", 8, "maquina", "22 kg por mano", "10", 1, maquina="mq-002")
_agregar("u-alu-003", 8, "maquina", "22 kg por mano", "9",  2, maquina="mq-002")

# ============ u-alu-004 — Lucía Fernández ============
# Hace 6 días: plancha
_agregar("u-alu-004", 6, "maquina", "corporal", "40 segundos", 1, maquina="mq-010")
_agregar("u-alu-004", 6, "maquina", "corporal", "35 segundos", 2, maquina="mq-010")


class MockProgresoRepository(ProgresoRepository):

    def __init__(self, usuarios_repo=None):
        self._registros: List[RegistroSerie] = deepcopy(_REGISTROS_MOCK)
        from app.repositories.mock_usuarios import MockUsuariosRepository
        self._usuarios = usuarios_repo or MockUsuariosRepository()

    def iterar_uso_recursos(self, gimnasio_id, desde, hasta):
        inicio, fin = datetime.fromisoformat(desde), datetime.fromisoformat(hasta)
        for r in self._registros:
            if r.gimnasio_id != gimnasio_id:
                continue
            alumno = self._usuarios.find_by_id(r.alumno_id)
            if not alumno or alumno.rol != "alumno":
                continue
            try:
                fecha = datetime.fromisoformat(r.fecha)
                if fecha.tzinfo is None:
                    fecha = fecha.replace(tzinfo=timezone.utc)
            except (TypeError, ValueError):
                continue
            if inicio <= fecha < fin:
                yield {"id": r.id, "alumno_id": r.alumno_id, "gimnasio_id": r.gimnasio_id,
                       "fecha": r.fecha, "modalidad": r.modalidad,
                       "vinculos": [{"recurso_id": recurso["id"], "gimnasio_id": recurso.get("gimnasio_id", r.gimnasio_id)}
                                    for recurso in r.recursos]}

    def _calcular_next_num(self) -> int:
        max_n = 0
        for r in self._registros:
            try:
                n = int(r.id.replace("rs-", ""))
                if n > max_n:
                    max_n = n
            except ValueError:
                continue
        return max_n + 1

    def _generar_id(self) -> str:
        return f"rs-{self._calcular_next_num():04d}"

    def crear(self, registro: RegistroSerie) -> RegistroSerie:
        registro.id = self._generar_id()
        self._registros.append(registro)
        return registro

    def listar_por_alumno(self, alumno_id: str) -> List[RegistroSerie]:
        return [r for r in self._registros if r.alumno_id == alumno_id]

    def listar_por_ejercicio(self, alumno_id: str, ejercicio_key: str) -> List[RegistroSerie]:
        key = ejercicio_key.strip().lower()
        return [r for r in self._registros if r.alumno_id == alumno_id and (
            (key.startswith("catalogo:") and r.ejercicio_catalogo_id == key[9:])
            or (not key.startswith("catalogo:") and (
                (r.ejercicio_tipo == "maquina" and (r.maquina_id or "").lower() == key)
                or (r.ejercicio_tipo == "libre" and (r.nombre_libre or "").lower() == key)))
        )]

    def listar_sesion(self, alumno_id: str, ejercicio_key: str, fecha_dia: str) -> List[RegistroSerie]:
        return sorted([r for r in self.listar_por_ejercicio(alumno_id, ejercicio_key)
                       if r.fecha.startswith(fecha_dia)], key=lambda r: r.numero_serie)

    def siguiente_numero_serie(self, alumno_id: str, ejercicio_key: str, fecha_iso_dia: str) -> int:
        return max((r.numero_serie for r in self.listar_sesion(alumno_id, ejercicio_key, fecha_iso_dia)), default=0) + 1

    def find_by_id(self, registro_id: str) -> Optional[RegistroSerie]:
        for r in self._registros:
            if r.id == registro_id:
                return r
        return None

    def actualizar(
        self,
        registro_id: str,
        alumno_id: str,
        peso: str,
        repeticiones: str,
        **metricas,
    ) -> Optional[RegistroSerie]:
        registro = self.find_by_id(registro_id)
        if not registro or registro.alumno_id != alumno_id:
            return None
        registro.peso = peso
        registro.repeticiones = repeticiones
        for k, v in metricas.items():
            setattr(registro, k, v)
        return registro
