import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30


def test_delete_existing_pack():
    # Helper to generate unique pack data
    def generate_pack_payload():
        return {
            "name": "Test Pack for Deletion",
            "slug": f"test-pack-delete-{uuid.uuid4().hex[:8]}",
            "type": "srd",
            "creatorId": str(uuid.uuid4())
        }

    headers = {
        "Content-Type": "application/json"
    }

    # Create a new pack to ensure it exists for deletion
    pack_payload = generate_pack_payload()
    create_resp = requests.post(f"{BASE_URL}/packs", json=pack_payload, headers=headers, timeout=TIMEOUT)
    assert create_resp.status_code == 201, f"Failed to create pack for deletion test: {create_resp.text}"
    created_pack = create_resp.json()
    slug = created_pack.get("slug")
    assert slug == pack_payload["slug"], "Slug mismatch on created pack"

    try:
        # Delete the existing pack by slug
        delete_resp = requests.delete(f"{BASE_URL}/packs/{slug}", headers=headers, timeout=TIMEOUT)
        assert delete_resp.status_code == 204, f"Expected 204 No Content on delete, got {delete_resp.status_code}"

        # Confirm the pack is deleted by attempting to GET it
        get_resp = requests.get(f"{BASE_URL}/packs/{slug}", headers=headers, timeout=TIMEOUT)
        assert get_resp.status_code == 404, f"Expected 404 Not Found after deletion, got {get_resp.status_code}"
    finally:
        # Cleanup: try to delete the pack again if it still exists to avoid side effects
        requests.delete(f"{BASE_URL}/packs/{slug}", headers=headers, timeout=TIMEOUT)


test_delete_existing_pack()