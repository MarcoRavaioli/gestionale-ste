import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express'; // <--- Serve questo
import { diskStorage } from 'multer'; // <--- E questo
import { extname } from 'path';
import { AllegatoService } from './allegato.service';
import { AllegatoController } from './allegato.controller';
import { Allegato } from '../entities/allegato.entity';
import { Commessa } from '../entities/commessa.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Allegato, Commessa]),
    // Configurazione Upload
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads', // Dove salvare i file
        filename: (req, file, cb) => {
          // Generiamo un nome unico per evitare sovrascritture
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [AllegatoController],
  providers: [AllegatoService],
})
export class AllegatoModule {}
