"""
Implementación del repositorio de rutinas contra Supabase.

Usa dos tablas: public.rutinas y public.rutina_ejercicios.
Evita N+1 con un solo SELECT de rutinas + un solo SELECT batch de ejercicios
+ un solo SELECT batch de las máquinas referenciadas.
"""
from typing import List, Optional, Dict
from app.domain.models import Rutina, Ejercicio
from app.repositories.rutinas_repository import RutinasRepository
from app.extensions import get_supabase


_COLS_RUTINA = (
    "id,alumno_id,titulo,grupos_musculares,profesor_id,profesor_nombre,"
    "activa,fecha_creacion,fecha_modificacion,gimnasio_id,creada_por_alumno,es_publica,rutina_origen_id,"
    "disciplina,objetivo,nivel,equipamiento,descripcion"
)
_COLS_EJERCICIO = (
    "id,rutina_id,posicion,tipo,maquina_id,nombre_libre,descripcion_libre,"
    "series,repeticiones,peso_sugerido"
)


def _row_a_ejercicio(row: dict) -> Ejercicio:
    """Traduce una fila de rutina_ejercicios al dataclass Ejercicio."""
    tipo = row["tipo"]
    return Ejercicio(
        id=row["id"],
        tipo=tipo,
        series=row["series"],
        repeticiones=row["repeticiones"],
        peso_sugerido=row.get("peso_sugerido"),
        maquina_id=row.get("maquina_id") if tipo == "maquina" else None,
        nombre=row.get("nombre_libre") if tipo == "libre" else None,
        descripcion=row.get("descripcion_libre") if tipo == "libre" else None,
    )


def _row_a_rutina(row: dict, ejercicios: List[Ejercicio]) -> Rutina:
    fecha_mod = row.get("fecha_modificacion")
    fecha_cre = row.get("fecha_creacion")
    return Rutina(
        id=row["id"],
        titulo=row["titulo"],
        grupos_musculares=list(row.get("grupos_musculares") or []),
        alumno_id=row["alumno_id"],
        gimnasio_id=row["gimnasio_id"],
        profesor_id=row.get("profesor_id"),
        profesor_nombre=row.get("profesor_nombre"),
        activa=row.get("activa", True),
        creada_por_alumno=row.get("creada_por_alumno", False),
        es_publica=row.get("es_publica", False),
        rutina_origen_id=row.get("rutina_origen_id"),
        disciplina=row.get("disciplina"), objetivo=row.get("objetivo"),
        nivel=row.get("nivel"), equipamiento=row.get("equipamiento"),
        descripcion=row.get("descripcion"),
        ejercicios=ejercicios,
        fecha_creacion=fecha_cre.isoformat() if hasattr(fecha_cre, "isoformat") else (fecha_cre or ""),
        fecha_modificacion=fecha_mod.isoformat() if hasattr(fecha_mod, "isoformat") else fecha_mod,
    )


def _cargar_ejercicios_para_rutinas(rutina_ids: List[str]) -> Dict[str, List[Ejercicio]]:
    """
    Devuelve un dict {rutina_id: [Ejercicio, ...]} con un solo SELECT.
    Ordena por posicion dentro de cada rutina.
    """
    if not rutina_ids:
        return {}

    sb = get_supabase()
    resp = (
        sb.table("rutina_ejercicios")
        .select(_COLS_EJERCICIO)
        .in_("rutina_id", rutina_ids)
        .order("rutina_id")
        .order("posicion")
        .execute()
    )

    por_rutina: Dict[str, List[Ejercicio]] = {rid: [] for rid in rutina_ids}
    for row in (resp.data or []):
        por_rutina.setdefault(row["rutina_id"], []).append(_row_a_ejercicio(row))
    return por_rutina


