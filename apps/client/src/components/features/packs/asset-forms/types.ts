import type { AssetData } from "@questmasters/dnd-rules";
import type { PackAsset } from "../PackForm";
import type { NewAssetData } from "../AddAssetModal";

export interface AssetFormProps {
  onSubmit: (data: AssetData) => void;
  packAssets: PackAsset[];
  onCreateSubAsset: (asset: NewAssetData) => void;
}
