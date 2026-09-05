export interface CreatePurchaseRequestItemCommand {
  itemName: string;
  unit?: string | null;
  quantity: number;
  price: number;
  note?: string | null;
}

export interface CreatePurchaseRequestCommand {
  title: string;
  description?: string | null;
  departmentId?: number | null;
  items: CreatePurchaseRequestItemCommand[];
}

export interface UpdatePurchaseRequestCommand {
  title?: string;
  description?: string | null;
  departmentId?: number | null;
  items?: CreatePurchaseRequestItemCommand[];
}

export interface RejectPurchaseRequestCommand {
  reason: string;
}
