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
  name: t.String({ minLength: 1, maxLength: 100 }),
  raceAssetId: t.String({ format: 'uuid' }),
  classAssetId: t.String({ format: 'uuid' }),
  backgroundAssetId: t.Optional(t.String({ format: 'uuid' })),
  stats: AbilityScoresSchema,
  portraitUrl: t.Optional(t.String()),
  backstory: t.Optional(t.String({ maxLength: 5000 })),
  choices: t.Optional(t.Record(t.String(), t.Any())),
  method: t.Union([
    t.Literal('point-buy'),
    t.Literal('free'),
  ], { default: 'point-buy' }),
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
});
