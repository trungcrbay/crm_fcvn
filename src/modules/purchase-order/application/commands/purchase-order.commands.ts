export interface CreatePurchaseOrderItemCommand {
  itemName: string;
  quantity: number;
  price: number;
}

export interface CreatePurchaseOrderCommand {
  supplierId: number;
  items: CreatePurchaseOrderItemCommand[];
}
