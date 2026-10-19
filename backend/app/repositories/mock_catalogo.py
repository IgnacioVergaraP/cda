from copy import deepcopy
from uuid import uuid4, uuid5, NAMESPACE_URL

from app.repositories.mock_maquinas import MockMaquinasRepository


class InvalidTipoRecursoError(Exception):
    code = "23514"


class DuplicateNumeroError(Exception):
    code = "23505"


class MockCatalogoRepository:
    def __init__(self, maquinas_repo=None):
        self.recursos = {}
        self.ejercicios = {}
        self._maquinas = maquinas_repo or MockMaquinasRepository()
        self._sincronizar()

    def _sincronizar(self):
        for maquina in self._maquinas.listar():
            id = str(uuid5(NAMESPACE_URL, maquina.id))
            if id in self.ejercicios:
                continue
            self.recursos[id] = {"id": id, "gimnasio_id": maquina.gimnasio_id,
                                 "nombre": maquina.nombre, "tipo": "maquina", "numero_maquina": None,
                                 "descripcion": maquina.descripcion, "maquina_origen_id": maquina.id}
            self.ejercicios[id] = {"id": id, "gimnasio_id": maquina.gimnasio_id, "nombre": maquina.nombre,
                                   "categoria": "maquina", "descripcion": maquina.descripcion,
                                   "grupos_musculares": list(maquina.grupos_musculares), "video_url": maquina.video_url,
                                   "imagen_url": maquina.imagen_url, "maquina_origen_id": maquina.id, "recurso_ids": [id]}

    def _resolver(self, e):
        row = deepcopy(e)
        row["recursos"] = [deepcopy(self.recursos[id]) for id in row.pop("recurso_ids")]
        return row

    def listar_ejercicios(self, gimnasio_id, categoria="", musculo="", buscar="", desde=0):
        self._sincronizar()
        rows = [e for e in self.ejercicios.values() if e["gimnasio_id"] == gimnasio_id
                and (not categoria or e["categoria"] == categoria)
                and (not musculo or musculo in e["grupos_musculares"])
                and (not buscar or buscar.lower() in e["nombre"].lower())]
        rows.sort(key=lambda e: (e["nombre"], e["id"]))
        return [self._resolver(e) for e in rows[desde:desde + 25]]

    def obtener_ejercicio(self, id, gimnasio_id):
        self._sincronizar()
        e = self.ejercicios.get(id)
        return self._resolver(e) if e and e["gimnasio_id"] == gimnasio_id else None

    def ejercicios_por_ids(self, ids, gimnasio_id):
        self._sincronizar()
        return [self._resolver(e) for e in self.ejercicios.values()
                if e["id"] in ids and e["gimnasio_id"] == gimnasio_id]

    def listar_recursos(self, gimnasio_id, tipo="", buscar="", desde=0, es_cardio=None):
        self._sincronizar()
        rows = [deepcopy(r) for r in self.recursos.values() if r["gimnasio_id"] == gimnasio_id
                and (not tipo or r["tipo"] == tipo)
                and (es_cardio is None or r.get("es_cardio", False) == es_cardio)
                and (not buscar or buscar.lower() in r["nombre"].lower() or buscar.lower() in (r["numero_maquina"] or "").lower())]
        rows.sort(key=lambda r: (r["nombre"], r["id"]))
        return rows[desde:desde + 25]

    def recursos_por_ids(self, ids, gimnasio_id):
        self._sincronizar()
        return [deepcopy(r) for id, r in self.recursos.items() if id in ids and r["gimnasio_id"] == gimnasio_id]

    def iterar_recursos_uso(self, gimnasio_id):
        self._sincronizar()
        yield from (deepcopy(r) for r in sorted(self.recursos.values(), key=lambda r: r["id"])
                    if r["gimnasio_id"] == gimnasio_id)

    def guardar_recurso(self, gimnasio_id, payload, recurso_id=None):
        if recurso_id and (recurso_id not in self.recursos or self.recursos[recurso_id]["gimnasio_id"] != gimnasio_id):
            return None
        if recurso_id and self.recursos[recurso_id]["tipo"] == "maquina" and payload["tipo"] != "maquina":
            for e in self.ejercicios.values():
                if e["categoria"] == "maquina" and recurso_id in e["recurso_ids"] and not any(
                    self.recursos[r]["tipo"] == "maquina" for r in e["recurso_ids"] if r != recurso_id
                ):
                    raise InvalidTipoRecursoError()
        numero = payload["numero_maquina"]
        if numero and any(r["id"] != recurso_id and r["gimnasio_id"] == gimnasio_id
                          and (r["numero_maquina"] or "").lower() == numero.lower() for r in self.recursos.values()):
            raise DuplicateNumeroError()
        id = recurso_id or str(uuid4())
        self.recursos[id] = {**self.recursos.get(id, {"maquina_origen_id": None}), **deepcopy(payload),
                             "id": id, "gimnasio_id": gimnasio_id}
        return deepcopy(self.recursos[id])

    def guardar_ejercicio(self, gimnasio_id, payload, recurso_ids, ejercicio_id=None):
        if ejercicio_id and not self.obtener_ejercicio(ejercicio_id, gimnasio_id):
            return None
        id = ejercicio_id or str(uuid4())
        self.ejercicios[id] = {**self.ejercicios.get(id, {"maquina_origen_id": None}), **deepcopy(payload),
                               "id": id, "gimnasio_id": gimnasio_id, "recurso_ids": list(recurso_ids)}
        return self.obtener_ejercicio(id, gimnasio_id)
