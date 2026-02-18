import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_update_existing_pack():
    # Helper function to create a pack
    def create_pack(pack_payload):
        response = requests.post(f"{BASE_URL}/packs", json=pack_payload, headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
        return response.json()

    # Helper function to delete a pack by slug
    def delete_pack(slug):
        resp = requests.delete(f"{BASE_URL}/packs/{slug}", headers=HEADERS, timeout=TIMEOUT)
        # We ignore non-404 errors on delete cleanup; 404 means already gone
        if resp.status_code not in (204, 404):
            resp.raise_for_status()

    # Create a pack first to have an existing pack to update
    # Added 'slug' which is required by the API
    unique_slug = str(uuid.uuid4())
    original_pack = {
        "name": "Original Pack Name",
        "slug": unique_slug,
        "type": "homebrew",  # Valid types: srd, official, homebrew
        "creatorId": str(uuid.uuid4())
    }

    updated_fields = {
        # The usual pack fields for update: name, version, description
        # UpdatePackDto doesn't include 'type' or 'creatorId'
        "name": "Updated Pack Name",
        "description": "Updated description",
        "version": "1.0.1"
    }

    # Create and then update using try-finally to cleanup
    try:
        # Create the pack
        created = create_pack(original_pack)
        slug = created.get("slug")
        assert slug is not None, "Created pack does not have a slug"

        # Update the existing pack at /packs/:slug
        update_resp = requests.put(f"{BASE_URL}/packs/{slug}", json=updated_fields, headers=HEADERS, timeout=TIMEOUT)
        assert update_resp.status_code == 200
        updated_pack = update_resp.json()

        # Validate that updated fields match the input
        assert updated_pack.get("name") == updated_fields["name"]
        assert updated_pack.get("description") == updated_fields["description"]
        assert updated_pack.get("version") == updated_fields["version"]
        assert updated_pack.get("slug") == slug  # slug unchanged

        # Get the pack to confirm updates persisted
        get_resp = requests.get(f"{BASE_URL}/packs/{slug}", headers=HEADERS, timeout=TIMEOUT)
        assert get_resp.status_code == 200
        get_pack = get_resp.json()
        assert get_pack.get("name") == updated_fields["name"]
        assert get_pack.get("description") == updated_fields["description"]
        assert get_pack.get("version") == updated_fields["version"]
        assert get_pack.get("slug") == slug

    finally:
        if 'slug' in locals():
            delete_pack(slug)

test_update_existing_pack()
