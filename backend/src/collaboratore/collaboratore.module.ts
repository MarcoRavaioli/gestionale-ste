import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaboratoreService } from './collaboratore.service';
import { CollaboratoreController } from './collaboratore.controller';
import { Collaboratore } from '../entities/collaboratore.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Collaboratore])],
  controllers: [CollaboratoreController],
  providers: [CollaboratoreService],
  exports: [CollaboratoreService],
})
export class CollaboratoreModule {}
