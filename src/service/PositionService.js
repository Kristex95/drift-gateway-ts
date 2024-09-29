"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPositions = getAllPositions;
var sdk_1 = require("@drift-labs/sdk");
function getAllPositions(user) {
    var perpPositions = user.getActivePerpPositions();
    var spotPositions = user.getActiveSpotPositions();
    var perpResult = perpPositions.map(function (element) {
        return {
            amount: (element.baseAssetAmount.toNumber() / sdk_1.BASE_PRECISION.toNumber()).toString(),
            type: "deposit",
            marketIndex: element.marketIndex
        };
    });
    var spotResult = spotPositions.map(function (element) {
        return {
            amount: (element.cumulativeDeposits.toNumber() / sdk_1.BASE_PRECISION.toNumber()).toString(),
            type: "deposit",
            marketIndex: element.marketIndex
        };
    });
    return {
        spot: spotResult,
        perp: perpResult
    };
}
