import { DriftClient, PositionDirection, PostOnlyParams, OrderType, MarketType } from "@drift-labs/sdk";

const {
  initialize,
  OrderTriggerCondition,
  BN,
  PRICE_PRECISION,
  BASE_PRECISION,
  QUOTE_PRECISION
} = require("@drift-labs/sdk");

export class OrderCreator{

  private currentPriorityFee: number;
  private priorityFeeUpdateInterval: number;

  constructor() {
    this.currentPriorityFee = 50_000; // Default priority fee
    this.priorityFeeUpdateInterval = 120000; // Update every 2 minutes
  }

  static async placeMarketOrder(driftClient: DriftClient, marketIndex: number, direction: PositionDirection, size: number) {
    const orderParams = {
      orderType: OrderType.MARKET,
      marketIndex,
      marketType: MarketType.PERP,
      direction: direction === "long" ? PositionDirection.LONG : PositionDirection.SHORT,
      baseAssetAmount: new BN(size * BASE_PRECISION),
    };
  
    try {
      const tx = await driftClient.placePerpOrder(orderParams);
      console.log(`Market order placed. Transaction: ${tx}`);
      return tx;
    } catch (error) {
      console.error(`Error placing market order: ${error}`);
    }
  }
  
  static async placeLimitOrder(driftClient: DriftClient, marketIndex: number, direction: PositionDirection, size: number, price: number) {
    const orderParams = {
      orderType: OrderType.LIMIT,
      marketIndex,
      marketType: MarketType.PERP,
      direction: direction,
      baseAssetAmount: new BN(size * BASE_PRECISION),
      price: new BN(price * PRICE_PRECISION),
      postOnly: PostOnlyParams.NONE,
    };
    try {
      const tx = await driftClient.placePerpOrder(orderParams);
      console.log(`Limit order placed. Transaction: ${tx}`);
      return tx;
    } catch (error) {
      console.error(`Error placing limit order: ${error}`);
    }
  }
}