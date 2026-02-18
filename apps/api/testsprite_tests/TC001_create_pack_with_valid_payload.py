import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

def test_create_pack_with_valid_payload():
    pack_slug = f"test-pack-{uuid.uuid4().hex[:8]}"
    payload = {
        "name": "Test Pack Name",
        "slug": pack_slug,
        "type": "official",  # Fixed to valid enum value
        "creatorId": str(uuid.uuid4())
    }
    headers = {
        "Content-Type": "application/json"
    }

    created_pack = None
    try:
        # Create pack
        response = requests.post(f"{BASE_URL}/packs", json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}, {response.text}"
        created_pack = response.json()
        # Validate returned JSON includes slug and matches input partially
        assert "slug" in created_pack, "Response JSON missing 'slug'"
        assert created_pack["slug"] == pack_slug, f"Expected slug '{pack_slug}', got '{created_pack['slug']}'"
        assert created_pack.get("name") == payload["name"], f"Expected name '{payload['name']}', got '{created_pack.get('name')}'"
        assert created_pack.get("type") == payload["type"], f"Expected type '{payload['type']}', got '{created_pack.get('type')}'"
        assert created_pack.get("creatorId") == payload["creatorId"], f"Expected creatorId '{payload['creatorId']}', got '{created_pack.get('creatorId')}'"
    finally:
        if created_pack and "slug" in created_pack:
            # Cleanup: delete created pack
            del_resp = requests.delete(f"{BASE_URL}/packs/{created_pack['slug']}", timeout=TIMEOUT)
            assert del_resp.status_code == 204, f"Cleanup delete pack expected 204, got {del_resp.status_code}"

test_create_pack_with_valid_payload()
