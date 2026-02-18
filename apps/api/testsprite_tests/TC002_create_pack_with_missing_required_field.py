import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

def test_create_pack_with_missing_required_field():
    # Prepare payload missing 'creatorId' (required field)
    payload = {
        "name": "Test Pack Missing CreatorId",
        "slug": f"test-pack-missing-creatorid-{uuid.uuid4().hex[:8]}",
        "type": "game"  # Assuming 'type' enum includes 'game'
        # 'creatorId' is intentionally omitted
    }
    headers = {"Content-Type": "application/json"}

    response = None
    try:
        response = requests.post(f"{BASE_URL}/packs", json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response is not None, "No response received from the server"
    assert response.status_code == 400, f"Expected 400 Bad Request, got {response.status_code}"
    json_response = {}
    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate that the response contains validation error about missing creatorId
    errors = json_response.get("errors") or json_response.get("message") or json_response.get("error")
    assert errors is not None, "Validation error message is missing in the response"
    error_str = str(errors).lower()
    assert "creatorid" in error_str or "creator id" in error_str or "required" in error_str or "validation" in error_str, \
        f"Validation error does not mention missing 'creatorId': {errors}"

test_create_pack_with_missing_required_field()