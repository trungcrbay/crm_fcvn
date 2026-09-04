export class UserCode {
  private constructor(private readonly value: string) {}

  static create(raw: string): UserCode {
    const normalized = raw.trim();

    if (normalized.length < 1 || normalized.length > 50) {
      throw new Error(`Mã nhân viên phải từ 1-50 ký tự: ${raw}`);
    }

    return new UserCode(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: UserCode): boolean {
    return this.value === other.value;
  }
}
