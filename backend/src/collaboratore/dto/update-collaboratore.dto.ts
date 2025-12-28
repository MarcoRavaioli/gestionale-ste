import { PartialType } from '@nestjs/mapped-types';
import { CreateCollaboratoreDto } from './create-collaboratore.dto';

export class UpdateCollaboratoreDto extends PartialType(CreateCollaboratoreDto) {}
