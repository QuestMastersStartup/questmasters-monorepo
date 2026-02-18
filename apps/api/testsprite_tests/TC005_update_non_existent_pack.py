import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

def test_update_non_existent_pack():
    non_existent_slug = "nonexistent-slug-123456"
    url = f"{BASE_URL}/packs/{non_existent_slug}"

    # Payload for update - UpdatePackDto accepts name, description, version (all optional)
    payload = {
        "name": "Non Existent Pack Updated",
        "description": "This pack does not exist"
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.put(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"Request to update non-existent pack failed: {e}")

    assert response.status_code == 404, f"Expected 404 Not Found, got {response.status_code}"
    try:
        resp_json = response.json()
        assert "error" in resp_json or "message" in resp_json, "Error response missing expected keys"
    except ValueError:
        pass

test_update_non_existent_pack()
