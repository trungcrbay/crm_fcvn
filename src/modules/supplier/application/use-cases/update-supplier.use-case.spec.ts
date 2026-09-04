import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { SupplierEntity } from '../../domain';
import { UpdateSupplierUseCase } from './update-supplier.use-case';

describe('UpdateSupplierUseCase', () => {
  const currentUserId = 10;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByIds: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    remove: jest.fn(),
  };

  let useCase: UpdateSupplierUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpdateSupplierUseCase(mockRepository);
  });

  const command = {
    name: 'Updated Supplier',
    phone: '0988776655',
  };

  it('should update supplier and set updatedById', async () => {
    const updatedSupplier = SupplierEntity.create({
      id: 1,
      supplierCode: 'SUP-001',
      name: 'Updated Supplier',
      phone: '0988776655',
    });

    mockRepository.update.mockResolvedValue(updatedSupplier);

    const result = await useCase.execute(1, command, currentUserId);

    expect(mockRepository.update).toHaveBeenCalledWith(1, {
      supplierCode: undefined,
      name: 'Updated Supplier',
      email: undefined,
      phone: '0988776655',
      address: undefined,
      supplierGroupId: undefined,
      status: undefined,
      updatedById: currentUserId,
    });
    expect(result).toEqual(updatedSupplier);
  });

  it('should throw NotFoundException when supplier to update is not found', async () => {
    mockRepository.update.mockResolvedValue(null);

    await expect(
      useCase.execute(999, { name: 'Not Found' }, currentUserId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException on unique constraint error', async () => {
    mockRepository.update.mockRejectedValue(
      new QueryFailedError('UPDATE suppliers failed', [], {
        code: '23505',
        detail: 'Key (email)=(dup@example.com) already exists.',
      } as any),
    );

    await expect(useCase.execute(1, command, currentUserId)).rejects.toThrow(
      ConflictException,
    );
  });
});
