import { NotFoundException } from '@nestjs/common';
import { RemoveUserUseCase } from './remove-user.use-case';
import { IUsersRepository } from '../../domain';

describe('RemoveUserUseCase', () => {
  const currentUserId = 99;

  const buildUsersRepository = (): jest.Mocked<IUsersRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findUniqueIncludeRolePermissions: jest.fn(),
  });

  it('should remove user when found and return message', async () => {
    const repository = buildUsersRepository();
    repository.findOne.mockResolvedValue({ id: 1 } as any);
    repository.remove.mockResolvedValue(undefined);

    const useCase = new RemoveUserUseCase(repository);
    const result = await useCase.execute(1, currentUserId);

    expect(result).toEqual({ message: 'Xóa người dùng thành công' });
    expect(repository.remove).toHaveBeenCalledWith(1, currentUserId);
  });

  it('should throw NotFoundException when user not found', async () => {
    const repository = buildUsersRepository();
    repository.findOne.mockResolvedValue(null);

    const useCase = new RemoveUserUseCase(repository);

    await expect(useCase.execute(999, currentUserId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
