"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketTypeToString = marketTypeToString;
var sdk_1 = require("@drift-labs/sdk");
function marketTypeToString(marketType) {
    if (JSON.stringify(marketType) === JSON.stringify(sdk_1.MarketType.PERP))
        return 'perp';
    if (JSON.stringify(marketType) === JSON.stringify(sdk_1.MarketType.SPOT))
        return 'spot';
    throw new Error('Unknown market type');
}
