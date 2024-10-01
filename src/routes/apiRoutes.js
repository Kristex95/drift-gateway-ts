"use strict";
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
exports.router = void 0;
var sdk_1 = require("@drift-labs/sdk");
var express_1 = require("express");
var OrderCreator_1 = require("../service/OrderCreator");
var PositionService_1 = require("../service/PositionService");
var router = (0, express_1.Router)();
exports.router = router;
// GET request that doesn't require any parameters
router.get('/data', function (req, res) {
    var driftClient = req.app.locals.driftClient;
    if (driftClient) {
        res.status(200).json({
            subscribed: driftClient._isSubscribed,
            message: driftClient._isSubscribed ? "Client is subscribed" : "Client is not subscribed",
        });
    }
    else {
        res.status(500).json({ error: 'DriftClient not found' });
    }
});
//places orders
router.post('/orders', function (req, res) {
    var driftClient = req.app.locals.driftClient;
    var orders = req.body.orders;
    orders.forEach(function (order) {
        var marketIndex = order.marketIndex, amount = order.amount, price = order.price, orderType = order.orderType;
        var direction = amount > 0 ? sdk_1.PositionDirection.LONG : sdk_1.PositionDirection.SHORT;
        if (orderType === "limit") {
            var tx = OrderCreator_1.OrderCreator.placeLimitOrder(driftClient, marketIndex, direction, amount, price);
            tx.then(function (result) {
                res.status(200).json({ tx: result });
                return;
            });
        }
        else if (orderType === "market") {
            var tx = OrderCreator_1.OrderCreator.placeMarketOrder(driftClient, marketIndex, direction, amount);
            tx.then(function (result) {
                res.status(200).json({ tx: result });
                return;
            });
        }
    });
});
//returns all clients positions 
router.get("/positions", function (req, res) {
    var user = req.app.locals.user;
    var positions = (0, PositionService_1.getAllPositions)(user);
    res.status(200).json(positions);
});
//returns balance value in USD
router.get("/balance", function (req, res) {
    var user = req.app.locals.user;
    console.log(user.getNetSpotMarketValue().toNumber() / sdk_1.QUOTE_PRECISION.toNumber());
    res.status(200).json({
        balance: ((user.getNetUsdValue().toNumber() - user.getUnrealizedPNL().toNumber()) / sdk_1.QUOTE_PRECISION.toNumber()).toString()
    });
});
//returns extended info by market index
router.get("/positionInfo/:id", function (req, res) {
    var user = req.app.locals.user;
    var positionId = Number(req.params.id);
    var position = user.getPerpPosition(positionId);
    if (position === undefined) {
        return res.status(200).json({});
    }
    if (!position) {
        return res.status(404).json({ error: "Position with ID ".concat(positionId, " not found") });
    }
    res.status(200).json({
        amount: (position.baseAssetAmount.toNumber() / sdk_1.BASE_PRECISION.toNumber()).toString(),
        averageEntry: position.quoteEntryAmount.toNumber().toString(),
        marketIndex: position.marketIndex,
        liquidationPrice: null, //todo
        unrealizedPnl: null, //todo
        unsettledPnl: position.settledPnl.toNumber(), //todo unsettled
        oraclePrice: null //todo
    });
});
//returns all coins indexes and order requirements
router.get('/markets', function (req, res) {
    var driftClient = req.app.locals.driftClient;
    if (!driftClient) {
        return res.status(500).json({ error: 'DriftClient not found' });
    }
    try {
        var perpMarkets = driftClient.getPerpMarketAccounts();
        var spotMarkets = driftClient.getSpotMarketAccounts();
        var perpResult = perpMarkets.map(function (element) { return ({
            marketIndex: element.marketIndex,
            symbol: String.fromCharCode.apply(String, element.name).trim(),
            priceStep: (element.amm.orderTickSize.toNumber() / sdk_1.QUOTE_PRECISION.toNumber()).toString(),
            amountStep: (element.amm.orderStepSize.toNumber() / sdk_1.AMM_RESERVE_PRECISION.toNumber()).toString(),
            minOrderSize: (element.amm.minOrderSize.toNumber() / sdk_1.BASE_PRECISION.toNumber()).toString(),
            initialMarginRatio: (element.marginRatioInitial / sdk_1.FUNDING_RATE_BUFFER_PRECISION.toNumber()).toString(),
            maintenanceMarginRatio: (element.marginRatioMaintenance / sdk_1.FUNDING_RATE_BUFFER_PRECISION.toNumber()).toString()
        }); });
        var spotResult = spotMarkets.map(function (element) { return ({
            marketIndex: element.marketIndex.toString(),
            symbol: String.fromCharCode.apply(String, element.name).trim(),
            priceStep: (element.orderTickSize.toNumber() / sdk_1.QUOTE_PRECISION.toNumber()).toString(),
            amountStep: null,
            minOrderSize: (element.minOrderSize.toNumber() / sdk_1.BASE_PRECISION.toNumber()).toString(),
            initialMarginRatio: null,
            maintenanceMarginRatio: null
        }); });
        res.status(200).json({
            spot: spotResult,
            perp: perpResult
        });
    }
    catch (err) {
        res.status(500).json({ error: err });
    }
});
//cancels orders
router.delete('/orders', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var driftClient, ids, result, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                driftClient = req.app.locals.driftClient;
                ids = req.body.ids;
                if (!Array.isArray(ids)) {
                    return [2 /*return*/, res.status(400).json({ error: 'Invalid data: IDs should be an array' })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, driftClient.cancelOrdersByIds(ids)];
            case 2:
                result = _a.sent();
                res.status(200).json({ message: 'Orders cancelled successfully', tx: result });
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                res.status(500).json({ error: err_1 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
