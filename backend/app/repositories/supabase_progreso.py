"""
Implementación del repositorio de progreso contra Supabase.
"""
from datetime import datetime
from uuid import UUID
from typing import List, Optional
from app.domain.models import RegistroSerie
from app.repositories.progreso_repository import ProgresoRepository
from app.extensions import get_supabase


_COLUMNS = (
    "id,alumno_id,fecha,ejercicio_tipo,maquina_id,nombre_libre,rutina_id,"
    "numero_serie,peso,repeticiones,gimnasio_id,ejercicio_catalogo_id,modalidad,"
    "peso_valor,peso_unidad,peso_kg,repeticiones_valor,duracion_segundos,distancia_metros,"
    "vinculos:progreso_recursos(recurso:recursos_gimnasio(id,nombre,tipo,numero_maquina,gimnasio_id))"
)


def _row_a_registro(row: dict) -> RegistroSerie:
    fecha = row.get("fecha")
    return RegistroSerie(
        id=row["id"],
        alumno_id=row["alumno_id"],
        fecha=fecha.isoformat() if hasattr(fecha, "isoformat") else (fecha or ""),
        ejercicio_tipo=row["ejercicio_tipo"],
        numero_serie=row["numero_serie"],
        peso=row["peso"],
        repeticiones=row["repeticiones"],
        maquina_id=row.get("maquina_id"),
        nombre_libre=row.get("nombre_libre"),
        rutina_id=row.get("rutina_id"),
        gimnasio_id=row["gimnasio_id"],
        ejercicio_catalogo_id=row.get("ejercicio_catalogo_id"),
        modalidad=row.get("modalidad", "fuerza"),
        peso_valor=row.get("peso_valor"), peso_unidad=row.get("peso_unidad"), peso_kg=row.get("peso_kg"),
        repeticiones_valor=row.get("repeticiones_valor"),
        duracion_segundos=row.get("duracion_segundos"), distancia_metros=row.get("distancia_metros"),
        recursos=[v["recurso"] for v in row.get("vinculos", []) if v.get("recurso")],
    )


