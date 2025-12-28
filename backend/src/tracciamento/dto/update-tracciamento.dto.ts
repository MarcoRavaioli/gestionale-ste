import { PartialType } from '@nestjs/mapped-types';
import { CreateTracciamentoDto } from './create-tracciamento.dto';

export class UpdateTracciamentoDto extends PartialType(CreateTracciamentoDto) {}
