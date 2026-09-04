export class SupplierCode {
  private constructor(private readonly value: string) {}

  static create(code: string): SupplierCode {
    const trimmed = code.trim();
    if (!trimmed || trimmed.length < 1 || trimmed.length > 50) {
      throw new Error('Mã nhà cung cấp phải từ 1-50 ký tự');
    }
    return new SupplierCode(trimmed);
  }

  toString(): string {
    return this.value;
  }
}
