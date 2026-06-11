import { t } from 'elysia';

// ─── Character Snapshot Sub-Schema ──────────────────────────────────

const CharacterSnapshotSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  race: t.String({ maxLength: 100, default: '' }),
  class: t.String({ maxLength: 100, default: '' }),
  background: t.String({ maxLength: 200, default: '' }),
  description: t.String({ minLength: 1, maxLength: 5000 }),
});

// ─── Create ─────────────────────────────────────────────────────────

export const CreateDmSessionSchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 150 }),
  campaignPrompt: t.String({ minLength: 1, maxLength: 20000 }),
  characters: t.Array(CharacterSnapshotSchema, { minItems: 1, maxItems: 12 }),
  architectureType: t.Union([t.Literal('mas'), t.Literal('monolithic')]),
  modelId: t.Optional(t.String({ maxLength: 100 })),
});

// ─── Player Turn ────────────────────────────────────────────────────

export const SendPlayerTurnSchema = t.Object({
  playerInput: t.String({ minLength: 1, maxLength: 10000 }),
});

// ─── Params ─────────────────────────────────────────────────────────

export const DmSessionParamsSchema = t.Object({
  id: t.String({ format: 'uuid', description: 'DM Session UUID' }),
});
