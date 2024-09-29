"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderTypeToString = orderTypeToString;
var sdk_1 = require("@drift-labs/sdk");
function orderTypeToString(orderType) {
    if (JSON.stringify(orderType) === JSON.stringify(sdk_1.OrderType.MARKET))
        return 'market';
    else
        return 'limit';
}