class SupabaseRutinasRepository(RutinasRepository):

    def __init__(self):
        self._sb = get_supabase()

    # -------- Listar --------

    def listar_por_alumno(self, alumno_id: str, incluir_inactivas: bool = False) -> List[Rutina]:
        query = (
            self._sb.table("rutinas")
            .select(_COLS_RUTINA)
            .eq("alumno_id", alumno_id)
            .order("fecha_creacion", desc=True)
        )
        if not incluir_inactivas:
            query = query.eq("activa", True)

        resp = query.execute()
        rows = resp.data or []
        if not rows:
            return []

        ids = [r["id"] for r in rows]
        ejercicios_por_rutina = _cargar_ejercicios_para_rutinas(ids)

        return [
            _row_a_rutina(row, ejercicios_por_rutina.get(row["id"], []))
            for row in rows
        ]

    def listar_por_profesor(self, profesor_id: str, incluir_inactivas: bool = False) -> List[Rutina]:
        query = (
            self._sb.table("rutinas")
            .select(_COLS_RUTINA)
            .eq("profesor_id", profesor_id)
            .eq("creada_por_alumno", False)
            .eq("es_publica", False)
            .is_("rutina_origen_id", "null")
            .order("fecha_creacion", desc=True)
        )
        if not incluir_inactivas:
            query = query.eq("activa", True)

        resp = query.execute()
        rows = resp.data or []
        if not rows:
            return []

        ids = [r["id"] for r in rows]
        ejercicios_por_rutina = _cargar_ejercicios_para_rutinas(ids)

        return [
            _row_a_rutina(row, ejercicios_por_rutina.get(row["id"], []))
            for row in rows
        ]

    def find_by_id(self, rutina_id: str) -> Optional[Rutina]:
        resp = (
            self._sb.table("rutinas")
            .select(_COLS_RUTINA)
            .eq("id", rutina_id)
            .limit(1)
            .execute()
        )
        if not resp.data:
            return None
        row = resp.data[0]
        ejercicios = _cargar_ejercicios_para_rutinas([rutina_id]).get(rutina_id, [])
        return _row_a_rutina(row, ejercicios)

    def listar_publicas(self, gimnasio_id: str, *, profesor_id: str | None = None,
                        disciplina: str = "", nivel: str = "", buscar: str = "",
                        desde: int = 0, limite: int = 24) -> List[Rutina]:
        query = (self._sb.table("rutinas").select(_COLS_RUTINA)
                 .eq("gimnasio_id", gimnasio_id).eq("es_publica", True))
        if profesor_id:
            query = query.eq("profesor_id", profesor_id)
        else:
            query = query.eq("activa", True)
        if disciplina:
            query = query.eq("disciplina", disciplina)
        if nivel:
            query = query.eq("nivel", nivel)
        if buscar:
            literal = buscar.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            query = query.ilike("titulo", f"%{literal}%")
        rows = (query.order("fecha_creacion", desc=True).order("id")
                .range(desde, desde + limite).execute().data or [])
        # One extra row tells the client whether another page exists.
        ejercicios = _cargar_ejercicios_para_rutinas([r["id"] for r in rows])
        return [_row_a_rutina(r, ejercicios.get(r["id"], [])) for r in rows]

    def buscar_copia(self, alumno_id: str, origen_id: str) -> Optional[Rutina]:
        rows = (self._sb.table("rutinas").select("id")
                .eq("alumno_id", alumno_id).eq("rutina_origen_id", origen_id)
                .limit(1).execute().data or [])
        return self.find_by_id(rows[0]["id"]) if rows else None

    # -------- Escritura --------

    def crear(self, rutina: Rutina) -> Rutina:
        rutina_row = {
            "alumno_id": rutina.alumno_id,
            "titulo": rutina.titulo,
            "grupos_musculares": list(rutina.grupos_musculares),
            "profesor_id": rutina.profesor_id,
            "profesor_nombre": rutina.profesor_nombre,
            "activa": rutina.activa,
            "creada_por_alumno": rutina.creada_por_alumno,
            "es_publica": rutina.es_publica,
            "rutina_origen_id": rutina.rutina_origen_id,
            **{campo: getattr(rutina, campo) for campo in
               ("disciplina", "objetivo", "nivel", "equipamiento", "descripcion")},
            "gimnasio_id": rutina.gimnasio_id,
        }
        resp = self._sb.table("rutinas").insert(rutina_row).execute()
        if not resp.data:
            raise RuntimeError("No se pudo crear la rutina.")

        nueva_id = resp.data[0]["id"]

        if rutina.ejercicios:
            ejercicios_rows = []
            for i, e in enumerate(rutina.ejercicios):
                ejercicios_rows.append({
                    "rutina_id": nueva_id,
                    "posicion": i + 1,
                    "tipo": e.tipo,
                    "maquina_id": e.maquina_id if e.tipo == "maquina" else None,
                    "nombre_libre": e.nombre if e.tipo == "libre" else None,
                    "descripcion_libre": e.descripcion if e.tipo == "libre" else None,
                    "series": e.series,
                    "repeticiones": e.repeticiones,
                    "peso_sugerido": e.peso_sugerido,
                })
            self._sb.table("rutina_ejercicios").insert(ejercicios_rows).execute()

        # Devolvemos la rutina completa
        return self.find_by_id(nueva_id)

    def actualizar(self, rutina_id: str, profesor_id: str, data: dict) -> Optional[Rutina]:
        # Verificar que la rutina existe y es del profesor
        resp = (
            self._sb.table("rutinas")
            .select("id,profesor_id,rutina_origen_id")
            .eq("id", rutina_id)
            .limit(1)
            .execute()
        )
        if not resp.data:
            return None
        if resp.data[0]["profesor_id"] != profesor_id or resp.data[0].get("rutina_origen_id"):
            return None

        return self._actualizar_contenido(rutina_id, data)

    def actualizar_personal(self, rutina_id: str, alumno_id: str, data: dict) -> Optional[Rutina]:
        rutina = self.find_by_id(rutina_id)
        if (not rutina or rutina.alumno_id != alumno_id or rutina.es_publica
                or not (rutina.creada_por_alumno or rutina.rutina_origen_id)):
            return None
        return self._actualizar_contenido(rutina_id, data)

    def _actualizar_contenido(self, rutina_id: str, data: dict) -> Optional[Rutina]:
        update_rutina = {}
        if "titulo" in data:
            update_rutina["titulo"] = data["titulo"]
        if "grupos_musculares" in data:
            update_rutina["grupos_musculares"] = list(data["grupos_musculares"])

        for campo in ("disciplina", "objetivo", "nivel", "equipamiento", "descripcion"):
            if campo in data:
                update_rutina[campo] = data[campo]

        if update_rutina:
            self._sb.table("rutinas").update(update_rutina).eq("id", rutina_id).execute()

        # Si vienen ejercicios, reemplazamos todos (delete + insert)
        if "ejercicios" in data:
            self._sb.table("rutina_ejercicios").delete().eq("rutina_id", rutina_id).execute()

            nuevos = data["ejercicios"]
            if nuevos:
                ejercicios_rows = []
                for i, e in enumerate(nuevos):
                    ejercicios_rows.append({
                        "rutina_id": rutina_id,
                        "posicion": i + 1,
                        "tipo": e.tipo,
                        "maquina_id": e.maquina_id if e.tipo == "maquina" else None,
                        "nombre_libre": e.nombre if e.tipo == "libre" else None,
                        "descripcion_libre": e.descripcion if e.tipo == "libre" else None,
                        "series": e.series,
                        "repeticiones": e.repeticiones,
                        "peso_sugerido": e.peso_sugerido,
                    })
                self._sb.table("rutina_ejercicios").insert(ejercicios_rows).execute()

        return self.find_by_id(rutina_id)

    def archivar(self, rutina_id: str, profesor_id: str) -> Optional[Rutina]:
        resp = (
            self._sb.table("rutinas")
            .select("id,profesor_id,rutina_origen_id")
            .eq("id", rutina_id)
            .limit(1)
            .execute()
        )
        if not resp.data or resp.data[0]["profesor_id"] != profesor_id or resp.data[0].get("rutina_origen_id"):
            return None

        self._sb.table("rutinas").update({"activa": False}).eq("id", rutina_id).execute()
        return self.find_by_id(rutina_id)

    def reactivar(self, rutina_id: str, profesor_id: str) -> Optional[Rutina]:
        resp = (
            self._sb.table("rutinas")
            .select("id,profesor_id,rutina_origen_id")
            .eq("id", rutina_id)
            .limit(1)
            .execute()
        )
        if not resp.data or resp.data[0]["profesor_id"] != profesor_id or resp.data[0].get("rutina_origen_id"):
            return None

        self._sb.table("rutinas").update({"activa": True}).eq("id", rutina_id).execute()
        return self.find_by_id(rutina_id)

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
                    id="",
                    tipo=e.tipo,
                    series=e.series,
                    repeticiones=e.repeticiones,
                    peso_sugerido=e.peso_sugerido,
                    maquina_id=e.maquina_id,
                    nombre=e.nombre,
                    descripcion=e.descripcion,
                )
                for e in original.ejercicios
            ],
        )
        return self.crear(nueva)