// Re-export UsersTypeormRepository as UsersRepository để ProfileModule không bị lỗi
export {
  UsersTypeormRepository as UsersRepository,
  UsersTypeormRepository,
} from './infrastructure/persistence/users.typeorm-repository';
