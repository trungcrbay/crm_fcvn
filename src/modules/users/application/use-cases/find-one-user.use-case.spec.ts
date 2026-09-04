import { NotFoundException } from '@nestjs/common';
import { FindOneUserUseCase } from './find-one-user.use-case';
import { IUsersRepository } from '../../domain';

describe('FindOneUserUseCase', () => {
  const buildUsersRepository = (): jest.Mocked<IUsersRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findUniqueIncludeRolePermissions: jest.fn(),
  });

  it('should return user when found', async () => {
    const repository = buildUsersRepository();
    const userMock = { id: 1, name: 'John Doe' } as any;
    repository.findOne.mockResolvedValue(userMock);

    const useCase = new FindOneUserUseCase(repository);
    const result = await useCase.execute(1);

    expect(result).toEqual(userMock);
    expect(repository.findOne).toHaveBeenCalledWith(1);
  });

  it('should throw NotFoundException when user not found', async () => {
    const repository = buildUsersRepository();
    repository.findOne.mockResolvedValue(null);

    const useCase = new FindOneUserUseCase(repository);

    await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
  });
});
