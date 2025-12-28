import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAppuntamentoDto } from './dto/create-appuntamento.dto';
import { UpdateAppuntamentoDto } from './dto/update-appuntamento.dto';
import { Appuntamento } from '../entities/appuntamento.entity';
import { Cliente } from '../entities/cliente.entity';
import { Indirizzo } from '../entities/indirizzo.entity';

@Injectable()
export class AppuntamentoService {
  constructor(
    @InjectRepository(Appuntamento)
    private readonly appuntamentoRepository: Repository<Appuntamento>,

    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,

    @InjectRepository(Indirizzo)
    private readonly indirizzoRepository: Repository<Indirizzo>,
  ) {}

  async create(createDto: CreateAppuntamentoDto) {
    // FIX: Definiamo che questa variabile può essere null inizialmente
    let clienteFinale: Cliente | null = null;

    // CASO 1: Il frontend passa un ID esistente
    if (createDto.clienteId) {
      // findOneBy restituisce "Cliente | null", ora è compatibile con la variabile
      clienteFinale = await this.clienteRepository.findOneBy({
        id: createDto.clienteId,
      });

      if (!clienteFinale) {
        throw new NotFoundException(
          `Cliente con ID ${createDto.clienteId} non trovato.`,
        );
      }
    }
    // CASO 2: Il frontend passa i dati per un NUOVO cliente
    else if (createDto.nuovoCliente) {
      const nuovoClienteEntity = this.clienteRepository.create({
        nome: createDto.nuovoCliente.nome,
        telefono: createDto.nuovoCliente.telefono,
        email: createDto.nuovoCliente.email,
      });
      // save restituisce sempre l'entità salvata (non null), quindi è sicuro
      clienteFinale = await this.clienteRepository.save(nuovoClienteEntity);

      if (
        createDto.nuovoCliente.indirizzi &&
        createDto.nuovoCliente.indirizzi.length > 0
      ) {
        const indirizziEntities = createDto.nuovoCliente.indirizzi.map(
          (addr) => {
            return this.indirizzoRepository.create({
              ...addr,
              cliente: clienteFinale!, // Il punto esclamativo assicura a TS che non è null (perché lo abbiamo appena salvato)
            });
          },
        );
        await this.indirizzoRepository.save(indirizziEntities);
      }
    }
    // CASO 3: Dati insufficienti
    else {
      throw new BadRequestException(
        "Devi fornire un 'clienteId' oppure un oggetto 'nuovoCliente'.",
      );
    }

    // FIX FINALE: Controllo di sicurezza
    // Se siamo arrivati qui e clienteFinale è ancora null (impossibile logica, ma TS lo teme), lanciamo errore
    if (!clienteFinale) {
      throw new BadRequestException('Impossibile determinare il cliente.');
    }

    const nuovoAppuntamento = this.appuntamentoRepository.create({
      nome: createDto.nome,
      data_ora: createDto.data_ora,
      descrizione: createDto.descrizione,
      cliente: clienteFinale, // Ora TS sa che qui clienteFinale è sicuramente di tipo Cliente
    });

    return this.appuntamentoRepository.save(nuovoAppuntamento);
  }

  findAll() {
    return this.appuntamentoRepository.find({
      relations: ['cliente'],
    });
  }

  findOne(id: number) {
    return this.appuntamentoRepository.findOne({
      where: { id },
      relations: ['cliente'],
    });
  }

  update(id: number, updateDto: UpdateAppuntamentoDto) {
    return this.appuntamentoRepository.update(id, updateDto);
  }

  remove(id: number) {
    return this.appuntamentoRepository.delete(id);
  }
}
