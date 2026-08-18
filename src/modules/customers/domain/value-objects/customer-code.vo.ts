export class CustomerCode {
  private constructor(private readonly value: string) {}

  static create(raw: string): CustomerCode {
    const normalized = raw.trim();

    if (normalized.length < 1 || normalized.length > 50) {
      throw new Error('Mã khách hàng phải từ 1-50 ký tự');
    }
    return new CustomerCode(normalized);
  }

  toString(): string {
    return this.value;
  }
}
