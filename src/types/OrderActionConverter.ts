import { OrderAction } from "@drift-labs/sdk";

export function orderActionString(orderAction: OrderAction): string {
  if (JSON.stringify(orderAction) === JSON.stringify(OrderAction.PLACE)) return 'place';
  if (JSON.stringify(orderAction) === JSON.stringify(OrderAction.CANCEL)) return 'cancel';
  if (JSON.stringify(orderAction) === JSON.stringify(OrderAction.FILL)) return 'fill';
  
  throw new Error('Unknown order action');
}
