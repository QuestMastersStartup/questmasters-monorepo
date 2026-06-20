import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const nowMs = sql`(unixepoch('now') * 1000)`;

export const userProfiles = sqliteTable('user_profiles', {
  id:        text('id').primaryKey(),
  username:  text('username').unique(),
  avatarUrl: text('avatar_url'),
  bio:       text('bio'),
  role:      text('role').notNull().default('player'),
  isAdmin:   integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
});

export const contentPacks = sqliteTable('content_packs', {
  id:               text('id').primaryKey(),
  slug:             text('slug').notNull().unique(),
  name:             text('name').notNull(),
  description:      text('description'),
  version:          text('version').notNull().default('1.0.0'),
  type:             text('type').notNull(),
  system:           text('system').notNull().default('dnd-5e-2014'),
  creatorId:        text('creator_id'),
  dependencies:     text('dependencies', { mode: 'json' }).$type<string[]>().default([]),
  isActive:         integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isSuspended:      integer('is_suspended', { mode: 'boolean' }).notNull().default(false),
  suspensionReason: text('suspension_reason'),
  status:           text('status').notNull().default('draft'),
  createdAt:        integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
  updatedAt:        integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
});

export const assets = sqliteTable('assets', {
  id:             text('id').primaryKey(),
  packId:         text('pack_id').notNull().references(() => contentPacks.id, { onDelete: 'cascade' }),
  type:           text('type').notNull(),
  index:          text('index').notNull(),
  name:           text('name').notNull(),
  data:           text('data', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  compatibleWith: text('compatible_with', { mode: 'json' }).$type<string[]>().default([]),
  createdAt:      integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
  updatedAt:      integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
}, (t) => [
  uniqueIndex('IDX_assets_pack_type_index').on(t.packId, t.type, t.index),
]);

export const campaigns = sqliteTable('campaigns', {
  id:            text('id').primaryKey(),
  name:          text('name').notNull(),
  description:   text('description').notNull(),
  system:        text('system').notNull().default('dnd-5e-2014'),
  coverImageUrl: text('cover_image_url'),
  dmId:          text('dm_id').notNull(),
  status:        text('status').notNull().default('active'),
  createdAt:     integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
  updatedAt:     integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
});

export const campaignInstalledPacks = sqliteTable('campaign_installed_packs', {
  campaignId:  text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  packId:      text('pack_id').notNull().references(() => contentPacks.id, { onDelete: 'cascade' }),
  installedAt: integer('installed_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
}, (t) => [
  primaryKey({ columns: [t.campaignId, t.packId] }),
]);

export const campaignMembers = sqliteTable('campaign_members', {
  id:         text('id').primaryKey(),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  userId:     text('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  role:       text('role').notNull().default('player'),
  joinedAt:   integer('joined_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
}, (t) => [
  uniqueIndex('IDX_campaign_members_unique').on(t.campaignId, t.userId),
]);

export const characters = sqliteTable('characters', {
  id:                text('id').primaryKey(),
  campaignId:        text('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  userId:            text('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  name:              text('name').notNull(),
  raceAssetId:       text('race_asset_id').references(() => assets.id, { onDelete: 'set null' }),
  classAssetId:      text('class_asset_id').references(() => assets.id, { onDelete: 'set null' }),
  backgroundAssetId: text('background_asset_id').references(() => assets.id, { onDelete: 'set null' }),
  level:             integer('level').notNull().default(1),
  stats:             text('stats', { mode: 'json' }).$type<Record<string, number>>().notNull(),
  hitPoints:         integer('hit_points').notNull(),
  portraitUrl:       text('portrait_url'),
  backstory:         text('backstory'),
  status:            text('status').notNull().default('active'),
  choices:           text('choices', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt:         integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
  updatedAt:         integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
}, (t) => [
  index('IDX_characters_user_id').on(t.userId),
  index('IDX_characters_campaign_id').on(t.campaignId),
]);

export const dmSessions = sqliteTable('dm_sessions', {
  id:               text('id').primaryKey(),
  userId:           text('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  title:            text('title').notNull(),
  campaignPrompt:   text('campaign_prompt').notNull(),
  characters:       text('characters', { mode: 'json' }).$type<unknown[]>().notNull().default([]),
  architectureType: text('architecture_type').notNull(),
  status:           text('status').notNull().default('initializing'),
  modelId:          text('model_id').notNull(),
  memorySnapshot:   text('memory_snapshot', { mode: 'json' }).$type<Record<string, unknown>>().notNull().default({}),
  narrativeNotes:   text('narrative_notes', { mode: 'json' }).$type<unknown[]>().notNull().default([]),
  turnCount:        integer('turn_count').notNull().default(0),
  totalInputTokens: integer('total_input_tokens').notNull().default(0),
  totalOutputTokens:integer('total_output_tokens').notNull().default(0),
  totalLatencyMs:   integer('total_latency_ms').notNull().default(0),
  createdAt:        integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
  updatedAt:        integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
  deletedAt:        integer('deleted_at', { mode: 'timestamp_ms' }),
});

export const dmTurns = sqliteTable('dm_turns', {
  id:                  text('id').primaryKey(),
  sessionId:           text('session_id').notNull().references(() => dmSessions.id, { onDelete: 'cascade' }),
  turnNumber:          integer('turn_number').notNull(),
  role:                text('role').notNull(),
  playerInput:         text('player_input'),
  dmResponse:          text('dm_response').notNull(),
  memorySnapshotAfter: text('memory_snapshot_after', { mode: 'json' }).$type<Record<string, unknown>>().notNull().default({}),
  narrativeNotesDelta: text('narrative_notes_delta', { mode: 'json' }).$type<unknown[]>().notNull().default([]),
  inputTokens:         integer('input_tokens').notNull().default(0),
  outputTokens:        integer('output_tokens').notNull().default(0),
  latencyMs:           integer('latency_ms').notNull().default(0),
  modelId:             text('model_id').notNull(),
  architectureType:    text('architecture_type').notNull(),
  createdAt:           integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
}, (t) => [
  index('IDX_dm_turns_session_id').on(t.sessionId),
  uniqueIndex('IDX_dm_turns_session_turn').on(t.sessionId, t.turnNumber),
]);

export const userCredentials = sqliteTable('user_credentials', {
  userId:       text('user_id').primaryKey().references(() => userProfiles.id, { onDelete: 'cascade' }),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt:    integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
});
