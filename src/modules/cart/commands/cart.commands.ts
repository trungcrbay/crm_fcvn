export class CreateCartCommand {
  constructor(public readonly userId: string) {}
}
export class AddItemCommand {
  constructor(
    public readonly cartId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly quantity: number,
    public readonly price: number,
  ) {}
}
export class CheckoutCartCommand {
  constructor(public readonly cartId: string) {}
}
