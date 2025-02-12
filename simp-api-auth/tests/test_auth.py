import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

TEST_USER = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!"
}

HEADERS = {
    "Origin": "https://your-website.com",
    "Referer": "https://your-website.com/login",
    "User-Agent": "Mozilla/5.0"
}

@pytest.fixture
def create_user():
    response = client.post("/v1/authentication/register", json=TEST_USER, headers=HEADERS)
    assert response.status_code == 200
    return response.json()["user_id"]

@pytest.fixture
def login_user():
    response = client.post("/v1/authentication/login", data={
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    }, headers=HEADERS)
    assert response.status_code == 200
    return response.json()["access_token"]

def test_register():
    response = client.post("/v1/authentication/register", json=TEST_USER, headers=HEADERS)
    assert response.status_code in [200, 400]  # 400 if user already exists

def test_login():
    response = client.post("/v1/authentication/login", data={
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    }, headers=HEADERS)
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_protected_route(login_user):
    response = client.get("/v1/authentication/protected", headers={"Authorization": f"Bearer {login_user}"})
    assert response.status_code == 200
    assert response.json()["message"].startswith("Hello, User")

def test_get_user_role(login_user):
    email = TEST_USER["email"]
    response = client.get(f"/v1/authorization/user-role/{email}", headers={"Authorization": f"Bearer {login_user}"})
    assert response.status_code == 200
    assert "role" in response.json()

def test_admin_access(login_user):
    response = client.get("/v1/authorization/admin-only", headers={"Authorization": f"Bearer {login_user}"})
    assert response.status_code in [200, 403]

def test_delete_user(login_user):
    email = TEST_USER["email"]
    response = client.delete(f"/v1/authentication/delete-user/{email}", headers={"Authorization": f"Bearer {login_user}"})
    assert response.status_code in [200, 403]  # 403 if trying to delete another user
