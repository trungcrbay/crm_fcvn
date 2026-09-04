// Re-export DepartmentsTypeormRepository as DepartmentsRepository để tương thích ngược
export {
  DepartmentsTypeormRepository as DepartmentsRepository,
  DepartmentsTypeormRepository,
} from './infrastructure/persistence/departments.typeorm-repository';
