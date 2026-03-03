import requests
import uuid

BASE_URL = "http://localhost:3000/api"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_create_pack_with_duplicate_slug():
    # Prepare a valid pack payload
    pack_slug = f"duplicate-slug-{str(uuid.uuid4())[:8]}"
    pack_type = "official"  # Valid types: srd, official, homebrew
    creator_id = str(uuid.uuid4())
    pack_payload = {
        "name": "Test Pack Duplicate Slug",
        "slug": pack_slug,
        "type": pack_type,
        "creatorId": creator_id,
    }

    # Create the initial pack to establish the slug
    url_create_pack = f"{BASE_URL}/packs"
    response_create = requests.post(url_create_pack, json=pack_payload, headers=HEADERS, timeout=TIMEOUT)
    assert response_create.status_code == 201, f"Initial pack creation failed with status {response_create.status_code}"
    created_pack = response_create.json()
    assert created_pack.get("slug") == pack_slug

    try:
        # Attempt to create another pack with the same slug
        duplicate_payload = {
            "name": "Duplicate Slug Pack",
            "slug": pack_slug,
            "type": pack_type,
            "creatorId": creator_id,
        }
        response_duplicate = requests.post(url_create_pack, json=duplicate_payload, headers=HEADERS, timeout=TIMEOUT)

        # Expect a 400 Bad Request indicating conflict (duplicate slug)
        assert response_duplicate.status_code == 400, f"Expected 400 but got {response_duplicate.status_code}"
        error_json = response_duplicate.json()
        # Check error message or structure indicates "already exists" or conflict
        error_msg = str(error_json).lower()
        assert "already exists" in error_msg or "conflict" in error_msg
    finally:
        # Clean up - delete the initial pack
        url_delete_pack = f"{BASE_URL}/packs/{pack_slug}"
        try:
            requests.delete(url_delete_pack, headers=HEADERS, timeout=TIMEOUT)
        except Exception:
            pass

test_create_pack_with_duplicate_slug()
