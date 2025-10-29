import { Decimal } from "@prisma/client/runtime/library";
import { CreateOrderInput } from "../schemas/orders";

export interface OrderData {
  total: Decimal;
  addressInfo: CreateOrderInput;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
  price: Decimal;
}

export type OrderItemData = { orderId: string } & OrderItemInput;
