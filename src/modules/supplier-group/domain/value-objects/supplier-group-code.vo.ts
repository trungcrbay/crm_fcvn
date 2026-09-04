export class SupplierGroupCode {
  private constructor(private readonly value: string) {}

  static create(code: string): SupplierGroupCode {
    const trimmed = code.trim();
    if (!trimmed || trimmed.length < 1 || trimmed.length > 50) {
      throw new Error('Mã nhóm nhà cung cấp phải từ 1-50 ký tự');
    }
    return new SupplierGroupCode(trimmed);
  }

  toString(): string {
    return this.value;
  }
}
