import { t } from 'elysia';

export const CreateCampaignSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String({ maxLength: 2000 })),
  system: t.Optional(
    t.Union([
      t.Literal('dnd-3.5'),
      t.Literal('dnd-5e-2014'),
      t.Literal('dnd-5e-2024'),
      t.Literal('universal'),
    ], { error: 'Invalid system' }),
  ),
  coverImageUrl: t.Optional(t.String({ format: 'uri' })),
  installedPackIds: t.Optional(t.Array(t.String())),
});

export const UpdateCampaignSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  description: t.Optional(t.String({ maxLength: 2000 })),
  coverImageUrl: t.Optional(t.Union([t.String({ format: 'uri' }), t.Null()])),
});

export const InstallPacksSchema = t.Object({
  packIds: t.Array(t.String()),
});

export const ChangeCampaignStatusSchema = t.Object({
  status: t.Union(
    [
      t.Literal('active'),
      t.Literal('paused'),
      t.Literal('completed'),
    ],
    { error: 'Status must be one of: active, paused, completed' },
  ),
});

export const CampaignQuerySchema = t.Object({
  status: t.Optional(
    t.Union([
      t.Literal('active'),
      t.Literal('paused'),
      t.Literal('completed'),
    ]),
  ),
  system: t.Optional(t.String()),
  dmId: t.Optional(t.String()),
});
