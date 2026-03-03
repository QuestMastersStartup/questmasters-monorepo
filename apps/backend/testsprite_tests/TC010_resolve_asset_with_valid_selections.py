import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30


def test_resolve_asset_with_valid_selections():
    # Step 1: Create a new pack as prerequisite
    pack_slug = None
    try:
        pack_payload = {
            "name": "Test Pack for Resolution",
            "slug": f"test-pack-resolution-{uuid.uuid4().hex[:8]}",
            "type": "homebrew",  # Corrected to allowed enum value
            "creatorId": str(uuid.uuid4())
        }
        res_pack = requests.post(
            f"{BASE_URL}/packs", json=pack_payload, timeout=TIMEOUT
        )
        assert res_pack.status_code == 201, f"Pack creation failed: {res_pack.text}"
        pack = res_pack.json()
        pack_slug = pack.get("slug")
        pack_id = pack.get("id")  # Get pack ID for resolution API
        assert pack_slug == pack_payload["slug"]
        assert pack_id is not None, "Pack creation response missing 'id'"

        # Step 2: Create a new asset in the created pack
        asset_type = "class"  # Changed to allowed enum for asset type
        asset_index = "0"  # Changed index to string as required by API
        asset_payload = {
            "index": asset_index,
            "type": asset_type,
            "data": {
                "description": "Test character asset data",
                "attributes": {"strength": 10, "intelligence": 8}
            }
        }
        res_asset = requests.post(
            f"{BASE_URL}/packs/{pack_slug}/assets", json=asset_payload, timeout=TIMEOUT
        )
        assert res_asset.status_code == 201, f"Asset creation failed: {res_asset.text}"

        # Step 3: Prepare the resolution payload with correct schema
        # ResolveAssetDto expects: packId, assetType, assetIndex, selections
        resolution_payload = {
            "packId": pack_id,  # Use pack ID (UUID), not slug
            "assetType": asset_type,
            "assetIndex": asset_index,
            "selections": {}  # Empty selections object for basic resolution
        }

        # Step 4: Call rules resolution API
        res_resolve = requests.post(
            f"{BASE_URL}/rules/resolve",
            json=resolution_payload,
            timeout=TIMEOUT
        )
        assert res_resolve.status_code == 201, f"Resolution failed with status {res_resolve.status_code}: {res_resolve.text}"
        resolved_asset = res_resolve.json()

        # Step 5: Validate resolved asset payload has expected structure
        # The API returns: original_asset, resolved_features, warnings
        assert resolved_asset is not None, "Resolved asset is null"
        assert isinstance(resolved_asset, dict), "Resolved asset should be an object"
        assert "original_asset" in resolved_asset, "Response missing 'original_asset'"
        assert "resolved_features" in resolved_asset, "Response missing 'resolved_features'"
        assert "warnings" in resolved_asset, "Response missing 'warnings'"

    finally:
        # Cleanup: delete the asset and pack if created
        if pack_slug:
            try:
                requests.delete(
                    f"{BASE_URL}/packs/{pack_slug}", timeout=TIMEOUT
                )
            except Exception:
                pass


test_resolve_asset_with_valid_selections()
