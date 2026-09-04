// Re-export UserOrmEntity để tương thích với ProfileModule, AuthModule, BaseEntity và seed scripts
export {
  UserOrmEntity as User,
  UserOrmEntity,
} from './infrastructure/persistence/user.orm-entity';
