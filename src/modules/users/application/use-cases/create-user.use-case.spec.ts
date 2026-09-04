import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CreateUserUseCase } from './create-user.use-case';
import { IUsersRepository } from '../../domain';
import { UserStatus } from 'src/shared/constant/user.constant';

describe('CreateUserUseCase', () => {
  const currentUserId = 99;

  const buildUsersRepository = (): jest.Mocked<IUsersRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findUniqueIncludeRolePermissions: jest.fn(),
  });

  const buildHashingService = () => ({
    hash: jest.fn(),
    compare: jest.fn(),
  });

  const duplicateError = () =>
    new QueryFailedError('INSERT INTO users failed', [], {
      code: '23505',
      detail: 'Key (email)=(john@example.com) already exists.',
    } as Error & {
      code: string;
      detail: string;
    });

  it('should hash password and create user successfully', async () => {
    const repository = buildUsersRepository();
    const hashingService = buildHashingService();
    hashingService.hash.mockResolvedValue('hashed_password_123');

    const createdMock = {
      id: 1,
      userCode: 'FCVN_0000001',
      name: 'John Doe',
      email: 'john@example.com',
      status: UserStatus.ACTIVE,
    } as any;

    repository.create.mockResolvedValue(createdMock);

    const useCase = new CreateUserUseCase(repository, hashingService);

    const result = await useCase.execute(
      {
        userCode: 'FCVN_0000001',
        name: 'John Doe',
        password: 'PlainPassword123!',
        email: 'john@example.com',
        status: UserStatus.ACTIVE,
        roleId: 2,
      },
      currentUserId,
    );

    expect(hashingService.hash).toHaveBeenCalledWith('PlainPassword123!');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'hashed_password_123',
        createdById: currentUserId,
      }),
    );
    expect(result).toEqual(createdMock);
  });

  it('should throw ConflictException on duplicate key', async () => {
    const repository = buildUsersRepository();
    const hashingService = buildHashingService();
    hashingService.hash.mockResolvedValue('hashed_password_123');
    repository.create.mockRejectedValue(duplicateError());

    const useCase = new CreateUserUseCase(repository, hashingService);

    await expect(
      useCase.execute(
        {
          userCode: 'FCVN_0000001',
          name: 'John Doe',
          password: 'PlainPassword123!',
          email: 'john@example.com',
        },
        currentUserId,
      ),
    ).rejects.toThrow(ConflictException);
  });
});
