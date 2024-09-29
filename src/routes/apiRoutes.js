"use strict";
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
    res.json({ subscribed: driftClient._isSubscribed });
});
//places orders
router.post('/orders', function (req, res) {
    var driftClient = req.app.locals.driftClient;
    var orders = req.body.orders;
    console.log(orders);
    orders.forEach(function (order) {
        var marketIndex = order.marketIndex, amount = order.amount, price = order.price, orderType = order.orderType;
        var direction = amount > 0 ? sdk_1.PositionDirection.LONG : sdk_1.PositionDirection.SHORT;
        if (orderType === "limit") {
            var tx = OrderCreator_1.OrderCreator.placeLimitOrder(driftClient, marketIndex, direction, amount, price);
            tx.then(function (result) {
                res.status(200).json({ tx: result });
            });
        }
        else if (orderType === "market") {
            var tx = OrderCreator_1.OrderCreator.placeMarketOrder(driftClient, marketIndex, direction, amount);
            tx.then(function (result) {
                res.status(200).json({ tx: result });
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
    res.status(200).json({
        amount: (position.baseAssetAmount.toNumber() / sdk_1.BASE_PRECISION.toNumber()).toString(),
        averageEntry: position.quoteEntryAmount.toNumber().toString(),
        marketIndex: position.marketIndex,
        liquidationPrice: null, //todo
        unrealizedPnl: null, //todo
        unsettledPnl: position.settledPnl, //todo unsettled
        oraclePrice: null //todo
    });
});
//returns all coins indexes and order requirements
router.get('/markets', function (req, res) {
    var driftClient = req.app.locals.driftClient;
    var perpMarkets = driftClient.getPerpMarketAccounts();
    var spotMarkets = driftClient.getSpotMarketAccounts();
    var perpResult = perpMarkets.map(function (element) {
        return {
            marketIndex: element.marketIndex,
            symbol: String.fromCharCode.apply(String, element.name).trim(),
            priceStep: (element.amm.orderTickSize.toNumber() / sdk_1.QUOTE_PRECISION.toNumber()).toString(),
            amountStep: (element.amm.orderStepSize.toNumber() / sdk_1.AMM_RESERVE_PRECISION.toNumber()).toString(),
            minOrderSize: (element.amm.minOrderSize.toNumber() / sdk_1.BASE_PRECISION.toNumber()).toString(),
            initialMarginRatio: (element.marginRatioInitial / sdk_1.FUNDING_RATE_BUFFER_PRECISION.toNumber()).toString(),
            maintenanceMarginRatio: (element.marginRatioMaintenance / sdk_1.FUNDING_RATE_BUFFER_PRECISION.toNumber()).toString()
        };
    });
    var spotResult = spotMarkets.map(function (element) {
        return {
            marketIndex: element.marketIndex.toString(),
            symbol: String.fromCharCode.apply(String, element.name).trim(),
            priceStep: (element.orderTickSize.toNumber() / sdk_1.QUOTE_PRECISION.toNumber()).toString(),
            amountStep: null,
            minOrderSize: (element.minOrderSize.toNumber() / sdk_1.BASE_PRECISION.toNumber()).toString(),
            initialMarginRatio: null,
            maintenanceMarginRatio: null
        };
    });
    res.status(200).json({
        spot: spotResult,
        perp: perpResult
    });
});
//cancels orders
router.delete('/orders', function (req, res) {
    var driftClient = req.app.locals.driftClient;
    var ids = req.body.ids;
    if (!Array.isArray(ids)) {
        return res.status(501).json({ error: 'Not Implemented' });
    }
    driftClient.cancelOrdersByIds(ids)
        .then(function (result) {
        res.status(200).json({ tx: result });
    })
        .catch(function (error) {
        res.status(500).json({ error: error.message });
    });
});
