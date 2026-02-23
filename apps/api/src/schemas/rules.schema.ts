import { t } from 'elysia';

export const ResolveAssetSchema = t.Object({
  packId: t.String(),
  assetType: t.String(),
  assetIndex: t.String(),
  selections: t.Record(t.String(), t.Array(t.String())),
});
