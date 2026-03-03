import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_unsuspend_existing_pack():
    # First, create a pack that we will suspend and then unsuspend
    # Pack payload according to PRD schema: must include name, slug, type (enum), creatorId (UUID)
    # Valid type enum values are: srd, official, homebrew
    import random
    import string

    def random_slug():
        return "testpack-" + ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

    pack_slug = random_slug()
    pack_payload = {
        "name": "Test Pack for Unsuspend",
        "slug": pack_slug,
        "type": "official",
        "creatorId": str(uuid.uuid4())
    }

    # Create pack
    response_create = requests.post(f"{BASE_URL}/packs", json=pack_payload, headers=HEADERS, timeout=TIMEOUT)
    assert response_create.status_code == 201, f"Failed to create pack: {response_create.text}"
    created_pack = response_create.json()
    assert created_pack.get("slug") == pack_slug

    # Suspend the pack (necessary pre-condition to test unsuspend)
    suspend_payload = {"reason": "Suspending pack for testing unsuspend"}
    response_suspend = requests.patch(f"{BASE_URL}/packs/{pack_slug}/suspend", json=suspend_payload, headers=HEADERS, timeout=TIMEOUT)
    assert response_suspend.status_code == 200, f"Failed to suspend pack: {response_suspend.text}"
    suspended_pack = response_suspend.json()
    assert suspended_pack.get("isSuspended") == True, f"Expected isSuspended=True, got {suspended_pack.get('isSuspended')}"

    # Unsuspend the pack (the actual test case)
    response_unsuspend = requests.patch(f"{BASE_URL}/packs/{pack_slug}/unsuspend", headers=HEADERS, timeout=TIMEOUT)
    assert response_unsuspend.status_code == 200, f"Failed to unsuspend pack: {response_unsuspend.text}"
    unsuspended_pack = response_unsuspend.json()
    assert unsuspended_pack.get("isSuspended") == False, f"Expected isSuspended=False, got {unsuspended_pack.get('isSuspended')}"
    assert unsuspended_pack.get("suspensionReason") is None, f"Expected suspensionReason=None after unsuspend, got {unsuspended_pack.get('suspensionReason')}"

    # Confirm with a GET request that pack is no longer suspended
    response_get = requests.get(f"{BASE_URL}/packs/{pack_slug}", headers=HEADERS, timeout=TIMEOUT)
    assert response_get.status_code == 200, f"Failed to get pack after unsuspend: {response_get.text}"
    get_pack = response_get.json()
    assert get_pack.get("isSuspended") == False, f"Expected isSuspended=False after GET, got {get_pack.get('isSuspended')}"
    assert get_pack.get("suspensionReason") is None, f"Expected suspensionReason=None after unsuspend, got {get_pack.get('suspensionReason')}"

    # Clean up: delete the pack
    try:
        delete_response = requests.delete(f"{BASE_URL}/packs/{pack_slug}", headers=HEADERS, timeout=TIMEOUT)
        assert delete_response.status_code == 204, f"Failed to delete pack during cleanup: {delete_response.text}"
    except Exception as e:
        # Log the exception but do not fail the test - cleanup failure
        print(f"Cleanup delete pack failed: {e}")

test_unsuspend_existing_pack()