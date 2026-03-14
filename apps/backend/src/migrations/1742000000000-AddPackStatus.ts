import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPackStatus1742000000000 implements MigrationInterface {
  name = 'AddPackStatus1742000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "content_packs"
      ADD COLUMN IF NOT EXISTS "status" character varying(20) NOT NULL DEFAULT 'draft'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "content_packs"
      DROP COLUMN IF EXISTS "status"
    `);
  }
}
