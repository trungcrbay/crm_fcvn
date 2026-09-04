// Re-export UserOrmEntity as User để tương thích ngược với ProfileModule, AuthModule, BaseEntity, RefreshToken, seeds,...
export {
  UserOrmEntity as User,
  UserOrmEntity,
} from './infrastructure/persistence/user.orm-entity';
