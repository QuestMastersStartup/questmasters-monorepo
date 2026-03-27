import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCampaigns1742900000000 implements MigrationInterface {
  name = 'CreateCampaigns1742900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "campaigns" (
        "id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "system" character varying(20) NOT NULL DEFAULT 'dnd-5e-2014',
        "cover_image_url" text,
        "dm_id" character varying(255) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaigns" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "campaign_installed_packs" (
        "campaign_id" uuid NOT NULL,
        "pack_id" uuid NOT NULL,
        "installed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaign_installed_packs" PRIMARY KEY ("campaign_id", "pack_id"),
        CONSTRAINT "FK_campaign_installed_packs_campaign" FOREIGN KEY ("campaign_id") 
          REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_campaign_installed_packs_pack" FOREIGN KEY ("pack_id") 
          REFERENCES "content_packs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "campaign_installed_packs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campaigns"`);
  }
}
