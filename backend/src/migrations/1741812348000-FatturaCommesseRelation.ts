import { MigrationInterface, QueryRunner } from "typeorm";

export class FatturaCommesseRelation1741812348000 implements MigrationInterface {
    name = 'FatturaCommesseRelation1741812348000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the join table
        await queryRunner.query(`CREATE TABLE "fattura_commesse" ("fattura_id" integer NOT NULL, "commessa_id" integer NOT NULL, CONSTRAINT "PK_fattura_commesse" PRIMARY KEY ("fattura_id", "commessa_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fattura_id" ON "fattura_commesse" ("fattura_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_commessa_id" ON "fattura_commesse" ("commessa_id") `);

        // Add foreign keys
        await queryRunner.query(`ALTER TABLE "fattura_commesse" ADD CONSTRAINT "FK_fattura_id" FOREIGN KEY ("fattura_id") REFERENCES "fattura"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "fattura_commesse" ADD CONSTRAINT "FK_commessa_id" FOREIGN KEY ("commessa_id") REFERENCES "commessa"("id") ON DELETE CASCADE ON UPDATE CASCADE`);

        // Migration of data: If there was a commessaId in fattura, move it to the join table
        await queryRunner.query(`INSERT INTO "fattura_commesse" ("fattura_id", "commessa_id") SELECT "id", "commessaId" FROM "fattura" WHERE "commessaId" IS NOT NULL`);

        // Drop the old column and constraint
        await queryRunner.query(`ALTER TABLE "fattura" DROP CONSTRAINT IF EXISTS "FK_1694d696e17609ff7fbd8959601"`);
        await queryRunner.query(`ALTER TABLE "fattura" DROP COLUMN "commessaId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-add the column
        await queryRunner.query(`ALTER TABLE "fattura" ADD "commessaId" integer`);
        await queryRunner.query(`ALTER TABLE "fattura" ADD CONSTRAINT "FK_1694d696e17609ff7fbd8959601" FOREIGN KEY ("commessaId") REFERENCES "commessa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Move one commessa back (if any)
        await queryRunner.query(`UPDATE "fattura" SET "commessaId" = (SELECT "commessa_id" FROM "fattura_commesse" WHERE "fattura_id" = "fattura"."id" LIMIT 1)`);

        // Drop join table
        await queryRunner.query(`DROP TABLE "fattura_commesse"`);
    }
}
