import { PartialType } from '@nestjs/mapped-types';
import { CreateAllegatoDto } from './create-allegato.dto';

export class UpdateAllegatoDto extends PartialType(CreateAllegatoDto) {}
