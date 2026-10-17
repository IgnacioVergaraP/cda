from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Gimnasio:
    id: str
    nombre: str
    slug: str
    color_primario: str = "#2f6f4e"
    logo_url: Optional[str] = None
    tabs_habilitadas: Optional[List[str]] = None
    activo: bool = True
    fecha_creacion: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "nombre": self.nombre,
            "slug": self.slug,
            "color_primario": self.color_primario,
            "logo_url": self.logo_url,
            "tabs_habilitadas": list(self.tabs_habilitadas) if self.tabs_habilitadas else [],
            "activo": self.activo,
            "fecha_creacion": self.fecha_creacion,
        }


@dataclass
class Usuario:
    id: str
    email: str
    nombre: str
    rol: str
    gimnasio_id: str
    activo: bool = True

    altura: Optional[float] = None
    peso_actual: Optional[float] = None
    peso_objetivo: Optional[float] = None
    imagen_url: Optional[str] = None

    porcentaje_grasa: Optional[float] = None
    fecha_medicion_grasa: Optional[str] = None
    origen_grasa: Optional[str] = None
    cargado_por_id: Optional[str] = None

    bio: Optional[str] = None
    especialidades: Optional[List[str]] = None
    anios_experiencia: Optional[int] = None
    telefono: Optional[str] = None

    notas_profesor: Optional[str] = None

    fecha_alta: Optional[str] = None

    def to_public_dict(self) -> dict:
        return self._to_dict_con_notas(True)

    def to_profesor_view_dict(self) -> dict:
        return self._to_dict_con_notas(True)

    def to_public_dict_for(self, rol_solicitante: str) -> dict:
        incluir_notas = rol_solicitante in ("profesor", "gimnasio")
        return self._to_dict_con_notas(incluir_notas)

    def _to_dict_con_notas(self, incluir_notas: bool) -> dict:
        data = {
            "id": self.id,
            "email": self.email,
            "nombre": self.nombre,
            "rol": self.rol,
            "gimnasio_id": self.gimnasio_id,
            "activo": self.activo,
            "altura": self.altura,
            "peso_actual": self.peso_actual,
            "peso_objetivo": self.peso_objetivo,
            "imagen_url": self.imagen_url,
            "porcentaje_grasa": self.porcentaje_grasa,
            "fecha_medicion_grasa": self.fecha_medicion_grasa,
            "origen_grasa": self.origen_grasa,
            "cargado_por_id": self.cargado_por_id,
            "bio": self.bio,
            "especialidades": list(self.especialidades) if self.especialidades else None,
            "anios_experiencia": self.anios_experiencia,
            "telefono": self.telefono,
            "fecha_alta": self.fecha_alta,
        }
        if incluir_notas:
            data["notas_profesor"] = self.notas_profesor
        return data


@dataclass
class Maquina:
    id: str
    nombre: str
    grupos_musculares: List[str]
    descripcion: str
    video_url: str
    gimnasio_id: str
    imagen_url: str = ""

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "nombre": self.nombre,
            "grupos_musculares": list(self.grupos_musculares),
            "descripcion": self.descripcion,
            "video_url": self.video_url,
            "imagen_url": self.imagen_url,
            "gimnasio_id": self.gimnasio_id,
        }


@dataclass
class Ejercicio:
    id: str
    tipo: str
    series: int
    repeticiones: str
    peso_sugerido: Optional[str] = None
    maquina_id: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None


