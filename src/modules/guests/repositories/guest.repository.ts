import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Guest } from '../guest.entity';

@Injectable()
export class GuestRepository {
  constructor(
    @InjectRepository(Guest)
    private readonly repository: Repository<Guest>,
  ) {}

  async create(guestData: Partial<Guest>): Promise<Guest> {
    const guest = this.repository.create(guestData);
    return await this.repository.save(guest);
  }

  async findById(id: string): Promise<Guest | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Guest | null> {
    return await this.repository.findOne({ where: { email } });
  }

  async find(options?: FindManyOptions<Guest>): Promise<Guest[]> {
    return await this.repository.find(options);
  }

  async count(options?: FindManyOptions<Guest>): Promise<number> {
    return await this.repository.count(options);
  }

  async update(id: string, updates: Partial<Guest>): Promise<Guest | null> {
    await this.repository.update(id, updates);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
