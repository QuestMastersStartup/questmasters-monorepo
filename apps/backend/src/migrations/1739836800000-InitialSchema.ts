import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1739836800000 implements MigrationInterface {
  name = 'InitialSchema1739836800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "content_packs" (
        "id" uuid NOT NULL,
        "slug" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "version" character varying(50) NOT NULL DEFAULT '1.0.0',
        "type" character varying(20) NOT NULL,
        "system" character varying(20) NOT NULL DEFAULT 'dnd-5e-2014',
        "creator_id" character varying(255),
        "dependencies" uuid[] NOT NULL DEFAULT '{}',
        "is_active" boolean NOT NULL DEFAULT true,
        "is_suspended" boolean NOT NULL DEFAULT false,
        "suspension_reason" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_content_packs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_content_packs_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "assets" (
        "id" uuid NOT NULL,
        "pack_id" uuid NOT NULL,
        "type" character varying(50) NOT NULL,
        "index" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "data" jsonb NOT NULL,
        "compatible_with" uuid[] NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_assets_pack_id" FOREIGN KEY ("pack_id")
          REFERENCES "content_packs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_assets_pack_type_index"
        ON "assets" ("pack_id", "type", "index")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_assets_pack_type_index"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "assets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "content_packs"`);
  }
}
