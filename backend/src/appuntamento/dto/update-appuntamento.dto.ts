import { PartialType } from '@nestjs/mapped-types';
import { CreateAppuntamentoDto } from './create-appuntamento.dto';

export class UpdateAppuntamentoDto extends PartialType(CreateAppuntamentoDto) {}
