import { DriftClient, PositionDirection, AMM_RESERVE_PRECISION, QUOTE_PRECISION, BASE_PRECISION, FUNDING_RATE_BUFFER_PRECISION, User, PRICE_PRECISION } from '@drift-labs/sdk';
import { DriftEnv } from '@drift-labs/sdk';
import { Router } from 'express';
import { OrderCreator } from '../service/OrderCreator';
import { getAllPositions } from '../service/PositionService';
import { SOL_SPOT_MARKET_INDEX } from '../config/constants';

const router = Router();

// GET request that doesn't require any parameters
router.get('/data', (req, res) => {
  const driftClient = req.app.locals.driftClient as DriftClient;
  res.json({subscribed: driftClient._isSubscribed})
}); 

//places orders
router.post('/orders', (req, res) => {
  const driftClient = req.app.locals.driftClient as DriftClient;

  const { orders } = req.body;

  orders.forEach((order: any) => {
    const {
      marketIndex,
      amount,
      price,
      orderType,
    } = order;

    
    const direction: PositionDirection = amount > 0 ? PositionDirection.LONG : PositionDirection.SHORT;

    if (orderType === "limit") {
      const tx = OrderCreator.placeLimitOrder(driftClient, marketIndex, direction, amount, price);
      tx.then(result =>{
        res.status(200).json({tx: result})
      });
    } else if (orderType === "market") {
      const tx = OrderCreator.placeMarketOrder(driftClient, marketIndex, direction, amount);
      tx.then(result =>{
        res.status(200).json({tx: result})
      });
    }
  });
});

//returns all clients positions 
router.get("/positions", (req, res) => {
  const user = req.app.locals.user as User;
  const positions = getAllPositions(user);
  res.status(200).json(positions);
});

//returns balance value in USD
router.get("/balance", (req, res) => {
  const user = req.app.locals.user as User;
  console.log(user.getNetSpotMarketValue().toNumber() / QUOTE_PRECISION.toNumber());
  res.status(200).json({
    balance: ((user.getNetUsdValue().toNumber() - user.getUnrealizedPNL().toNumber()) / QUOTE_PRECISION.toNumber()).toString()
  });
});

//returns extended info by market index
router.get("/positionInfo/:id", (req, res) => {
  const user = req.app.locals.user as User;
  const positionId = Number(req.params.id);
  const position = user.getPerpPosition(positionId);

  if (position === undefined) {
    return res.status(200).json({});
  }

  res.status(200).json({
    amount: (position.baseAssetAmount.toNumber() / BASE_PRECISION.toNumber()).toString(),
    averageEntry: position.quoteEntryAmount.toNumber().toString(),
    marketIndex: position.marketIndex,
    liquidationPrice: null, //todo
    unrealizedPnl: null, //todo
    unsettledPnl: position.settledPnl.toNumber(), //todo unsettled
    oraclePrice: null //todo
  });
});

//returns all coins indexes and order requirements
router.get('/markets', (req, res) => {
  const driftClient = req.app.locals.driftClient as DriftClient;
  
  const perpMarkets = driftClient.getPerpMarketAccounts();
  const spotMarkets = driftClient.getSpotMarketAccounts();
  const perpResult = perpMarkets.map(element => {
    return {
      marketIndex: element.marketIndex,
      symbol: String.fromCharCode(...element.name).trim(),
      priceStep: (element.amm.orderTickSize.toNumber() / QUOTE_PRECISION.toNumber()).toString(),
      amountStep: (element.amm.orderStepSize.toNumber() /AMM_RESERVE_PRECISION.toNumber()).toString(),
      minOrderSize: (element.amm.minOrderSize.toNumber() / BASE_PRECISION.toNumber()).toString(),
      initialMarginRatio: (element.marginRatioInitial / FUNDING_RATE_BUFFER_PRECISION.toNumber()).toString(),
      maintenanceMarginRatio: (element.marginRatioMaintenance / FUNDING_RATE_BUFFER_PRECISION.toNumber()).toString()
    };
  });
  const spotResult = spotMarkets.map(element => {
    return {
      marketIndex: element.marketIndex.toString(),
      symbol: String.fromCharCode(...element.name).trim(),
      priceStep: (element.orderTickSize.toNumber() / QUOTE_PRECISION.toNumber()).toString(),
      amountStep: null,
      minOrderSize: (element.minOrderSize.toNumber() / BASE_PRECISION.toNumber()).toString(),
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
router.delete('/orders', (req, res) => {
  const driftClient = req.app.locals.driftClient as DriftClient;
  const ids: number[] = req.body.ids;
  
  if (!Array.isArray(ids)) {
    return res.status(501).json({ error: 'Not Implemented' });
  }

  driftClient.cancelOrdersByIds(ids)
    .then(result => {
      res.status(200).json({ tx: result });
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});

export { router };