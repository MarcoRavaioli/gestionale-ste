import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import { CommessaService } from './commessa.service';
import { CreateCommessaDto } from './dto/create-commessa.dto';
import { UpdateCommessaDto } from './dto/update-commessa.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('commessa')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommessaController {
  constructor(private readonly commessaService: CommessaService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() createCommessaDto: CreateCommessaDto) {
    return this.commessaService.create(createCommessaDto);
  }

  @Get()
  async findAll(@Req() req: any) {
    const user = req.user;
    const commesse = await this.commessaService.findAll();
    if (user?.ruolo === 'COLLABORATORE') {
      return commesse.map((c) => {
        const { valore_totale, fatture, ...safeCommessa } = c;
        return safeCommessa;
      });
    }
    return commesse;
  }

  @Get('paginated')
  async findPaginated(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
  ) {
    const user = req.user;
    const result = await this.commessaService.findPaginated(
      Number(page),
      Number(limit),
      search,
    );
    if (user?.ruolo === 'COLLABORATORE') {
      result.data = result.data.map((c: any) => {
        const { valore_totale, fatture, ...safeCommessa } = c;
        return safeCommessa;
      }) as any;
    }
    return result;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = req.user;
    const commessa = await this.commessaService.findOne(id);
    if (user?.ruolo === 'COLLABORATORE' && commessa) {
      const { valore_totale, fatture, ...safeCommessa } = commessa;
      return safeCommessa;
    }
    return commessa;
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommessaDto: UpdateCommessaDto,
  ) {
    return this.commessaService.update(id, updateCommessaDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('cascade') cascade?: string,
  ) {
    const isCascade = cascade === 'true';
    return this.commessaService.remove(id, isCascade);
  }
}
