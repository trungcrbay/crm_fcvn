// Re-export AuthTypeormRepository as AuthRepository để tương thích ngược
export {
  AuthTypeormRepository as AuthRepository,
  AuthTypeormRepository,
} from './infrastructure/persistence/auth.typeorm-repository';
