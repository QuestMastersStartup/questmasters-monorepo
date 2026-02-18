import requests
import uuid
import random
import string

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

def generate_random_slug():
    return 'testpack-' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

def generate_valid_pack_payload(slug=None):
    if slug is None:
        slug = generate_random_slug()
    # Use valid 'type' value as per PRD enum: srd, official, homebrew
    return {
        "name": "Test Pack",
        "slug": slug,
        "type": "srd",
        "creatorId": str(uuid.uuid4())
    }

def test_suspend_existing_pack():
    # Step 1: Create a pack to suspend (if none provided)
    pack_slug = None
    created_slug = None
    try:
        pack_payload = generate_valid_pack_payload()
        create_resp = requests.post(
            f"{BASE_URL}/packs",
            json=pack_payload,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Pack creation failed with status {create_resp.status_code} and body {create_resp.text}"
        created_pack = create_resp.json()
        created_slug = created_pack.get("slug")
        assert created_slug, "Pack creation response missing 'slug'"

        # Step 2: Suspend the created pack via PATCH /api/packs/:slug/suspend
        suspend_resp = requests.patch(
            f"{BASE_URL}/packs/{created_slug}/suspend",
            json={"reason": "Routine maintenance"},
            timeout=TIMEOUT
        )
        assert suspend_resp.status_code == 200, f"Suspend request failed with status {suspend_resp.status_code} and body {suspend_resp.text}"
        suspend_data = suspend_resp.json()
        # Validate that pack is suspended using isSuspended boolean field
        assert "isSuspended" in suspend_data, "Suspend response missing 'isSuspended' field"
        assert suspend_data["isSuspended"] == True, f"Expected isSuspended=True, got '{suspend_data['isSuspended']}'"
        assert "suspensionReason" in suspend_data, "Suspend response missing 'suspensionReason' field"

        # Step 3: GET the pack by slug to confirm status
        get_resp = requests.get(
            f"{BASE_URL}/packs/{created_slug}",
            timeout=TIMEOUT
        )
        assert get_resp.status_code == 200, f"Get pack after suspend failed with status {get_resp.status_code} and body {get_resp.text}"
        pack_data = get_resp.json()
        assert pack_data.get("isSuspended") == True, f"Expected isSuspended=True after GET, got '{pack_data.get('isSuspended')}'"
        assert pack_data.get("suspensionReason") is not None, "Expected suspensionReason to be present"

    finally:
        # Cleanup: Delete the created pack if it was created
        if created_slug:
            try:
                delete_resp = requests.delete(
                    f"{BASE_URL}/packs/{created_slug}",
                    timeout=TIMEOUT
                )
                # 204 No Content expected on deletion
                assert delete_resp.status_code == 204 or delete_resp.status_code == 404
            except Exception:
                pass

test_suspend_existing_pack()
