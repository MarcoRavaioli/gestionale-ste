import { PartialType } from '@nestjs/mapped-types';
import { CreateCommessaDto } from './create-commessa.dto';

export class UpdateCommessaDto extends PartialType(CreateCommessaDto) {}
