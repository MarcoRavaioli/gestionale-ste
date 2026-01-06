import { PartialType } from '@nestjs/mapped-types';
import { CreateIndirizzoDto } from './create-indirizzo.dto';

export class UpdateIndirizzoDto extends PartialType(CreateIndirizzoDto) {}
