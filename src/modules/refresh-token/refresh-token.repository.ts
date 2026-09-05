// Re-export RefreshTokenTypeormRepository as RefreshTokenRepository để tương thích ngược
export {
  RefreshTokenTypeormRepository as RefreshTokenRepository,
  RefreshTokenTypeormRepository,
} from './infrastructure/persistence/refresh-token.typeorm-repository';
