export class PhoneNumber {
  private constructor(private readonly value: string) {}

  static create(raw: string): PhoneNumber {
    const normalized = raw.trim();
    const PHONE_REGEX = /^(0|\+84|84)[0-9]{9,10}$/;

    if (!PHONE_REGEX.test(normalized)) {
      throw new Error(`Số điện thoại không hợp lệ: ${raw}`);
    }
    return new PhoneNumber(normalized);
  }

  toString(): string {
    return this.value;
  }
}
