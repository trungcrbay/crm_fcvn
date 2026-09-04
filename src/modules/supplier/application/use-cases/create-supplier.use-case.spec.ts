import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import { SupplierEntity } from '../../domain';
import { CreateSupplierUseCase } from './create-supplier.use-case';

describe('CreateSupplierUseCase', () => {
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

  let useCase: CreateSupplierUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateSupplierUseCase(mockRepository);
  });

  const command = {
    supplierCode: '  SUP-001  ',
    name: '  Supplier ABC  ',
    email: '  SUPPLIER@EXAMPLE.COM  ',
    phone: ' 0901234567 ',
    address: '  123 Road  ',
  };

  it('should create a valid supplier with trimmed values and lowercase email', async () => {
    const createdSupplier = SupplierEntity.create({
      id: 1,
      supplierCode: 'SUP-001',
      name: 'Supplier ABC',
      email: 'supplier@example.com',
      phone: '0901234567',
      address: '123 Road',
      status: SupplierStatus.ACTIVE,
    });

    mockRepository.create.mockResolvedValue(createdSupplier);

    const result = await useCase.execute(command, currentUserId);

    expect(mockRepository.create).toHaveBeenCalledWith({
      supplierCode: 'SUP-001',
      name: 'Supplier ABC',
      email: 'supplier@example.com',
      phone: '0901234567',
      address: '123 Road',
      supplierGroupId: undefined,
      createdById: currentUserId,
    });
    expect(result).toEqual(createdSupplier);
  });

  it('should throw ConflictException on unique constraint error', async () => {
    mockRepository.create.mockRejectedValue(
      new QueryFailedError('INSERT INTO suppliers failed', [], {
        code: '23505',
        detail: 'Key (email)=(supplier@example.com) already exists.',
      } as any),
    );

    await expect(useCase.execute(command, currentUserId)).rejects.toThrow(
      ConflictException,
    );
  });
});
