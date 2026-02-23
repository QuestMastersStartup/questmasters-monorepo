import { t } from 'elysia';

export const CreateAssetSchema = t.Object({
  type: t.String({ minLength: 1 }),
  index: t.String({ minLength: 1, maxLength: 255 }),
  data: t.Record(t.String(), t.Any()),
});

export const UpdateAssetSchema = t.Object({
  data: t.Optional(t.Record(t.String(), t.Any())),
  compatibleWith: t.Optional(t.Array(t.String())),
});
