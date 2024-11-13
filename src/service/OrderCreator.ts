import { DriftClient, PositionDirection, PostOnlyParams, OrderType, MarketType } from "@drift-labs/sdk";

import { SendTransactionError } from "@solana/web3.js";

const {
  initialize,
  OrderTriggerCondition,
  BN,
  PRICE_PRECISION,
  BASE_PRECISION,
  QUOTE_PRECISION
} = require("@drift-labs/sdk");

const TRANSACTION_ALREADY_PROCESSED_MESSAGE = "Transaction simulation failed: This transaction has already been processed.";

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
      direction: direction,
      baseAssetAmount: new BN(size * BASE_PRECISION),
    };
  
    try {
      var logTime = new Date().toISOString();
      console.log(
        `[${logTime}] Placing market order: ${JSON.stringify({
          ...orderParams,
          baseAssetAmount: size
        })}`
      );
      const tx = await driftClient.placePerpOrder(orderParams);
      var logTime = new Date().toISOString();
      console.log(`[${logTime}] Market order placed. Transaction: ${tx}`);
      return tx;
    } catch (error) {
      const logTime = new Date().toISOString();
      console.error(`[${logTime}] Error placing market order: ${error}`);
      if (error instanceof SendTransactionError) {
        throw new Error(`Transaction simulation failed: ${error.transactionError.message}`);
      } else {
        throw error;
      }
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
      var logTime = new Date().toISOString();
      const precision = QUOTE_PRECISION.toNumber();
      console.log(`[${logTime}] Placing limit order: ${JSON.stringify({
        ...orderParams,
        baseAssetAmount: size,
        price: orderParams.price.toString() / precision,
        })}`
      );
      const tx = await driftClient.placePerpOrder(orderParams).then();
      logTime = new Date().toISOString();
      console.log(`[${logTime}] Limit order placed. Transaction: ${tx}`);
      return tx;
    } catch (error) {
      const logTime = new Date().toISOString();
      console.error(`[${logTime}] Error placing limit order:`, error);
      if (error instanceof SendTransactionError) {
        throw new Error(`Transaction simulation failed: ${error.transactionError.message}`);
      } else {
        throw error;
      }
    }
  }
}