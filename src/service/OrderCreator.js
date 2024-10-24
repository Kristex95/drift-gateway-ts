"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderCreator = void 0;
var sdk_1 = require("@drift-labs/sdk");
var web3_js_1 = require("@solana/web3.js");
var _a = require("@drift-labs/sdk"), initialize = _a.initialize, OrderTriggerCondition = _a.OrderTriggerCondition, BN = _a.BN, PRICE_PRECISION = _a.PRICE_PRECISION, BASE_PRECISION = _a.BASE_PRECISION, QUOTE_PRECISION = _a.QUOTE_PRECISION;
var OrderCreator = /** @class */ (function () {
    function OrderCreator() {
        this.currentPriorityFee = 50000; // Default priority fee
        this.priorityFeeUpdateInterval = 120000; // Update every 2 minutes
    }
    OrderCreator.placeMarketOrder = function (driftClient, marketIndex, direction, size) {
        return __awaiter(this, void 0, void 0, function () {
            var orderParams, logTime, tx, logTime, error_1, logTime_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orderParams = {
                            orderType: sdk_1.OrderType.MARKET,
                            marketIndex: marketIndex,
                            marketType: sdk_1.MarketType.PERP,
                            direction: direction === "long" ? sdk_1.PositionDirection.LONG : sdk_1.PositionDirection.SHORT,
                            baseAssetAmount: new BN(size * BASE_PRECISION),
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        logTime = new Date().toISOString();
                        console.log("[".concat(logTime, "] Placing market order: "), __assign(__assign({}, orderParams), { baseAssetAmount: orderParams.baseAssetAmount.toString() / BASE_PRECISION.toNumber() }));
                        return [4 /*yield*/, driftClient.placePerpOrder(orderParams)];
                    case 2:
                        tx = _a.sent();
                        logTime = new Date().toISOString();
                        console.log("[".concat(logTime, "] Market order placed. Transaction: ").concat(tx));
                        return [2 /*return*/, tx];
                    case 3:
                        error_1 = _a.sent();
                        logTime_1 = new Date().toISOString();
                        console.error("[".concat(logTime_1, "] Error placing market order: ").concat(error_1));
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OrderCreator.placeLimitOrder = function (driftClient, marketIndex, direction, size, price) {
        return __awaiter(this, void 0, void 0, function () {
            var orderParams, logTime, precision, tx, error_2, logTime_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orderParams = {
                            orderType: sdk_1.OrderType.LIMIT,
                            marketIndex: marketIndex,
                            marketType: sdk_1.MarketType.PERP,
                            direction: direction === "long" ? sdk_1.PositionDirection.LONG : sdk_1.PositionDirection.SHORT,
                            baseAssetAmount: new BN(size * BASE_PRECISION),
                            price: new BN(price * PRICE_PRECISION),
                            postOnly: sdk_1.PostOnlyParams.NONE,
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        logTime = new Date().toISOString();
                        precision = QUOTE_PRECISION.toNumber();
                        console.log("[".concat(logTime, "] Placing limit order:"), __assign(__assign({}, orderParams), { baseAssetAmount: orderParams.baseAssetAmount.toString() / BASE_PRECISION.toNumber(), price: orderParams.price.toString() / precision }));
                        return [4 /*yield*/, driftClient.placePerpOrder(orderParams).then()];
                    case 2:
                        tx = _a.sent();
                        logTime = new Date().toISOString();
                        console.log("[".concat(logTime, "] Limit order placed. Transaction: ").concat(tx));
                        return [2 /*return*/, tx];
                    case 3:
                        error_2 = _a.sent();
                        logTime_2 = new Date().toISOString();
                        if (!(error_2 instanceof web3_js_1.SendTransactionError)) {
                            console.error("[".concat(logTime_2, "] Error placing limit order:"), error_2);
                            throw error_2;
                        }
                        else {
                            console.error("[".concat(logTime_2, "] Error placing limit order:"), error_2);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return OrderCreator;
}());
exports.OrderCreator = OrderCreator;
