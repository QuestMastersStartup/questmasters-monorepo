import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateCampaignMembers1743000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "campaign_members",
                columns: [
                    {
                        name: "campaign_id",
                        type: "uuid",
                        isPrimary: true,
                    },
                    {
                        name: "user_id",
                        type: "uuid",
                        isPrimary: true,
                    },
                    {
                        name: "role",
                        type: "varchar",
                        length: "20",
                        default: "'player'",
                    },
                    {
                        name: "joined_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            "campaign_members",
            new TableForeignKey({
                columnNames: ["campaign_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "campaigns",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "campaign_members",
            new TableForeignKey({
                columnNames: ["user_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "user_profiles",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createIndex(
            "campaign_members",
            new TableIndex({
                name: "idx_campaign_members_user",
                columnNames: ["user_id"],
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("campaign_members");
    }
}
