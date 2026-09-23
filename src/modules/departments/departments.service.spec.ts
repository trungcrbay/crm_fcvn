import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { DepartmentStatus } from 'src/shared/constant/department.constant';
import { DepartmentsService } from './departments.service';
import { DepartmentsRepository } from './departments.repository';
import { Department } from './department.entity';

type MockRepository = jest.Mocked<
  Pick<
    DepartmentsRepository,
    'create' | 'findAll' | 'findOne' | 'update' | 'remove'
  >
>;

const buildRepository = (): MockRepository => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

const buildService = (repo: MockRepository): DepartmentsService =>
  new DepartmentsService(repo as unknown as DepartmentsRepository);

const makeDepartment = (overrides: Partial<Department>): Department =>
  ({
    id: 1,
    departmentCode: 'DEPT_DEFAULT',
    name: 'Default Department',
    status: DepartmentStatus.ACTIVE,
    ...overrides,
  }) as Department;

describe('DepartmentsService', () => {
  const userId = 1;

  const duplicateError = () =>
    new QueryFailedError('INSERT INTO departments failed', [], {
      code: '23505',
      detail: 'Key (departmentCode)=(DEPT_IT) already exists.',
    } as Error & {
      code: string;
      detail: string;
    });

  describe('create', () => {
    it('should create a department successfully', async () => {
      const repository = buildRepository();
      repository.create.mockResolvedValue(
        makeDepartment({
          id: 1,
          departmentCode: 'DEPT_IT',
          name: 'Phòng Công nghệ thông tin',
          description: 'Mô tả phòng IT',
          status: DepartmentStatus.ACTIVE,
          createdById: userId,
          createdAt: new Date('2026-08-23T00:00:00.000Z'),
          updatedAt: new Date('2026-08-23T00:00:00.000Z'),
        }),
      );

      const service = buildService(repository);

      const result = await service.create(
        {
          departmentCode: '  DEPT_IT  ',
          name: '  Phòng Công nghệ thông tin  ',
          description: '  Mô tả phòng IT  ',
          status: DepartmentStatus.ACTIVE,
        },
        userId,
      );

      expect(result.departmentCode).toBe('DEPT_IT');
      expect(result.name).toBe('Phòng Công nghệ thông tin');
      expect(repository.create).toHaveBeenCalledWith({
        departmentCode: 'DEPT_IT',
        name: 'Phòng Công nghệ thông tin',
        description: 'Mô tả phòng IT',
        status: DepartmentStatus.ACTIVE,
        createdById: userId,
      });
    });

    it('should throw ConflictException on duplicate departmentCode', async () => {
      const repository = buildRepository();
      repository.create.mockRejectedValue(duplicateError());

      const service = buildService(repository);

      await expect(
        service.create(
          {
            departmentCode: 'DEPT_IT',
            name: 'Phòng Công nghệ thông tin',
            status: DepartmentStatus.ACTIVE,
          },
          userId,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a department when found', async () => {
      const repository = buildRepository();
      const mockDept = makeDepartment({
        id: 1,
        departmentCode: 'DEPT_IT',
        name: 'Phòng IT',
        status: DepartmentStatus.ACTIVE,
      });
      repository.findOne.mockResolvedValue(mockDept);

      const service = buildService(repository);
      const result = await service.findOne(1);

      expect(result).toEqual(mockDept);
      expect(repository.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when not found', async () => {
      const repository = buildRepository();
      repository.findOne.mockResolvedValue(null);

      const service = buildService(repository);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should query departments with options', async () => {
      const repository = buildRepository();
      repository.findAll.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const service = buildService(repository);
      await service.findAll({ page: 1, limit: 10, sortOrder: 'ASC' });

      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update department successfully', async () => {
      const repository = buildRepository();
      repository.findOne.mockResolvedValue(
        makeDepartment({ id: 1, departmentCode: 'DEPT_IT', name: 'Phòng IT' }),
      );
      repository.update.mockResolvedValue(
        makeDepartment({
          id: 1,
          departmentCode: 'DEPT_IT',
          name: 'Phòng IT Mới',
        }),
      );

      const service = buildService(repository);
      const result = await service.update(
        1,
        { name: '  Phòng IT Mới  ' },
        userId,
      );

      expect(result.name).toBe('Phòng IT Mới');
      expect(repository.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete department', async () => {
      const repository = buildRepository();
      repository.findOne.mockResolvedValue(
        makeDepartment({ id: 1, departmentCode: 'DEPT_IT' }),
      );
      repository.remove.mockResolvedValue(undefined);

      const service = buildService(repository);
      const result = await service.remove(1, userId);

      expect(result).toEqual({ message: 'Xóa phòng ban thành công' });
      expect(repository.remove).toHaveBeenCalledWith(1, userId);
    });
  });
});
