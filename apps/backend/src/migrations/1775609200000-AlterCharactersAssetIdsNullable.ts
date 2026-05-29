import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCharactersAssetIdsNullable1775609200000 implements MigrationInterface {
  name = 'AlterCharactersAssetIdsNullable1775609200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Libre-mode characters have no bound asset; FK constraint still applies
    // to non-NULL values so referential integrity is preserved.
    await queryRunner.query(`ALTER TABLE "characters" ALTER COLUMN "race_asset_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "characters" ALTER COLUMN "class_asset_id" DROP NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Characters with NULL asset IDs were created in libre mode.
    // Reverting requires a valid placeholder — delete them first or set manually.
    await queryRunner.query(`DELETE FROM "characters" WHERE "race_asset_id" IS NULL OR "class_asset_id" IS NULL`);
    await queryRunner.query(`ALTER TABLE "characters" ALTER COLUMN "race_asset_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "characters" ALTER COLUMN "class_asset_id" SET NOT NULL`);
  }
}
