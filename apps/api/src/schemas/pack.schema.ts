import { t } from 'elysia';

export const CreatePackSchema = t.Object({
  slug: t.String({
    minLength: 2,
    maxLength: 255,
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    error: 'Slug must be lowercase with hyphens only',
  }),
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String({ maxLength: 2000 })),
  version: t.Optional(
    t.String({
      pattern: '^\\d+(\\.\\d+){1,2}$',
      error:
        'Version must follow format major.minor or major.minor.patch (e.g., 1.0 or 1.0.0)',
    }),
  ),
  type: t.Union(
    [t.Literal('srd'), t.Literal('official'), t.Literal('homebrew')],
    { error: 'Type must be one of: srd, official, homebrew' },
  ),
  system: t.Optional(
    t.Union([
      t.Literal('dnd-3.5'),
      t.Literal('dnd-5e-2014'),
      t.Literal('dnd-5e-2024'),
      t.Literal('universal'),
    ]),
  ),
  creatorId: t.String(),
  dependencies: t.Optional(t.Array(t.String())),
  assets: t.Optional(t.Array(t.Any())),
});

export const UpdatePackSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  description: t.Optional(t.String({ maxLength: 2000 })),
  version: t.Optional(
    t.String({
      pattern: '^\\d+(\\.\\d+){1,2}$',
      error:
        'Version must follow format major.minor or major.minor.patch (e.g., 1.0 or 1.0.0)',
    }),
  ),
  assets: t.Optional(t.Array(t.Any())),
});

export const SuspendPackSchema = t.Object({
  reason: t.String({ minLength: 10, maxLength: 500 }),
});

export const PackQuerySchema = t.Object({
  type: t.Optional(t.String()),
  creatorId: t.Optional(t.String()),
});

export const AssetTypeQuerySchema = t.Object({
  type: t.Optional(t.String()),
});
