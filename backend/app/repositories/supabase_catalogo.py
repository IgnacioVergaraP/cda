"""Catálogo de ejercicios y recursos, independiente de rutinas y progreso."""
from app.extensions import get_supabase

_COLS_RECURSO = "id,nombre,tipo,numero_maquina,descripcion,gimnasio_id,maquina_origen_id"
_COLS_EJERCICIO = (
    "id,nombre,categoria,grupos_musculares,descripcion,video_url,imagen_url,gimnasio_id,maquina_origen_id,"
    f"vinculos:ejercicio_recursos(recurso:recursos_gimnasio({_COLS_RECURSO}))"
)


def _ejercicio(row: dict) -> dict:
    data = dict(row)
    data["recursos"] = [v["recurso"] for v in data.pop("vinculos", []) if v.get("recurso")]
    data["recursos"].sort(key=lambda r: (r["nombre"].lower(), r["id"]))
    return data


class SupabaseCatalogoRepository:
    def __init__(self):
        self._sb = get_supabase()

    def listar_ejercicios(self, gimnasio_id, categoria="", musculo="", buscar="", desde=0):
        query = self._sb.table("ejercicios_catalogo").select(_COLS_EJERCICIO).eq("gimnasio_id", gimnasio_id)
        if categoria:
            query = query.eq("categoria", categoria)
        if musculo:
            query = query.contains("grupos_musculares", [musculo])
        if buscar:
            query = query.ilike("nombre", self._patron(buscar))
        rows = query.order("nombre").order("id").range(desde, desde + 24).execute().data or []
        return [_ejercicio(r) for r in rows]

    def obtener_ejercicio(self, ejercicio_id, gimnasio_id):
        rows = (self._sb.table("ejercicios_catalogo").select(_COLS_EJERCICIO)
                .eq("id", ejercicio_id).eq("gimnasio_id", gimnasio_id).limit(1).execute().data or [])
        return _ejercicio(rows[0]) if rows else None

    def ejercicios_por_ids(self, ids, gimnasio_id):
        if not ids:
            return []
        rows = (self._sb.table("ejercicios_catalogo").select(_COLS_EJERCICIO)
                .eq("gimnasio_id", gimnasio_id).in_("id", list(ids)).execute().data or [])
        return [_ejercicio(r) for r in rows]

    def listar_recursos(self, gimnasio_id, tipo="", buscar="", desde=0):
        query = self._sb.table("recursos_gimnasio").select(_COLS_RECURSO).eq("gimnasio_id", gimnasio_id)
        if tipo:
            query = query.eq("tipo", tipo)
        if buscar:
            # PostgREST OR: escape grammar characters as well as ILIKE wildcards.
            patron = self._patron(buscar).replace("\\", "\\\\").replace('"', '\\"')
            query = query.or_(f'nombre.ilike."{patron}",numero_maquina.ilike."{patron}"')
        return query.order("nombre").order("id").range(desde, desde + 24).execute().data or []

    def iterar_recursos_uso(self, gimnasio_id):
        desde = 0
        while True:
            rows = (self._sb.table("recursos_gimnasio").select("id,nombre,tipo,numero_maquina,gimnasio_id")
                    .eq("gimnasio_id", gimnasio_id).order("id").range(desde, desde + 999).execute().data or [])
            yield from rows
            if len(rows) < 1000:
                break
            desde += len(rows)

    def recursos_por_ids(self, ids, gimnasio_id):
        if not ids:
            return []
        return (self._sb.table("recursos_gimnasio").select(_COLS_RECURSO)
                .eq("gimnasio_id", gimnasio_id).in_("id", ids).execute().data or [])

    def guardar_recurso(self, gimnasio_id, payload, recurso_id=None):
        query = self._sb.table("recursos_gimnasio")
        if recurso_id:
            rows = query.update(payload).eq("id", recurso_id).eq("gimnasio_id", gimnasio_id).execute().data or []
        else:
            rows = query.insert({**payload, "gimnasio_id": gimnasio_id}).execute().data or []
        return rows[0] if rows else None

    def guardar_ejercicio(self, gimnasio_id, payload, recurso_ids, ejercicio_id=None):
        resp = self._sb.rpc("guardar_ejercicio_catalogo", {
            "p_gimnasio_id": gimnasio_id, "p_ejercicio_id": ejercicio_id,
            "p_datos": payload, "p_recurso_ids": recurso_ids,
        }).execute()
        return self.obtener_ejercicio(resp.data, gimnasio_id) if resp.data else None

    @staticmethod
    def _patron(buscar):
        return "%" + buscar.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
