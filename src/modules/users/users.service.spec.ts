import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Like } from 'typeorm';
import { UsersService } from './users.service';
import type { UsersRepository } from './users.repository';
import { UserStatus } from 'src/shared/constant/user.constant';
import { User } from './user.entity';

describe('UsersService', () => {
  const currentUserId = 99;

  const buildUsersRepository = () => ({
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

  let repository: ReturnType<typeof buildUsersRepository>;
  let hashingService: ReturnType<typeof buildHashingService>;
  let service: UsersService;

  beforeEach(() => {
    repository = buildUsersRepository();
    hashingService = buildHashingService();
    service = new UsersService(
      repository as unknown as UsersRepository,
      hashingService,
    );
  });

  describe('create', () => {
    const createUserDto = {
      userCode: 'FCVN_0000001',
      name: 'John Doe',
      password: 'PlainPassword123!',
      status: UserStatus.ACTIVE,
      email: 'john@example.com',
      phone: '0987654321',
      address: '123 Main St',
      roleId: 2,
    };

    it('should hash password and create user successfully without returning password', async () => {
      hashingService.hash.mockResolvedValue('hashed_password_123');
      repository.create.mockResolvedValue({
        id: 1,
        userCode: 'FCVN_0000001',
        name: 'John Doe',
        password: 'hashed_password_123',
        status: UserStatus.ACTIVE,
        email: 'john@example.com',
        phone: '0987654321',
        address: '123 Main St',
        roleId: 2,
        createdById: currentUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createUserDto, currentUserId);

      expect(hashingService.hash).toHaveBeenCalledWith('PlainPassword123!');
      expect(repository.create).toHaveBeenCalledWith({
        name: 'John Doe',
        userCode: 'FCVN_0000001',
        password: 'hashed_password_123',
        status: UserStatus.ACTIVE,
        email: 'john@example.com',
        phone: '0987654321',
        address: '123 Main St',
        createdById: currentUserId,
        roleId: 2,
      });
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(1);
      expect(result.email).toBe('john@example.com');
    });

    it('should create user without roleId when roleId is undefined', async () => {
      const dtoWithoutRole = {
        userCode: 'FCVN_0000002',
        name: 'Jane Doe',
        password: 'Password123!',
        status: UserStatus.ACTIVE,
        email: 'jane@example.com',
      };

      hashingService.hash.mockResolvedValue('hashed_password_456');
      repository.create.mockResolvedValue({
        id: 2,
        ...dtoWithoutRole,
        password: 'hashed_password_456',
        createdById: currentUserId,
      });

      await service.create(dtoWithoutRole, currentUserId);

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Jane Doe',
        userCode: 'FCVN_0000002',
        password: 'hashed_password_456',
        status: UserStatus.ACTIVE,
        email: 'jane@example.com',
        phone: undefined,
        address: undefined,
        createdById: currentUserId,
      });
    });

    it('should throw ConflictException when unique constraint violation occurs', async () => {
      hashingService.hash.mockResolvedValue('hashed_password');
      repository.create.mockRejectedValue(duplicateError());

      await expect(
        service.create(createUserDto, currentUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should rethrow non-unique database errors', async () => {
      hashingService.hash.mockResolvedValue('hashed_password');
      repository.create.mockRejectedValue(new Error('Connection lost'));

      await expect(
        service.create(createUserDto, currentUserId),
      ).rejects.toThrow('Connection lost');
    });
  });

  describe('findAll', () => {
    it('should call repository.findAll with default pagination and sorting', async () => {
      const mockResult = {
        data: [{ id: 1, name: 'User 1' } as unknown as User],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      repository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        sortOrder: 'ASC',
        where: {},
      });
      expect(result).toEqual(mockResult);
    });

    it('should build where condition properly with filters and Like queries', async () => {
      repository.findAll.mockResolvedValue([]);

      await service.findAll({
        page: 2,
        limit: 20,
        sortOrder: 'DESC',
        userCode: '  FCVN_01  ',
        name: '  John  ',
        email: '  JOHN@EXAMPLE.COM  ',
        roleId: 3,
        status: UserStatus.ACTIVE,
        search: 'global_search',
      });

      expect(repository.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: undefined, // search should be undefined when name is provided
        sortOrder: 'DESC',
        where: {
          userCode: Like('%FCVN_01%'),
          name: Like('%John%'),
          email: Like('%john@example.com%'),
          roleId: 3,
          status: UserStatus.ACTIVE,
        },
      });
    });

    it('should use search when name is not provided', async () => {
      repository.findAll.mockResolvedValue([]);

      await service.findAll({
        page: 1,
        limit: 10,
        sortOrder: 'ASC',
        search: 'my_search_term',
      });

      expect(repository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'my_search_term',
        sortOrder: 'ASC',
        where: {},
      });
    });
  });

  describe('findOne', () => {
    it('should return user when user is found', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      } as unknown as User;
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(mockUser);
    });

    it('should throw NotFoundException when user is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    it('should update user and return updated user with updatedById', async () => {
      const updateUserDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '0911222333',
        address: 'New Address',
        status: UserStatus.INACTIVE,
        roleId: 5,
      };

      const updatedUser = {
        id: 1,
        ...updateUserDto,
        updatedById: currentUserId,
      } as unknown as User;

      repository.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateUserDto, currentUserId);

      expect(repository.update).toHaveBeenCalledWith(1, {
        name: 'Updated Name',
        userCode: undefined,
        email: 'updated@example.com',
        phone: '0911222333',
        address: 'New Address',
        status: UserStatus.INACTIVE,
        updatedById: currentUserId,
        roleId: 5,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user to update is not found', async () => {
      repository.update.mockResolvedValue(null);

      await expect(
        service.update(999, { name: 'Not Exists' }, currentUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should find user first and call repository.remove', async () => {
      const mockUser = { id: 1, name: 'To be deleted' } as unknown as User;
      repository.findOne.mockResolvedValue(mockUser);
      repository.remove.mockResolvedValue(undefined);

      const result = await service.remove(1, currentUserId);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(1, currentUserId);
      expect(result).toEqual({
        message: 'Xóa người dùng thành công',
      });
    });

    it('should throw NotFoundException when user to remove does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, currentUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
