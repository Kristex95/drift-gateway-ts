import { OrderType } from "@drift-labs/sdk";

export function orderTypeToString(orderType: OrderType): string {
  if (JSON.stringify(orderType) === JSON.stringify(OrderType.MARKET)) return 'market';
  else return 'limit';
}
