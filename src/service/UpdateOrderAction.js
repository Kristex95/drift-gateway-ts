"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUpdateOrder = processUpdateOrder;
var sdk_1 = require("@drift-labs/sdk");
var OrderActionConverter_1 = require("../types/OrderActionConverter");
var DirectionTypeConverter_1 = require("../types/DirectionTypeConverter");
var MarketTypeConverter_1 = require("../types/MarketTypeConverter");
function processUpdateOrder(orderAction) {
    var _a, _b, _c;
    switch ((0, OrderActionConverter_1.orderActionString)(orderAction.action)) {
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
                    side: orderAction.takerOrderDirection ? (0, DirectionTypeConverter_1.positionDirectionToString)(orderAction.takerOrderDirection) : null,
                    fee: (_a = orderAction.makerFee) === null || _a === void 0 ? void 0 : _a.toNumber().toString(),
                    amount: orderAction.baseAssetAmountFilled ? (orderAction.baseAssetAmountFilled.toNumber() / sdk_1.BASE_PRECISION.toNumber()).toString() : 0,
                    price: 0, //todo
                    oraclePrice: (orderAction.oraclePrice.toNumber() / sdk_1.PRICE_PRECISION.toNumber()).toString(),
                    orderId: orderAction.makerOrderId,
                    marketIndex: orderAction.marketIndex,
                    marketType: (0, MarketTypeConverter_1.marketTypeToString)(orderAction.marketType),
                    ts: orderAction.ts.toNumber(),
                    txIdx: orderAction.txSigIndex,
                    signature: orderAction.txSig,
                    maker: (_b = orderAction.maker) === null || _b === void 0 ? void 0 : _b.toString(),
                    makerOrderId: orderAction.makerOrderId,
                    makerFee: orderAction.makerFee ? (orderAction.makerFee.toNumber() / sdk_1.FUNDING_RATE_BUFFER_PRECISION.toNumber()).toString() : 0,
                    taker: (_c = orderAction.taker) === null || _c === void 0 ? void 0 : _c.toString(),
                    takerOrderId: orderAction.takerOrderId,
                    takerFee: orderAction.takerFee ? (orderAction.takerFee.toNumber() / sdk_1.FUNDING_RATE_BUFFER_PRECISION.toNumber()).toString() : 0,
                }
            };
        }
    }
}
