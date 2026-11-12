import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GuestController } from './guests.controller';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';

describe('GuestController', () => {
  let controller: GuestController;
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<GuestController>(GuestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call commandBus.execute when creating guest', async () => {
    const dto: CreateGuestDto = {
      email: 'guest@example.com',
      password: 'password123',
      name: 'Guest User',
      role: 'guest',
    };
    commandBus.execute.mockResolvedValueOnce({ id: 'uuid-1', ...dto });

    const result = await controller.createGuest(dto);
    expect(commandBus.execute).toHaveBeenCalled();
    expect(result).toHaveProperty('id', 'uuid-1');
  });

  it('should call queryBus.execute when getting guests', async () => {
    queryBus.execute.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    const result = await controller.getGuests(1, 10);
    expect(queryBus.execute).toHaveBeenCalled();
    expect(result.data).toEqual([]);
  });

  it('should call queryBus.execute when getting a guest by ID', async () => {
    queryBus.execute.mockResolvedValueOnce({ id: 'uuid-1', name: 'Guest' });

    const result = await controller.getGuest('uuid-1');
    expect(queryBus.execute).toHaveBeenCalled();
    expect(result).toHaveProperty('id', 'uuid-1');
  });

  it('should call commandBus.execute when updating guest', async () => {
    const dto: UpdateGuestDto = { name: 'Updated Name' };
    commandBus.execute.mockResolvedValueOnce({
      id: 'uuid-1',
      name: 'Updated Name',
    });

    const result = await controller.updateGuest('uuid-1', dto);
    expect(commandBus.execute).toHaveBeenCalled();
    expect(result).toHaveProperty('name', 'Updated Name');
  });

  it('should call commandBus.execute when deleting guest', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await controller.deleteGuest('uuid-1');
    expect(commandBus.execute).toHaveBeenCalled();
  });
});
