import { BASE_PRECISION, FUNDING_RATE_BUFFER_PRECISION, MarketType, OrderAction, PositionDirection, PRICE_PRECISION } from "@drift-labs/sdk";
import { ExtendedOrderActionRecord } from "../types/CustomTypes";
import { orderActionString } from "../types/OrderActionConverter";
import { positionDirectionToString } from "../types/DirectionTypeConverter";
import { marketTypeToString } from "../types/MarketTypeConverter";

export function processUpdateOrder(orderAction: ExtendedOrderActionRecord) {
  switch(orderActionString(orderAction.action)) {
    case "place": {
      return null;
    }
    case "cancel": {
      return {
        orderCancel: {
          orderId: orderAction.takerOrderId,
          ts: orderAction.ts.toNumber(),
          signature: orderAction.txSig,
          txIdx: null //todo
        }
      };
    }
    case 'fill': {
      return {
        fill: {
          side: orderAction.takerOrderDirection ? positionDirectionToString(orderAction.takerOrderDirection) : null,
          fee: orderAction.makerFee?.toNumber().toString(),
          amount: orderAction.baseAssetAmountFilled?(orderAction.baseAssetAmountFilled.toNumber() / BASE_PRECISION.toNumber()).toString() : 0,
          price: 0, //todo
          oraclePrice: (orderAction.oraclePrice.toNumber() / PRICE_PRECISION.toNumber()).toString(),
          orderId: orderAction.makerOrderId,
          marketIndex: orderAction.marketIndex,
          marketType: marketTypeToString(orderAction.marketType),
          ts: orderAction.ts.toNumber(),
          txIdx: orderAction.txSigIndex, 
          signature: orderAction.txSig,
          maker: orderAction.maker?.toString(),
          makerOrderId: orderAction.makerOrderId,
          makerFee: orderAction.makerFee?(orderAction.makerFee.toNumber()/FUNDING_RATE_BUFFER_PRECISION.toNumber()).toString() : 0,
          taker: orderAction.taker?.toString(),
          takerOrderId: orderAction.takerOrderId,
          takerFee: orderAction.takerFee?(orderAction.takerFee.toNumber()/FUNDING_RATE_BUFFER_PRECISION.toNumber()).toString() : 0,
        }
      };
    }
  }
}