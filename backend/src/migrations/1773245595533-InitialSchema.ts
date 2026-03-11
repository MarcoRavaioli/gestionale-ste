import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1773245595533 implements MigrationInterface {
    name = 'InitialSchema1773245595533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "allegato" ("id" SERIAL NOT NULL, "nome_file" character varying NOT NULL, "percorso" character varying NOT NULL, "tipo_file" character varying, "data_caricamento" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "clienteId" integer, "indirizzoId" integer, "commessaId" integer, "appuntamentoId" integer, "fatturaId" integer, CONSTRAINT "PK_d0136e9c8fb3c113b3a042dc866" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."fattura_tipo_enum" AS ENUM('entrata', 'uscita')`);
        await queryRunner.query(`CREATE TABLE "fattura" ("id" SERIAL NOT NULL, "numero_fattura" character varying NOT NULL, "data_emissione" date NOT NULL, "descrizione" text, "totale" numeric(10,2) NOT NULL, "tipo" "public"."fattura_tipo_enum" NOT NULL DEFAULT 'entrata', "data_scadenza" date, "incassata" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "clienteId" integer, "commessaId" integer, CONSTRAINT "PK_ae673226de96033633ae80230cd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cliente" ("id" SERIAL NOT NULL, "nome" character varying NOT NULL, "telefono" character varying, "email" character varying, "deletedAt" TIMESTAMP, CONSTRAINT "PK_18990e8df6cf7fe71b9dc0f5f39" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "indirizzo" ("id" SERIAL NOT NULL, "via" character varying NOT NULL, "civico" character varying NOT NULL, "citta" character varying NOT NULL, "cap" character varying NOT NULL, "provincia" character varying, "stato" character varying NOT NULL DEFAULT 'Italia', "deletedAt" TIMESTAMP, "clienteId" integer, CONSTRAINT "PK_eff34f1fa7fd52e731fd5789208" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "commessa" ("id" SERIAL NOT NULL, "seriale" character varying NOT NULL, "descrizione" character varying, "stato" character varying NOT NULL DEFAULT 'APERTA', "valore_totale" double precision, "deletedAt" TIMESTAMP, "clienteId" integer, "indirizzoId" integer, CONSTRAINT "UQ_3a3cd74fdb234f9027745e8da00" UNIQUE ("seriale"), CONSTRAINT "PK_57c2c0c419b4aabff0ac0f0f3d0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "appuntamento" ("id" SERIAL NOT NULL, "nome" character varying NOT NULL, "data_ora" TIMESTAMP NOT NULL, "descrizione" text, "deletedAt" TIMESTAMP, "clienteId" integer, "indirizzoId" integer, "commessaId" integer, CONSTRAINT "PK_c1f2a87783983cfa641e6ab45ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "collaboratore" ("id" SERIAL NOT NULL, "nome" character varying NOT NULL, "cognome" character varying, "telefono" character varying, "nickname" character varying NOT NULL, "email" character varying, "password" character varying NOT NULL, "ruolo" character varying NOT NULL DEFAULT 'COLLABORATORE', "deletedAt" TIMESTAMP, CONSTRAINT "UQ_f8487678b52032c1d7ecbf81ae6" UNIQUE ("nickname"), CONSTRAINT "PK_0c05b87c27cdb600e1b86cbc060" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tracciamento_personale" ("id" SERIAL NOT NULL, "giorno" date NOT NULL, "ore_lavorate" double precision NOT NULL, "buono_pasto" boolean NOT NULL DEFAULT false, "descrizione" character varying, "deletedAt" TIMESTAMP, "collaboratoreId" integer, CONSTRAINT "PK_e5beedfa031919d3c72cac02478" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "appuntamento_collaboratori_collaboratore" ("appuntamentoId" integer NOT NULL, "collaboratoreId" integer NOT NULL, CONSTRAINT "PK_9a923a43f25615e40f97c73564a" PRIMARY KEY ("appuntamentoId", "collaboratoreId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3baada6fd3626d50f2af3d38b9" ON "appuntamento_collaboratori_collaboratore" ("appuntamentoId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f16526598cde78b46ab97e937b" ON "appuntamento_collaboratori_collaboratore" ("collaboratoreId") `);
        await queryRunner.query(`ALTER TABLE "allegato" ADD CONSTRAINT "FK_a844fa0296f4822ed9d57b60b58" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "allegato" ADD CONSTRAINT "FK_014f35e570d191a4eb9ac7167be" FOREIGN KEY ("indirizzoId") REFERENCES "indirizzo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "allegato" ADD CONSTRAINT "FK_7e79c2337a5b8529ce86d6994c2" FOREIGN KEY ("commessaId") REFERENCES "commessa"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "allegato" ADD CONSTRAINT "FK_2eb150630b40052bf2d56e9e708" FOREIGN KEY ("appuntamentoId") REFERENCES "appuntamento"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "allegato" ADD CONSTRAINT "FK_d06c9fae80003009e633f7d8147" FOREIGN KEY ("fatturaId") REFERENCES "fattura"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fattura" ADD CONSTRAINT "FK_902b11c00eeca80be0ffc3ba361" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fattura" ADD CONSTRAINT "FK_1694d696e17609ff7fbd8959601" FOREIGN KEY ("commessaId") REFERENCES "commessa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "indirizzo" ADD CONSTRAINT "FK_528879ef647865503e6cd2d8b27" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commessa" ADD CONSTRAINT "FK_8996297b6e529527ffe55d729b0" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commessa" ADD CONSTRAINT "FK_c5b6a66ef03cc504eb2fa309f39" FOREIGN KEY ("indirizzoId") REFERENCES "indirizzo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appuntamento" ADD CONSTRAINT "FK_cb479f67ced87e2867adc7afc01" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appuntamento" ADD CONSTRAINT "FK_23b3f429236122d4d18de98ba04" FOREIGN KEY ("indirizzoId") REFERENCES "indirizzo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appuntamento" ADD CONSTRAINT "FK_86d03b2ec7cdad03cf9d87d797c" FOREIGN KEY ("commessaId") REFERENCES "commessa"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tracciamento_personale" ADD CONSTRAINT "FK_215656a2b9594d342bc1cdd3687" FOREIGN KEY ("collaboratoreId") REFERENCES "collaboratore"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appuntamento_collaboratori_collaboratore" ADD CONSTRAINT "FK_3baada6fd3626d50f2af3d38b95" FOREIGN KEY ("appuntamentoId") REFERENCES "appuntamento"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "appuntamento_collaboratori_collaboratore" ADD CONSTRAINT "FK_f16526598cde78b46ab97e937b7" FOREIGN KEY ("collaboratoreId") REFERENCES "collaboratore"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appuntamento_collaboratori_collaboratore" DROP CONSTRAINT "FK_f16526598cde78b46ab97e937b7"`);
        await queryRunner.query(`ALTER TABLE "appuntamento_collaboratori_collaboratore" DROP CONSTRAINT "FK_3baada6fd3626d50f2af3d38b95"`);
        await queryRunner.query(`ALTER TABLE "tracciamento_personale" DROP CONSTRAINT "FK_215656a2b9594d342bc1cdd3687"`);
        await queryRunner.query(`ALTER TABLE "appuntamento" DROP CONSTRAINT "FK_86d03b2ec7cdad03cf9d87d797c"`);
        await queryRunner.query(`ALTER TABLE "appuntamento" DROP CONSTRAINT "FK_23b3f429236122d4d18de98ba04"`);
        await queryRunner.query(`ALTER TABLE "appuntamento" DROP CONSTRAINT "FK_cb479f67ced87e2867adc7afc01"`);
        await queryRunner.query(`ALTER TABLE "commessa" DROP CONSTRAINT "FK_c5b6a66ef03cc504eb2fa309f39"`);
        await queryRunner.query(`ALTER TABLE "commessa" DROP CONSTRAINT "FK_8996297b6e529527ffe55d729b0"`);
        await queryRunner.query(`ALTER TABLE "indirizzo" DROP CONSTRAINT "FK_528879ef647865503e6cd2d8b27"`);
        await queryRunner.query(`ALTER TABLE "fattura" DROP CONSTRAINT "FK_1694d696e17609ff7fbd8959601"`);
        await queryRunner.query(`ALTER TABLE "fattura" DROP CONSTRAINT "FK_902b11c00eeca80be0ffc3ba361"`);
        await queryRunner.query(`ALTER TABLE "allegato" DROP CONSTRAINT "FK_d06c9fae80003009e633f7d8147"`);
        await queryRunner.query(`ALTER TABLE "allegato" DROP CONSTRAINT "FK_2eb150630b40052bf2d56e9e708"`);
        await queryRunner.query(`ALTER TABLE "allegato" DROP CONSTRAINT "FK_7e79c2337a5b8529ce86d6994c2"`);
        await queryRunner.query(`ALTER TABLE "allegato" DROP CONSTRAINT "FK_014f35e570d191a4eb9ac7167be"`);
        await queryRunner.query(`ALTER TABLE "allegato" DROP CONSTRAINT "FK_a844fa0296f4822ed9d57b60b58"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f16526598cde78b46ab97e937b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3baada6fd3626d50f2af3d38b9"`);
        await queryRunner.query(`DROP TABLE "appuntamento_collaboratori_collaboratore"`);
        await queryRunner.query(`DROP TABLE "tracciamento_personale"`);
        await queryRunner.query(`DROP TABLE "collaboratore"`);
        await queryRunner.query(`DROP TABLE "appuntamento"`);
        await queryRunner.query(`DROP TABLE "commessa"`);
        await queryRunner.query(`DROP TABLE "indirizzo"`);
        await queryRunner.query(`DROP TABLE "cliente"`);
        await queryRunner.query(`DROP TABLE "fattura"`);
        await queryRunner.query(`DROP TYPE "public"."fattura_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "allegato"`);
    }

}
