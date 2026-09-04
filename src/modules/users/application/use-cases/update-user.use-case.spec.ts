import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { UpdateUserUseCase } from './update-user.use-case';
import { IUsersRepository } from '../../domain';
import { UserStatus } from 'src/shared/constant/user.constant';

describe('UpdateUserUseCase', () => {
  const currentUserId = 99;

  const buildUsersRepository = (): jest.Mocked<IUsersRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findUniqueIncludeRolePermissions: jest.fn(),
  });

  const duplicateError = () =>
    new QueryFailedError('UPDATE users failed', [], {
      code: '23505',
      detail: 'Key (email)=(john@example.com) already exists.',
    } as Error & {
      code: string;
      detail: string;
    });

  it('should update user successfully', async () => {
    const repository = buildUsersRepository();
    const updatedMock = {
      id: 1,
      userCode: 'FCVN_0000001',
      name: 'John Updated',
      email: 'john@example.com',
      status: UserStatus.ACTIVE,
    } as any;

    repository.update.mockResolvedValue(updatedMock);

    const useCase = new UpdateUserUseCase(repository);

    const result = await useCase.execute(
      1,
      { name: 'John Updated' },
      currentUserId,
    );

    expect(repository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        name: 'John Updated',
        updatedById: currentUserId,
      }),
    );
    expect(result).toEqual(updatedMock);
  });

  it('should throw NotFoundException if user does not exist', async () => {
    const repository = buildUsersRepository();
    repository.update.mockResolvedValue(null);

    const useCase = new UpdateUserUseCase(repository);

    await expect(
      useCase.execute(999, { name: 'John' }, currentUserId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException on duplicate key', async () => {
    const repository = buildUsersRepository();
    repository.update.mockRejectedValue(duplicateError());

    const useCase = new UpdateUserUseCase(repository);

    await expect(
      useCase.execute(1, { email: 'john@example.com' }, currentUserId),
    ).rejects.toThrow(ConflictException);
  });
});
