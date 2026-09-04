// Re-export UsersTypeormRepository as UsersRepository để ProfileModule/AuthModule không bị lỗi
export {
  UsersTypeormRepository as UsersRepository,
  UsersTypeormRepository,
} from './infrastructure/persistence/users.typeorm-repository';
