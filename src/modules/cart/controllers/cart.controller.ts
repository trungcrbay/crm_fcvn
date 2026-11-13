import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateCartCommand, AddItemCommand } from '../commands/cart.commands';
import { CartProjection } from '../projections/cart.projection';
import { Public } from 'src/shared/decorator/public.decorator';

@Controller('carts')
export class CartController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly cartProjection: CartProjection,
  ) {}

  @Public()
  @Post()
  async createCart(@Body('userId') userId: string) {
    const cartId = await this.commandBus.execute(new CreateCartCommand(userId));
    return { cartId };
  }

  @Public()
  @Post(':id/items')
  async addItem(@Param('id') cartId: string, @Body() body: any) {
    await this.commandBus.execute(
      new AddItemCommand(
        cartId,
        body.productId,
        body.productName,
        body.quantity,
        body.price,
      ),
    );
    // Rebuild read model so the GET below reflects the write. In production
    // this would be driven by an event subscriber, not done inline.
    await this.cartProjection.rebuildProjection();
    return { success: true };
  }

  @Public()
  @Get(':id')
  getCart(@Param('id') cartId: string) {
    return this.cartProjection.getCart(cartId);
  }
}
