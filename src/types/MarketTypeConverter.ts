import { MarketType } from "@drift-labs/sdk";

export function marketTypeToString(marketType: MarketType): string {
  if (JSON.stringify(marketType) === JSON.stringify(MarketType.PERP)) return 'perp';
  if (JSON.stringify(marketType) === JSON.stringify(MarketType.SPOT)) return 'spot';  
  throw new Error('Unknown market type');
}
