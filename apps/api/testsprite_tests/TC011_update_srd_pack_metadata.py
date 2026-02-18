import requests

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_update_srd_pack_metadata():
    """
    Test updating metadata (name, description) of an SRD pack without touching assets.
    SRD packs have non-semver versions like '5.1' or '2024.1' which must be accepted.
    """
    # Step 1: Find existing SRD packs
    list_resp = requests.get(f"{BASE_URL}/packs", headers=HEADERS, timeout=TIMEOUT)
    assert list_resp.status_code == 200, f"Failed to list packs: {list_resp.status_code}"
    packs = list_resp.json()

    srd_packs = [p for p in packs if p.get("type") == "srd"]
    assert len(srd_packs) > 0, "No SRD packs found in database - seeder may not have run"

    srd_pack = srd_packs[0]
    slug = srd_pack["slug"]
    original_name = srd_pack["name"]
    original_version = srd_pack["version"]

    # Step 2: Update only the name (keep version as-is with non-semver format)
    update_payload = {
        "name": "Temporarily Renamed SRD",
        "version": original_version,  # e.g. "5.1" or "2024.1" - must not be rejected
    }
    update_resp = requests.put(
        f"{BASE_URL}/packs/{slug}",
        json=update_payload,
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    assert update_resp.status_code == 200, (
        f"Update failed with {update_resp.status_code}: {update_resp.text}"
    )
    updated = update_resp.json()
    assert updated["name"] == "Temporarily Renamed SRD"
    assert updated["version"] == original_version

    # Step 3: Update with only description (no version sent)
    desc_payload = {"description": "Updated SRD description for testing"}
    desc_resp = requests.put(
        f"{BASE_URL}/packs/{slug}",
        json=desc_payload,
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    assert desc_resp.status_code == 200, (
        f"Description update failed: {desc_resp.status_code}: {desc_resp.text}"
    )
    desc_updated = desc_resp.json()
    assert desc_updated["description"] == "Updated SRD description for testing"

    # Step 4: Verify via GET that changes persisted
    get_resp = requests.get(f"{BASE_URL}/packs/{slug}", headers=HEADERS, timeout=TIMEOUT)
    assert get_resp.status_code == 200
    get_pack = get_resp.json()
    assert get_pack["name"] == "Temporarily Renamed SRD"
    assert get_pack["description"] == "Updated SRD description for testing"
    assert get_pack["version"] == original_version

    # Step 5: Restore original name and description
    restore_payload = {
        "name": original_name,
        "description": srd_pack.get("description", ""),
    }
    restore_resp = requests.put(
        f"{BASE_URL}/packs/{slug}",
        json=restore_payload,
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    assert restore_resp.status_code == 200, (
        f"Restore failed: {restore_resp.status_code}: {restore_resp.text}"
    )
    restored = restore_resp.json()
    assert restored["name"] == original_name

test_update_srd_pack_metadata()
