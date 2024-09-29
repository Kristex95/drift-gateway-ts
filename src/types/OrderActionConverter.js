"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderActionString = orderActionString;
var sdk_1 = require("@drift-labs/sdk");
function orderActionString(orderAction) {
    if (JSON.stringify(orderAction) === JSON.stringify(sdk_1.OrderAction.PLACE))
        return 'place';
    if (JSON.stringify(orderAction) === JSON.stringify(sdk_1.OrderAction.CANCEL))
        return 'cancel';
    if (JSON.stringify(orderAction) === JSON.stringify(sdk_1.OrderAction.FILL))
        return 'fill';
    throw new Error('Unknown order action');
}
