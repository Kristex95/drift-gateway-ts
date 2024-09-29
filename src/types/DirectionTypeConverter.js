"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.positionDirectionToString = positionDirectionToString;
var sdk_1 = require("@drift-labs/sdk");
function positionDirectionToString(positionDirection) {
    if (JSON.stringify(positionDirection) === JSON.stringify(sdk_1.PositionDirection.LONG))
        return 'buy';
    if (JSON.stringify(positionDirection) === JSON.stringify(sdk_1.PositionDirection.SHORT))
        return 'sell';
    throw new Error('Unknown position direction');
}
