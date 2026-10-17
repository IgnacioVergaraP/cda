"""
Implementación mock del repositorio de rutinas.
"""
from copy import deepcopy
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from app.domain.models import Rutina, Ejercicio
from app.repositories.rutinas_repository import RutinasRepository


def _ahora_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hace_dias(dias: int) -> str:
    dt = datetime.now(timezone.utc) - timedelta(days=dias)
    return dt.isoformat()


_RUTINAS_MOCK: List[Rutina] = [
    # ============ u-alu-001 — Juan Pérez ============
    Rutina(
        id="rt-001",
        titulo="Rutina de espalda y bíceps",
        grupos_musculares=["espalda", "biceps"],
        alumno_id="u-alu-001",
        gimnasio_id="mock-gym",
        profesor_id="u-pro-001",
        profesor_nombre="Prof. Martínez",
        activa=True,
        fecha_creacion=_hace_dias(30),
        ejercicios=[
            Ejercicio(id="ej-001", tipo="maquina", maquina_id="mq-004", series=4, repeticiones="10", peso_sugerido="40 kg"),
            Ejercicio(id="ej-002", tipo="maquina", maquina_id="mq-003", series=4, repeticiones="8-10", peso_sugerido="50 kg"),
            Ejercicio(id="ej-003", tipo="libre", nombre="Face pull con banda elástica",
                      descripcion="Ejercicio para deltoides posterior y trapecio medio.",
                      series=3, repeticiones="12-15", peso_sugerido="Banda media"),
            Ejercicio(id="ej-004", tipo="maquina", maquina_id="mq-009", series=4, repeticiones="10", peso_sugerido="12 kg por mano"),
        ],
    ),
    Rutina(
        id="rt-002",
        titulo="Rutina de pecho y tríceps",
        grupos_musculares=["pecho", "triceps", "hombros"],
        alumno_id="u-alu-001",
        gimnasio_id="mock-gym",
        profesor_id="u-pro-001",
        profesor_nombre="Prof. Martínez",
        activa=True,
        fecha_creacion=_hace_dias(30),
        ejercicios=[
            Ejercicio(id="ej-005", tipo="maquina", maquina_id="mq-001", series=4, repeticiones="8", peso_sugerido="60 kg"),
            Ejercicio(id="ej-006", tipo="maquina", maquina_id="mq-002", series=3, repeticiones="10", peso_sugerido="18 kg por mano"),
            Ejercicio(id="ej-007", tipo="libre", nombre="Fondos en paralelas",
                      descripcion="Empuje vertical para tríceps y pecho inferior.",
                      series=3, repeticiones="Al fallo", peso_sugerido="Corporal"),
        ],
    ),
    Rutina(
        id="rt-003",
        titulo="Rutina de core y estabilidad",
        grupos_musculares=["core"],
        alumno_id="u-alu-001",
        gimnasio_id="mock-gym",
        profesor_id="u-pro-001",
        profesor_nombre="Prof. Martínez",
        activa=True,
        fecha_creacion=_hace_dias(30),
        ejercicios=[
            Ejercicio(id="ej-008", tipo="maquina", maquina_id="mq-010", series=3, repeticiones="45 segundos", peso_sugerido="Corporal"),
            Ejercicio(id="ej-009", tipo="libre", nombre="Dead bug con pelota",
                      descripcion="Anti-extensión lumbar controlada.",
                      series=3, repeticiones="10 por lado", peso_sugerido="Corporal"),
            Ejercicio(id="ej-010", tipo="libre", nombre="Saltos al cajón a una pierna con kettlebell",
                      descripcion="Pliométrico avanzado.",
                      series=3, repeticiones="6 por pierna", peso_sugerido="8 kg"),
        ],
    ),

    # ============ u-alu-002 — María González ============
    Rutina(
        id="rt-004",
        titulo="Rutina de piernas básica",
        grupos_musculares=["piernas", "core"],
        alumno_id="u-alu-002",
        gimnasio_id="mock-gym",
        profesor_id="u-pro-001",
        profesor_nombre="Prof. Martínez",
        activa=True,
        fecha_creacion=_hace_dias(20),
        ejercicios=[
            Ejercicio(id="ej-011", tipo="maquina", maquina_id="mq-005", series=4, repeticiones="10", peso_sugerido="50 kg"),
            Ejercicio(id="ej-012", tipo="maquina", maquina_id="mq-006", series=3, repeticiones="12", peso_sugerido="100 kg"),
            Ejercicio(id="ej-013", tipo="maquina", maquina_id="mq-010", series=3, repeticiones="40 segundos", peso_sugerido="Corporal"),
        ],
    ),

    # ============ u-alu-003 — Carlos Rodríguez ============
    Rutina(
        id="rt-005",
        titulo="Rutina de fuerza — tren superior",
        grupos_musculares=["pecho", "espalda", "hombros", "triceps"],
        alumno_id="u-alu-003",
        gimnasio_id="mock-gym",
        profesor_id="u-pro-001",
        profesor_nombre="Prof. Martínez",
        activa=True,
        fecha_creacion=_hace_dias(15),
        ejercicios=[
            Ejercicio(id="ej-014", tipo="maquina", maquina_id="mq-001", series=5, repeticiones="5", peso_sugerido="75 kg"),
            Ejercicio(id="ej-015", tipo="maquina", maquina_id="mq-003", series=5, repeticiones="5", peso_sugerido="60 kg"),
            Ejercicio(id="ej-016", tipo="maquina", maquina_id="mq-008", series=4, repeticiones="6", peso_sugerido="40 kg"),
            Ejercicio(id="ej-017", tipo="maquina", maquina_id="mq-002", series=3, repeticiones="10", peso_sugerido="22 kg por mano"),
        ],
    ),
]


