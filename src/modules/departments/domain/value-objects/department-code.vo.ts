export class DepartmentCode {
  private constructor(private readonly value: string) {}

  static create(raw: string): DepartmentCode {
    const normalized = raw.trim();

    if (normalized.length < 1 || normalized.length > 50) {
      throw new Error(`Mã phòng ban phải từ 1-50 ký tự: ${raw}`);
    }

    return new DepartmentCode(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: DepartmentCode): boolean {
    return this.value === other.value;
  }
}
