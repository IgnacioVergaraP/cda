"""
Tests del dashboard de uso del admin (recursos informados en entrenamientos).
"""


def test_dashboard_sin_token(client):
    resp = client.get("/api/admin/dashboard/uso")
    assert resp.status_code == 401


def test_dashboard_como_profesor_403(client, mock_auth):
    resp = client.get(
        "/api/admin/dashboard/uso",
        headers=mock_auth.as_profesor(),
    )
    assert resp.status_code == 403


def test_dashboard_default(client, mock_auth):
    resp = client.get("/api/admin/dashboard/uso", headers=mock_auth.as_admin())
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["rango"] == "30d"
    assert data["dias"] == 30
    assert "total_registros" in data
    assert data["registros_sin_recursos"] == data["total_registros"]
    assert data["registros_con_recursos"] == 0
    assert data["top_usadas"] == []
    assert all(r["cantidad_registros"] == 0 for r in data["menos_usadas"])
    assert "top_usadas" in data
    assert "menos_usadas" in data
    assert isinstance(data["top_usadas"], list)


def test_dashboard_rango_7d(client, mock_auth):
    resp = client.get("/api/admin/dashboard/uso?rango=7d", headers=mock_auth.as_admin())
    assert resp.status_code == 200
    assert resp.get_json()["data"]["dias"] == 7


def test_dashboard_rango_invalido(client, mock_auth):
    resp = client.get("/api/admin/dashboard/uso?rango=1y", headers=mock_auth.as_admin())
    assert resp.status_code == 400