class SupabaseProgresoRepository(ProgresoRepository):

    def __init__(self):
        self._sb = get_supabase()

    # -------- Lectura --------

    def iterar_uso_recursos(self, gimnasio_id, desde, hasta):
        """Lectura por gimnasio y período, sin una consulta por alumno ni límite de 1000 registros."""
        posicion = 0
        columnas = (
            "id,alumno_id,gimnasio_id,fecha,modalidad,"
            "alumno:profiles!progreso_registros_alumno_id_fkey!inner(rol),"
            "vinculos:progreso_recursos(recurso_id,gimnasio_id)"
        )
        while True:
            rows = (self._sb.table("progreso_registros").select(columnas)
                    .eq("gimnasio_id", gimnasio_id).eq("alumno.rol", "alumno")
                    .gte("fecha", desde).lt("fecha", hasta).order("fecha").order("id")
                    .range(posicion, posicion + 999).execute().data or [])
            yield from rows
            if len(rows) < 1000:
                break
            posicion += len(rows)

    def listar_por_alumno(self, alumno_id: str) -> List[RegistroSerie]:
        resp = (
            self._sb.table("progreso_registros")
            .select(_COLUMNS)
            .eq("alumno_id", alumno_id)
            .order("fecha", desc=False)
            .execute()
        )
        return [_row_a_registro(row) for row in (resp.data or [])]

    def listar_por_ejercicio(self, alumno_id: str, ejercicio_key: str) -> List[RegistroSerie]:
        query = self._sb.table("progreso_registros").select(_COLUMNS).eq("alumno_id", alumno_id)
        resp = self._filtrar_ejercicio(query, ejercicio_key).order("fecha").execute()
        return [_row_a_registro(row) for row in (resp.data or [])]

    def listar_sesion(self, alumno_id: str, ejercicio_key: str, fecha_dia: str) -> List[RegistroSerie]:
        key = ejercicio_key.strip().lower()
        # Filtro de día: comparamos los primeros 10 chars de fecha (YYYY-MM-DD)
        # PostgREST soporta gte/lte sobre timestamptz
        inicio_dia = f"{fecha_dia}T00:00:00+00:00"
        fin_dia = f"{fecha_dia}T23:59:59.999999+00:00"

        query = (
            self._sb.table("progreso_registros")
            .select(_COLUMNS)
            .eq("alumno_id", alumno_id)
            .gte("fecha", inicio_dia)
            .lte("fecha", fin_dia)
        )

        query = self._filtrar_ejercicio(query, key)

        resp = query.order("numero_serie").execute()
        return [_row_a_registro(row) for row in (resp.data or [])]

    def find_by_id(self, registro_id: str) -> Optional[RegistroSerie]:
        resp = (
            self._sb.table("progreso_registros")
            .select(_COLUMNS)
            .eq("id", registro_id)
            .limit(1)
            .execute()
        )
        if not resp.data:
            return None
        return _row_a_registro(resp.data[0])

    def siguiente_numero_serie(self, alumno_id: str, ejercicio_key: str, fecha_iso_dia: str) -> int:
        series = self.listar_sesion(alumno_id, ejercicio_key, fecha_iso_dia)
        if not series:
            return 1
        return max(s.numero_serie for s in series) + 1

    # -------- Escritura --------

    def crear(self, registro: RegistroSerie) -> RegistroSerie:
        if registro.ejercicio_catalogo_id:
            payload = registro.to_dict()
            payload.pop("id")
            payload.pop("recursos")
            resp = self._sb.rpc("registrar_entrenamiento_catalogo", {
                "p_registro": payload, "p_recurso_ids": [r["id"] for r in registro.recursos],
            }).execute()
            creado = self.find_by_id(resp.data) if resp.data else None
            if not creado:
                raise RuntimeError("No se pudo crear el registro de entrenamiento.")
            return creado
        payload = {
            "alumno_id": registro.alumno_id,
            "fecha": registro.fecha or datetime.utcnow().isoformat() + "Z",
            "ejercicio_tipo": registro.ejercicio_tipo,
            "maquina_id": registro.maquina_id if registro.ejercicio_tipo == "maquina" else None,
            "nombre_libre": registro.nombre_libre if registro.ejercicio_tipo == "libre" else None,
            "rutina_id": registro.rutina_id,
            "gimnasio_id": registro.gimnasio_id,
            "numero_serie": registro.numero_serie,
            "peso": registro.peso,
            "repeticiones": registro.repeticiones,
            **{k: getattr(registro, k) for k in ("modalidad", "peso_valor", "peso_unidad", "peso_kg",
                                               "repeticiones_valor", "duracion_segundos", "distancia_metros")},
        }
        resp = self._sb.table("progreso_registros").insert(payload).execute()
        if not resp.data:
            raise RuntimeError("No se pudo crear el registro de progreso.")
        return _row_a_registro(resp.data[0])

    def actualizar(
        self,
        registro_id: str,
        alumno_id: str,
        peso: str,
        repeticiones: str,
        **metricas,
    ) -> Optional[RegistroSerie]:
        # Verificamos pertenencia
        resp = (
            self._sb.table("progreso_registros")
            .select("id,alumno_id")
            .eq("id", registro_id)
            .limit(1)
            .execute()
        )
        if not resp.data or resp.data[0]["alumno_id"] != alumno_id:
            return None

        update_resp = (
            self._sb.table("progreso_registros")
            .update({"peso": peso, "repeticiones": repeticiones, **metricas})
            .eq("id", registro_id)
            .execute()
        )
        if not update_resp.data:
            return None
        return _row_a_registro(update_resp.data[0])

    # -------- Helpers --------

    @classmethod
    def _filtrar_ejercicio(cls, query, ejercicio_key):
        key = ejercicio_key.strip().lower()
        if key.startswith("catalogo:"):
            return query.eq("ejercicio_catalogo_id", key[9:])
        if cls._parece_uuid(key):
            return query.eq("ejercicio_tipo", "maquina").eq("maquina_id", key)
        literal = key.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        return query.eq("ejercicio_tipo", "libre").ilike("nombre_libre", literal)

    @staticmethod
    def _parece_uuid(valor: str) -> bool:
        try:
            UUID(valor)
            return True
        except (ValueError, TypeError, AttributeError):
            return False