class MockRutinasRepository(RutinasRepository):

    def __init__(self):
        self._rutinas: List[Rutina] = deepcopy(_RUTINAS_MOCK)

    def _calcular_next_num(self) -> int:
        max_n = 0
        for r in self._rutinas:
            try:
                n = int(r.id.replace("rt-", ""))
                if n > max_n:
                    max_n = n
            except ValueError:
                continue
        return max_n + 1

    def _generar_id(self) -> str:
        return f"rt-{self._calcular_next_num():03d}"

    def listar_por_alumno(self, alumno_id: str, incluir_inactivas: bool = False) -> List[Rutina]:
        result = []
        for r in self._rutinas:
            if r.alumno_id != alumno_id:
                continue
            if not incluir_inactivas and not r.activa:
                continue
            result.append(r)
        return result

    def listar_por_profesor(self, profesor_id: str, incluir_inactivas: bool = False) -> List[Rutina]:
        result = []
        for r in self._rutinas:
            if r.profesor_id != profesor_id or r.creada_por_alumno or r.es_publica or r.rutina_origen_id:
                continue
            if not incluir_inactivas and not r.activa:
                continue
            result.append(r)
        return result

    def find_by_id(self, rutina_id: str) -> Optional[Rutina]:
        for r in self._rutinas:
            if r.id == rutina_id:
                return r
        return None

    def crear(self, rutina: Rutina) -> Rutina:
        rutina.id = self._generar_id()
        rutina.fecha_creacion = _ahora_iso()
        for i, ejercicio in enumerate(rutina.ejercicios):
            if not ejercicio.id:
                ejercicio.id = f"{rutina.id}-ej-{i + 1}"
        self._rutinas.append(rutina)
        return rutina

    def actualizar(self, rutina_id: str, profesor_id: str, data: dict) -> Optional[Rutina]:
        rutina = self.find_by_id(rutina_id)
        if not rutina or rutina.profesor_id != profesor_id or rutina.rutina_origen_id:
            return None
        return self._actualizar_contenido(rutina, data)

    def _actualizar_contenido(self, rutina: Rutina, data: dict) -> Rutina:
        for campo in ("disciplina", "objetivo", "nivel", "equipamiento", "descripcion"):
            if campo in data:
                setattr(rutina, campo, data[campo])
        if "titulo" in data:
            rutina.titulo = data["titulo"]
        if "grupos_musculares" in data:
            rutina.grupos_musculares = list(data["grupos_musculares"])
        if "ejercicios" in data:
            rutina.ejercicios = list(data["ejercicios"])
        rutina.fecha_modificacion = _ahora_iso()
        return rutina

    def archivar(self, rutina_id: str, profesor_id: str) -> Optional[Rutina]:
        rutina = self.find_by_id(rutina_id)
        if not rutina or rutina.profesor_id != profesor_id or rutina.rutina_origen_id:
            return None
        rutina.activa = False
        rutina.fecha_modificacion = _ahora_iso()
        return rutina

    def reactivar(self, rutina_id: str, profesor_id: str) -> Optional[Rutina]:
        rutina = self.find_by_id(rutina_id)
        if not rutina or rutina.profesor_id != profesor_id or rutina.rutina_origen_id:
            return None
        rutina.activa = True
        rutina.fecha_modificacion = _ahora_iso()
        return rutina

    def duplicar(self, rutina_id: str, profesor: dict, nuevo_alumno_id: str) -> Optional[Rutina]:
        original = self.find_by_id(rutina_id)
        if not original:
            return None
        nueva = Rutina(
            id="",
            titulo=original.titulo,
            grupos_musculares=list(original.grupos_musculares),
            alumno_id=nuevo_alumno_id,
            gimnasio_id=original.gimnasio_id,
            profesor_id=profesor["id"],
            profesor_nombre=profesor["nombre"],
            activa=True,
            ejercicios=[
                Ejercicio(
                    id=f"ej-dup-{i+1}",
                    tipo=e.tipo,
                    series=e.series,
                    repeticiones=e.repeticiones,
                    peso_sugerido=e.peso_sugerido,
                    maquina_id=e.maquina_id,
                    nombre=e.nombre,
                    descripcion=e.descripcion,
                    ejercicio_catalogo_id=e.ejercicio_catalogo_id,
                    prescripcion_cardio=e.prescripcion_cardio,
                )
                for i, e in enumerate(original.ejercicios)
            ],
        )
        return self.crear(nueva)

    def listar_publicas(self, gimnasio_id: str, *, profesor_id: str | None = None,
                        disciplina: str = "", nivel: str = "", buscar: str = "",
                        desde: int = 0, limite: int = 24) -> List[Rutina]:
        rows = [r for r in self._rutinas if r.es_publica and r.gimnasio_id == gimnasio_id
                and (r.profesor_id == profesor_id if profesor_id else r.activa)
                and (not disciplina or r.disciplina == disciplina)
                and (not nivel or r.nivel == nivel)
                and (not buscar or buscar.lower() in r.titulo.lower())]
        rows.sort(key=lambda r: (r.fecha_creacion, r.id), reverse=True)
        return rows[desde:desde + limite + 1]

    def buscar_copia(self, alumno_id: str, origen_id: str) -> Optional[Rutina]:
        return next((r for r in self._rutinas if r.alumno_id == alumno_id
                     and r.rutina_origen_id == origen_id), None)

    def actualizar_personal(self, rutina_id: str, alumno_id: str, data: dict) -> Optional[Rutina]:
        rutina = self.find_by_id(rutina_id)
        if (not rutina or rutina.alumno_id != alumno_id or rutina.es_publica
                or not (rutina.creada_por_alumno or rutina.rutina_origen_id)):
            return None
        return self._actualizar_contenido(rutina, data)
