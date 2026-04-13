import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterCharactersCampaignIdNullable1775508900000 implements MigrationInterface {
    name = 'AlterCharactersCampaignIdNullable1775508900000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing FK constraint
        await queryRunner.query(`ALTER TABLE "characters" DROP CONSTRAINT IF EXISTS "FK_characters_campaign"`);

        // Make campaign_id nullable
        await queryRunner.query(`ALTER TABLE "characters" ALTER COLUMN "campaign_id" DROP NOT NULL`);

        // Re-add FK with ON DELETE SET NULL (when campaign is deleted, character becomes unassigned)
        await queryRunner.query(`
            ALTER TABLE "characters" ADD CONSTRAINT "FK_characters_campaign"
            FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Drop and recreate the partial unique index to allow NULLs
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_characters_active_user_campaign"`);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_characters_active_user_campaign"
            ON "characters" ("campaign_id", "user_id")
            WHERE "status" = 'active' AND "campaign_id" IS NOT NULL
        `);

        // Add index on user_id for "my characters" queries
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_characters_user_id"
            ON "characters" ("user_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_characters_user_id"`);

        // Restore old index
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_characters_active_user_campaign"`);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_characters_active_user_campaign"
            ON "characters" ("campaign_id", "user_id")
            WHERE "status" = 'active'
        `);

        // Drop FK
        await queryRunner.query(`ALTER TABLE "characters" DROP CONSTRAINT IF EXISTS "FK_characters_campaign"`);

        // Make campaign_id NOT NULL again (will fail if there are NULL rows)
        await queryRunner.query(`ALTER TABLE "characters" ALTER COLUMN "campaign_id" SET NOT NULL`);

        // Re-add original FK
        await queryRunner.query(`
            ALTER TABLE "characters" ADD CONSTRAINT "FK_characters_campaign"
            FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }
}
