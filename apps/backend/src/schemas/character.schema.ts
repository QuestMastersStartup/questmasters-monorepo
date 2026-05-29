import { t } from 'elysia';

// ─── Ability Scores Sub-Schema ──────────────────────────────────────

const AbilityScoresSchema = t.Object({
  strength: t.Number({ minimum: 1, maximum: 30 }),
  dexterity: t.Number({ minimum: 1, maximum: 30 }),
  constitution: t.Number({ minimum: 1, maximum: 30 }),
  intelligence: t.Number({ minimum: 1, maximum: 30 }),
  wisdom: t.Number({ minimum: 1, maximum: 30 }),
  charisma: t.Number({ minimum: 1, maximum: 30 }),
});

// ─── Create ─────────────────────────────────────────────────────────

export const CreateCharacterSchema = t.Object({
  campaignId: t.Optional(t.String({ format: 'uuid' })),
  name: t.String({ minLength: 1, maxLength: 80 }),
  // null when method === 'libre' (libre characters have no bound asset)
  raceAssetId: t.Optional(t.Union([t.String({ format: 'uuid' }), t.Null()])),
  classAssetId: t.Optional(t.Union([t.String({ format: 'uuid' }), t.Null()])),
  backgroundAssetId: t.Optional(t.Union([t.String({ format: 'uuid' }), t.Null()])),
  stats: AbilityScoresSchema,
  portraitUrl: t.Optional(t.String()),
  backstory: t.Optional(t.String({ maxLength: 2000 })),
  choices: t.Optional(t.Record(t.String(), t.Any())),
  method: t.Union([
    t.Literal('point-buy'),
    t.Literal('free'),
    t.Literal('libre'),
  ], { default: 'point-buy' }),
  // Optional override for HP — if omitted the backend auto-calculates max HP.
  hitPoints: t.Optional(t.Number({ minimum: 1, maximum: 999 })),
});

// ─── Update ─────────────────────────────────────────────────────────

export const UpdateCharacterSchema = t.Object({
  // Owner fields
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  backstory: t.Optional(t.Union([t.String({ maxLength: 5000 }), t.Null()])),
  portraitUrl: t.Optional(t.Union([t.String(), t.Null()])),
  choices: t.Optional(t.Union([t.Record(t.String(), t.Any()), t.Null()])),
  // DM fields
  stats: t.Optional(AbilityScoresSchema),
  level: t.Optional(t.Number({ minimum: 1, maximum: 20 })),
  hitPoints: t.Optional(t.Number({ minimum: 0 })),
  status: t.Optional(
    t.Union([
      t.Literal('active'),
      t.Literal('dead'),
      t.Literal('retired'),
    ], { error: 'Status must be one of: active, dead, retired' }),
  ),
});

// ─── Query ──────────────────────────────────────────────────────────

export const CharacterQuerySchema = t.Object({
  campaignId: t.Optional(t.String()),
});

export const AvailableAssetsQuerySchema = t.Object({
  campaignId: t.Optional(t.String()),
  type: t.Optional(t.String()),
  query: t.Optional(t.String()),
  // Vanilla mode: filter assets by compatible system (e.g. 'dnd-5e-2024')
  system: t.Optional(t.String()),
  // Personalizado mode: comma-separated pack IDs to include
  packIds: t.Optional(t.String()),
});
