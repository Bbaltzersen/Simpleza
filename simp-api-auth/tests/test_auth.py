import pytest
import os;
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

TEST_USER = {
    "username": "testUserStart",
    "email": "testUser@example.com",
    "password": "SecurePass123!"
}

DUPLICATE_USERNAME_USER = {
    "username": "testUserStart",
    "email": "newuser@example.com",
    "password": "SecurePass123!"
}

DUPLICATE_EMAIL_USER = {
    "username": "newuser",
    "email": "testUser@example.com",
    "password": "SecurePass123!"
}

WEAK_PASSWORD_USER = {
    "username": "weakuser",
    "email": "weak@example.com",
    "password": "weak"
}

HEADERS = {
    "Origin": "https://localhost:3000",
    "Referer": "localhost:3000/login",
    "User-Agent": "Mozilla/5.0"
}

import pytest

@pytest.fixture
def create_user():
    # Try logging in first to get user_id (if the user already exists)
    login_response = client.post("/v1/authentication/login", data={
        "username": TEST_USER["username"],
        "password": TEST_USER["password"]
    }, headers=HEADERS)

    if login_response.status_code == 200:
        token = login_response.json()["access_token"]

        # Decode the token to extract user_id
        import jwt
        decoded_token = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=["HS256"])
        user_id = decoded_token["sub"]

        # Delete the existing user
        delete_response = client.delete(f"/v1/authentication/delete-user/{user_id}", headers={"Authorization": f"Bearer {token}"})
        
        if delete_response.status_code != 200:
            print(f"User deletion failed: {delete_response.json()}")

    # Now register the user
    response = client.post("/v1/authentication/register", json=TEST_USER, headers=HEADERS)
    assert response.status_code == 200, f"User creation failed: {response.json()}"

    user_id = response.json()["user_id"]

    # Log in again to get a fresh token
    login_response = client.post("/v1/authentication/login", data={
        "username": TEST_USER["username"],
        "password": TEST_USER["password"]
    }, headers=HEADERS)

    assert login_response.status_code == 200, f"Login failed: {login_response.json()}"

    token = login_response.json()["access_token"]

    return user_id, token



@pytest.fixture
def login_user(create_user):
    user_id, token = create_user
    return token, user_id

def test_register():
    response = client.post("/v1/authentication/register", json=TEST_USER, headers=HEADERS)
    assert response.status_code in [200, 400]

def test_register_duplicate_username(create_user):
    response = client.post("/v1/authentication/register", json=DUPLICATE_USERNAME_USER, headers=HEADERS)
    assert response.status_code == 400
    assert response.json()["detail"] == "Username already taken"

def test_register_duplicate_email(create_user):
    response = client.post("/v1/authentication/register", json=DUPLICATE_EMAIL_USER, headers=HEADERS)
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_register_weak_password():
    response = client.post("/v1/authentication/register", json=WEAK_PASSWORD_USER, headers=HEADERS)
    assert response.status_code == 400
    assert "password_errors" in response.json()["detail"]

def test_login():
    response = client.post("/v1/authentication/login", data={
        "username": TEST_USER["username"],
        "password": TEST_USER["password"]
    }, headers=HEADERS)
    assert response.status_code == 200, f"Login failed: {response.json()}"
    assert "access_token" in response.json()

def test_login_wrong_password(create_user):
    response = client.post("/v1/authentication/login", data={
        "username": TEST_USER["username"],
        "password": "WrongPass123!"
    }, headers=HEADERS)

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_login_non_existent_user():
    response = client.post("/v1/authentication/login", data={
        "username": "nonexistent",
        "password": "SomePass123!"
    }, headers=HEADERS)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"

def test_protected_route(login_user):
    token, user_id = login_user
    response = client.get("/v1/authentication/protected", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["message"] == f"Hello, User {user_id}, you are authenticated."

def test_protected_route_no_token():
    response = client.get("/v1/authentication/protected")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_protected_route_invalid_token():
    response = client.get("/v1/authentication/protected", headers={"Authorization": "Bearer invalid_token"})
    assert response.status_code == 401
    assert response.json()["detail"] in ["Invalid token", "Token expired"]

def test_delete_user():
    # Login to get the token and user_id
    login_response = client.post("/v1/authentication/login", data={
        "username": TEST_USER["username"],
        "password": TEST_USER["password"]
    }, headers=HEADERS)

    assert login_response.status_code == 200, f"Login failed: {login_response.json()}"

    token = login_response.json()["access_token"]

    # Decode token to get user_id
    import jwt
    decoded_token = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=["HS256"])
    user_id = decoded_token["sub"]  # Extract user_id

    # Now delete the user using the correct user_id
    response = client.delete(
        f"/v1/authentication/delete-user/{user_id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code in [200, 404], f"User deletion failed: {response.json()}"
