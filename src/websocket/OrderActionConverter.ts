import {OrderRecord, BASE_PRECISION, PRICE_PRECISION } from "@drift-labs/sdk";
import { orderTypeToString } from "../types/OrderTypeConverter";
import { marketTypeToString } from "../types/MarketTypeConverter";
import { positionDirectionToString } from "../types/DirectionTypeConverter";
import { ExtendedOrderRecord } from "../types/CustomTypes";

export class OrderActionConverter{
  static OrderCreateAction(orderRecord:ExtendedOrderRecord) {
    const order = orderRecord.order;
    const orderCreate = {
      order: {
        slot: order.price.toString(),
        price: order.price.div(PRICE_PRECISION).toString(),
        amount: (order.baseAssetAmount.toNumber() / BASE_PRECISION.toNumber()).toPrecision(6).toString(),
        filled: order.baseAssetAmountFilled.toString(),
        triggerPrice: order.triggerPrice.toString(),
        auctionStartPrice: order.auctionStartPrice.toString(),
        auctionEndPrice: order.auctionEndPrice.toString(),
        maxTs: order.maxTs.toNumber(),
        oraclePriceOffset: order.oraclePriceOffset,
        orderId: order.orderId,
        marketIndex: order.marketIndex,
        orderType: orderTypeToString(order.orderType),
        marketType: marketTypeToString(order.marketType),
        userOrderId: order.userOrderId,
        direction: positionDirectionToString(order.direction),
        reduceOnly: order.reduceOnly,
        postOnly: order.postOnly,
        auctionDuration: order.auctionDuration
      },
      ts: orderRecord.ts.toNumber(),
      signature: orderRecord.txSig
    }
    return {
      orderCreate: orderCreate
    };
  }
}