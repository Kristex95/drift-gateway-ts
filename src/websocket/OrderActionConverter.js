"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderActionConverter = void 0;
var sdk_1 = require("@drift-labs/sdk");
var OrderTypeConverter_1 = require("../types/OrderTypeConverter");
var MarketTypeConverter_1 = require("../types/MarketTypeConverter");
var DirectionTypeConverter_1 = require("../types/DirectionTypeConverter");
var OrderActionConverter = /** @class */ (function () {
    function OrderActionConverter() {
    }
    OrderActionConverter.OrderCreateAction = function (orderRecord) {
        var order = orderRecord.order;
        var orderCreate = {
            order: {
                slot: order.price.toString(),
                price: order.price.div(sdk_1.PRICE_PRECISION).toString(),
                amount: (order.baseAssetAmount.toNumber() / sdk_1.BASE_PRECISION.toNumber()).toPrecision(6).toString(),
                filled: order.baseAssetAmountFilled.toString(),
                triggerPrice: order.triggerPrice.toString(),
                auctionStartPrice: order.auctionStartPrice.toString(),
                auctionEndPrice: order.auctionEndPrice.toString(),
                maxTs: order.maxTs.toNumber(),
                oraclePriceOffset: order.oraclePriceOffset,
                orderId: order.orderId,
                marketIndex: order.marketIndex,
                orderType: (0, OrderTypeConverter_1.orderTypeToString)(order.orderType),
                marketType: (0, MarketTypeConverter_1.marketTypeToString)(order.marketType),
                userOrderId: order.userOrderId,
                direction: (0, DirectionTypeConverter_1.positionDirectionToString)(order.direction),
                reduceOnly: order.reduceOnly,
                postOnly: order.postOnly,
                auctionDuration: order.auctionDuration
            },
            ts: orderRecord.ts.toNumber(),
            signature: orderRecord.txSig
        };
        return {
            orderCreate: orderCreate
        };
    };
    return OrderActionConverter;
}());
exports.OrderActionConverter = OrderActionConverter;
