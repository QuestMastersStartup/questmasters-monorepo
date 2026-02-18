import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

def test_create_asset_in_existing_pack():
    headers = {
        "Content-Type": "application/json"
    }

    # Step 1: Create a pack to ensure the pack exists for asset creation
    pack_payload = {
        "name": "Test Pack for Assets",
        "slug": f"test-pack-{uuid.uuid4().hex[:8]}",
        "type": "srd",
        "creatorId": str(uuid.uuid4())
    }
    pack_response = requests.post(f"{BASE_URL}/packs", json=pack_payload, headers=headers, timeout=TIMEOUT)
    assert pack_response.status_code == 201, f"Pack creation failed: {pack_response.text}"
    pack_slug = pack_response.json().get("slug")
    assert pack_slug == pack_payload["slug"]

    # Prepare asset payload according to CreateAssetDto schema:
    # - 'name' property is removed (not allowed at top level)
    # - 'index' should be a string between 1 and 255 characters
    # - 'type' must be from valid enum
    # - 'data' must contain data, no top-level name/description/content
    asset_payload = {
        "index": "1",
        "type": "spell",  # valid enum type
        "data": {
            "description": "An example spell asset",
            "content": "base64encodedstring=="
        }
    }

    try:
        # Step 2: Create the asset in the existing pack
        create_asset_url = f"{BASE_URL}/packs/{pack_slug}/assets"
        asset_response = requests.post(create_asset_url, json=asset_payload, headers=headers, timeout=TIMEOUT)
        assert asset_response.status_code == 201, f"Asset creation failed: {asset_response.text}"
        asset_json = asset_response.json()

        # Validate response contains expected metadata fields
        assert asset_json.get("type") == asset_payload["type"], f"Expected type '{asset_payload['type']}', got '{asset_json.get('type')}'"
        assert asset_json.get("index") == asset_payload["index"], f"Expected index '{asset_payload['index']}', got '{asset_json.get('index')}'"

        # Validate that data object is present in response
        assert "data" in asset_json, "Response missing 'data' field"
        assert isinstance(asset_json["data"], dict), "data field should be an object"

    finally:
        # Clean up: delete created asset if created
        try:
            del_url = f"{BASE_URL}/packs/{pack_slug}/assets/{asset_payload['type']}/{asset_payload['index']}"
            del_resp = requests.delete(del_url, headers=headers, timeout=TIMEOUT)
            # 204 is expected, if already deleted, ignore errors
        except Exception:
            pass

        # Clean up: delete the created pack
        try:
            requests.delete(f"{BASE_URL}/packs/{pack_slug}", headers=headers, timeout=TIMEOUT)
        except Exception:
            pass

test_create_asset_in_existing_pack()
