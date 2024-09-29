import { PositionDirection } from "@drift-labs/sdk";

export function positionDirectionToString(positionDirection: PositionDirection): string {
  if (JSON.stringify(positionDirection) === JSON.stringify(PositionDirection.LONG)) return 'buy';
  if (JSON.stringify(positionDirection) === JSON.stringify(PositionDirection.SHORT)) return 'sell';  
  throw new Error('Unknown position direction');
}