@dataclass
class Rutina:
    id: str
    titulo: str
    grupos_musculares: List[str]
    alumno_id: Optional[str]
    gimnasio_id: str
    profesor_id: Optional[str] = None
    profesor_nombre: Optional[str] = None
    activa: bool = True
    ejercicios: List[Ejercicio] = field(default_factory=list)
    fecha_creacion: str = ""
    fecha_modificacion: Optional[str] = None
    creada_por_alumno: bool = False
    es_publica: bool = False
    rutina_origen_id: Optional[str] = None
    disciplina: Optional[str] = None
    objetivo: Optional[str] = None
    nivel: Optional[str] = None
    equipamiento: Optional[str] = None
    descripcion: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "titulo": self.titulo,
            "grupos_musculares": list(self.grupos_musculares),
            "alumno_id": self.alumno_id,
            "gimnasio_id": self.gimnasio_id,
            "profesor_id": self.profesor_id,
            "profesor_nombre": self.profesor_nombre,
            "creada_por_alumno": self.creada_por_alumno,
            "es_publica": self.es_publica,
            "rutina_origen_id": self.rutina_origen_id,
            "disciplina": self.disciplina,
            "objetivo": self.objetivo,
            "nivel": self.nivel,
            "equipamiento": self.equipamiento,
            "descripcion": self.descripcion,
            "activa": self.activa,
            "fecha_creacion": self.fecha_creacion,
            "fecha_modificacion": self.fecha_modificacion,
            "ejercicios": [self._ejercicio_base(e) for e in self.ejercicios],
        }

    def to_dict_resuelto(self, maquinas_por_id: dict) -> dict:
        base = self.to_dict()
        base["ejercicios"] = [
            self._ejercicio_resuelto(e, maquinas_por_id) for e in self.ejercicios
        ]
        return base

    @staticmethod
    def _ejercicio_base(e: Ejercicio) -> dict:
        base = {
            "id": e.id,
            "tipo": e.tipo,
            "series": e.series,
            "repeticiones": e.repeticiones,
            "peso_sugerido": e.peso_sugerido,
        }
        if e.tipo == "maquina":
            base["maquina_id"] = e.maquina_id
        else:
            base["nombre"] = e.nombre
            base["descripcion"] = e.descripcion
        return base

    @staticmethod
    def _ejercicio_resuelto(e: Ejercicio, maquinas_por_id: dict) -> dict:
        base = Rutina._ejercicio_base(e)
        if e.tipo == "maquina":
            m = maquinas_por_id.get(e.maquina_id)
            if m:
                base["maquina"] = {
                    "id": m.id,
                    "nombre": m.nombre,
                    "grupos_musculares": list(m.grupos_musculares),
                    "imagen_url": m.imagen_url,
                    "descripcion": m.descripcion,
                    "video_url": m.video_url,
                }
            else:
                base["maquina"] = None
        return base


@dataclass
class RegistroSerie:
    id: str
    alumno_id: str
    fecha: str
    ejercicio_tipo: str
    numero_serie: int
    peso: str
    repeticiones: str
    gimnasio_id: str
    maquina_id: Optional[str] = None
    nombre_libre: Optional[str] = None
    rutina_id: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "alumno_id": self.alumno_id,
            "fecha": self.fecha,
            "ejercicio_tipo": self.ejercicio_tipo,
            "numero_serie": self.numero_serie,
            "peso": self.peso,
            "repeticiones": self.repeticiones,
            "gimnasio_id": self.gimnasio_id,
            "maquina_id": self.maquina_id,
            "nombre_libre": self.nombre_libre,
            "rutina_id": self.rutina_id,
        }


@dataclass
class SolicitudEjercicio:
    id: str
    tipo_solicitud: str
    estado: str
    solicitante_id: str
    solicitante_nombre: str
    gimnasio_id: str
    nombre: str
    grupos_musculares: List[str]
    descripcion: str
    video_url: str
    imagen_url: str = ""
    maquina_id_objetivo: Optional[str] = None
    maquina_id_creado: Optional[str] = None
    revisado_por_id: Optional[str] = None
    revisado_por_nombre: Optional[str] = None
    motivo_rechazo: Optional[str] = None
    fecha_creacion: str = ""
    fecha_revision: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tipo_solicitud": self.tipo_solicitud,
            "estado": self.estado,
            "solicitante_id": self.solicitante_id,
            "solicitante_nombre": self.solicitante_nombre,
            "gimnasio_id": self.gimnasio_id,
            "nombre": self.nombre,
            "grupos_musculares": list(self.grupos_musculares),
            "descripcion": self.descripcion,
            "video_url": self.video_url,
            "imagen_url": self.imagen_url,
            "maquina_id_objetivo": self.maquina_id_objetivo,
            "maquina_id_creado": self.maquina_id_creado,
            "revisado_por_id": self.revisado_por_id,
            "revisado_por_nombre": self.revisado_por_nombre,
            "motivo_rechazo": self.motivo_rechazo,
            "fecha_creacion": self.fecha_creacion,
            "fecha_revision": self.fecha_revision,
        }


