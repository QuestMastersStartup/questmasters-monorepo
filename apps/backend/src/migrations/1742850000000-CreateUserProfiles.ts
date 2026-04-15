import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserProfiles1742850000000 implements MigrationInterface {
  name = 'CreateUserProfiles1742850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "id"         uuid         NOT NULL,
        "username"   varchar(50)  UNIQUE,
        "avatarUrl"  text,
        "bio"        text,
        "role"       varchar(20)  NOT NULL DEFAULT 'player',
        "isAdmin"    boolean      NOT NULL DEFAULT false,
        "createdAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_profiles" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles"`);
  }
}
