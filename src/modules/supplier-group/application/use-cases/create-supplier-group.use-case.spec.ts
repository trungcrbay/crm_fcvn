import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import { SupplierGroupEntity } from '../../domain';
import { CreateSupplierGroupUseCase } from './create-supplier-group.use-case';

describe('CreateSupplierGroupUseCase', () => {
  const currentUserId = 10;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    remove: jest.fn(),
  };

  let useCase: CreateSupplierGroupUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateSupplierGroupUseCase(mockRepository);
  });

  const command = {
    code: '  GRP-001  ',
    name: '  Electronics  ',
    description: '  Electronics suppliers  ',
    status: SupplierGroupStatus.ACTIVE,
  };

  it('should create a supplier group with trimmed values', async () => {
    const createdGroup = SupplierGroupEntity.create({
      id: 1,
      code: 'GRP-001',
      name: 'Electronics',
      description: 'Electronics suppliers',
      status: SupplierGroupStatus.ACTIVE,
    });

    mockRepository.create.mockResolvedValue(createdGroup);

    const result = await useCase.execute(command, currentUserId);

    expect(mockRepository.create).toHaveBeenCalledWith({
      code: 'GRP-001',
      name: 'Electronics',
      description: 'Electronics suppliers',
      status: SupplierGroupStatus.ACTIVE,
      createdById: currentUserId,
    });
    expect(result).toEqual(createdGroup);
  });

  it('should throw ConflictException on duplicate code or name', async () => {
    mockRepository.create.mockRejectedValue(
      new QueryFailedError('INSERT INTO supplier_groups failed', [], {
        code: '23505',
        detail: 'Key (code)=(GRP-01) already exists.',
      } as any),
    );

    await expect(useCase.execute(command, currentUserId)).rejects.toThrow(
      ConflictException,
    );
  });
});
