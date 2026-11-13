import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCartCommand, AddItemCommand } from '../cart.commands';
import { CartRepository } from '../../repositories/cart.repository';
import { CartAggregate } from '../../aggregates/cart.aggregate';

@CommandHandler(CreateCartCommand)
export class CreateCartHandler implements ICommandHandler<CreateCartCommand> {
  constructor(private readonly repository: CartRepository) {}

  async execute(command: CreateCartCommand): Promise<string> {
    const cart = new CartAggregate();
    cart.create(command.userId);
    await this.repository.save(cart);
    return cart.getId();
  }
}

@CommandHandler(AddItemCommand)
export class AddItemHandler implements ICommandHandler<AddItemCommand> {
  constructor(private readonly repository: CartRepository) {}

  async execute(command: AddItemCommand): Promise<void> {
    const cart = await this.repository.getById(command.cartId);
    if (!cart) throw new Error('Cart not found');

    cart.addItem(
      command.productId,
      command.productName,
      command.quantity,
      command.price,
    );
    await this.repository.save(cart);
  }
}
