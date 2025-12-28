import { PartialType } from '@nestjs/mapped-types';
import { CreateFatturaDto } from './create-fattura.dto';

export class UpdateFatturaDto extends PartialType(CreateFatturaDto) {}
