import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCharacters1775422260395 implements MigrationInterface {
    name = 'CreateCharacters1775422260395';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "characters" (
                "id" uuid NOT NULL,
                "campaign_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "name" character varying(100) NOT NULL,
                "race_asset_id" uuid NOT NULL,
                "class_asset_id" uuid NOT NULL,
                "background_asset_id" uuid,
                "level" integer NOT NULL DEFAULT 1,
                "stats" jsonb NOT NULL,
                "hit_points" integer NOT NULL,
                "portrait_url" text,
                "backstory" text,
                "status" character varying(20) NOT NULL DEFAULT 'active',
                "choices" jsonb,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_characters" PRIMARY KEY ("id"),
                CONSTRAINT "FK_characters_campaign" FOREIGN KEY ("campaign_id") 
                    REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_characters_user" FOREIGN KEY ("user_id") 
                    REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_characters_race" FOREIGN KEY ("race_asset_id") 
                    REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
                CONSTRAINT "FK_characters_class" FOREIGN KEY ("class_asset_id") 
                    REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
                CONSTRAINT "FK_characters_background" FOREIGN KEY ("background_asset_id") 
                    REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_characters_active_user_campaign" 
            ON "characters" ("campaign_id", "user_id") 
            WHERE "status" = 'active'
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_characters_campaign_id" 
            ON "characters" ("campaign_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_characters_campaign_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_characters_active_user_campaign"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "characters"`);
    }
}
