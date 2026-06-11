import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDmSessions1781100000000 implements MigrationInterface {
    name = 'CreateDmSessions1781100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "dm_sessions" (
                "id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "title" character varying(150) NOT NULL,
                "campaign_prompt" text NOT NULL,
                "characters" jsonb NOT NULL DEFAULT '[]',
                "architecture_type" character varying(20) NOT NULL,
                "status" character varying(20) NOT NULL DEFAULT 'initializing',
                "model_id" character varying(100) NOT NULL DEFAULT 'fable-5',
                "memory_snapshot" jsonb NOT NULL DEFAULT '{}',
                "narrative_notes" jsonb NOT NULL DEFAULT '[]',
                "turn_count" integer NOT NULL DEFAULT 0,
                "total_input_tokens" integer NOT NULL DEFAULT 0,
                "total_output_tokens" integer NOT NULL DEFAULT 0,
                "total_latency_ms" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_dm_sessions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_dm_sessions_user" FOREIGN KEY ("user_id")
                    REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_dm_sessions_user_id"
            ON "dm_sessions" ("user_id")
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "dm_turns" (
                "id" uuid NOT NULL,
                "session_id" uuid NOT NULL,
                "turn_number" integer NOT NULL,
                "role" character varying(10) NOT NULL,
                "player_input" text,
                "dm_response" text NOT NULL,
                "memory_snapshot_after" jsonb NOT NULL DEFAULT '{}',
                "narrative_notes_delta" jsonb NOT NULL DEFAULT '[]',
                "input_tokens" integer NOT NULL DEFAULT 0,
                "output_tokens" integer NOT NULL DEFAULT 0,
                "latency_ms" integer NOT NULL DEFAULT 0,
                "model_id" character varying(100) NOT NULL,
                "architecture_type" character varying(20) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_dm_turns" PRIMARY KEY ("id"),
                CONSTRAINT "FK_dm_turns_session" FOREIGN KEY ("session_id")
                    REFERENCES "dm_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_dm_turns_session_id"
            ON "dm_turns" ("session_id")
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_dm_turns_session_turn_number"
            ON "dm_turns" ("session_id", "turn_number")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_dm_turns_session_turn_number"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_dm_turns_session_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "dm_turns"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_dm_sessions_user_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "dm_sessions"`);
    }
}