@dataclass
class Reporte:
    id: str
    estado: str
    tipo: str
    prioridad: str
    descripcion: str
    reportante_id: str
    reportante_nombre: str
    gimnasio_id: str
    maquina_id: Optional[str] = None
    maquina_nombre: Optional[str] = None
    foto_url: Optional[str] = None
    resolucion: Optional[str] = None
    revisado_por_id: Optional[str] = None
    revisado_por_nombre: Optional[str] = None
    fecha_creacion: str = ""
    fecha_revision: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "estado": self.estado,
            "tipo": self.tipo,
            "prioridad": self.prioridad,
            "descripcion": self.descripcion,
            "reportante_id": self.reportante_id,
            "reportante_nombre": self.reportante_nombre,
            "gimnasio_id": self.gimnasio_id,
            "maquina_id": self.maquina_id,
            "maquina_nombre": self.maquina_nombre,
            "foto_url": self.foto_url,
            "resolucion": self.resolucion,
            "revisado_por_id": self.revisado_por_id,
            "revisado_por_nombre": self.revisado_por_nombre,
            "fecha_creacion": self.fecha_creacion,
            "fecha_revision": self.fecha_revision,
        }


@dataclass
class SolicitudRutina:
    id: str
    estado: str
    alumno_id: str
    alumno_nombre: str
    gimnasio_id: str
    objetivo: str
    dias_por_semana: int
    comentarios: Optional[str] = None
    grupos_interes: Optional[List[str]] = None
    profesor_preferido_id: Optional[str] = None
    profesor_preferido_nombre: Optional[str] = None
    profesor_id: Optional[str] = None
    profesor_nombre: Optional[str] = None
    rutina_id: Optional[str] = None
    mensaje_resolucion: Optional[str] = None
    motivo_rechazo: Optional[str] = None
    estado_liberacion: Optional[str] = None
    fecha_liberacion_solicitada: Optional[str] = None
    liberacion_revisada_por_id: Optional[str] = None
    liberacion_revisada_por_nombre: Optional[str] = None
    liberacion_motivo_rechazo: Optional[str] = None
    fecha_creacion: str = ""
    fecha_tomada: Optional[str] = None
    fecha_revision: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "estado": self.estado,
            "alumno_id": self.alumno_id,
            "alumno_nombre": self.alumno_nombre,
            "gimnasio_id": self.gimnasio_id,
            "objetivo": self.objetivo,
            "dias_por_semana": self.dias_por_semana,
            "comentarios": self.comentarios,
            "grupos_interes": list(self.grupos_interes) if self.grupos_interes else None,
            "profesor_preferido_id": self.profesor_preferido_id,
            "profesor_preferido_nombre": self.profesor_preferido_nombre,
            "profesor_id": self.profesor_id,
            "profesor_nombre": self.profesor_nombre,
            "rutina_id": self.rutina_id,
            "mensaje_resolucion": self.mensaje_resolucion,
            "motivo_rechazo": self.motivo_rechazo,
            "estado_liberacion": self.estado_liberacion,
            "fecha_liberacion_solicitada": self.fecha_liberacion_solicitada,
            "liberacion_revisada_por_id": self.liberacion_revisada_por_id,
            "liberacion_revisada_por_nombre": self.liberacion_revisada_por_nombre,
            "liberacion_motivo_rechazo": self.liberacion_motivo_rechazo,
            "fecha_creacion": self.fecha_creacion,
            "fecha_tomada": self.fecha_tomada,
            "fecha_revision": self.fecha_revision,
        }


@dataclass
class Horario:
    id: str
    profesor_id: str
    profesor_nombre: str
    gimnasio_id: str
    dia_semana: int
    hora_inicio: str
    hora_fin: str
    notas: Optional[str] = None
    fecha_creacion: str = ""

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "profesor_id": self.profesor_id,
            "profesor_nombre": self.profesor_nombre,
            "gimnasio_id": self.gimnasio_id,
            "dia_semana": self.dia_semana,
            "hora_inicio": self.hora_inicio,
            "hora_fin": self.hora_fin,
            "notas": self.notas,
            "fecha_creacion": self.fecha_creacion,
        }


@dataclass
class Mantenimiento:
    id: str
    maquina_id: str
    maquina_nombre: str
    fecha: str
    tipo: str
    gimnasio_id: str
    notas: Optional[str] = None
    realizado_por_id: Optional[str] = None
    realizado_por_nombre: Optional[str] = None
    origen: str = "manual"
    reporte_id: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "maquina_id": self.maquina_id,
            "maquina_nombre": self.maquina_nombre,
            "fecha": self.fecha,
            "tipo": self.tipo,
            "gimnasio_id": self.gimnasio_id,
            "notas": self.notas,
            "realizado_por_id": self.realizado_por_id,
            "realizado_por_nombre": self.realizado_por_nombre,
            "origen": self.origen,
            "reporte_id": self.reporte_id,
        }