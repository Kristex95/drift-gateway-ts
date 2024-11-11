import {
  DriftClient,
  PositionDirection,
  AMM_RESERVE_PRECISION,
  QUOTE_PRECISION,
  BASE_PRECISION,
  FUNDING_RATE_BUFFER_PRECISION,
  User,
  PRICE_PRECISION, convertToNumber,
} from "@drift-labs/sdk";
import { Router } from "express";
import { OrderCreator } from "../service/OrderCreator";
import { getAllPositions } from "../service/PositionService";


const router = Router();

function safeStringify(obj: any) {
  const seen = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  });
}

// GET request that doesn't require any parameters
router.get("/data", (req, res) => {
  const driftClient = req.app.locals.driftClient as DriftClient;
  if (driftClient) {
    res.status(200).json({
      subscribed: driftClient._isSubscribed,
      message: driftClient._isSubscribed
        ? "Client is subscribed"
        : "Client is not subscribed",
    });
  } else {
    res.status(500).json({ error: "DriftClient not found" });
  }
});

//places orders
router.post("/orders", async (req, res) => {
  try {
    console.log("POST /orders", safeStringify(req.body));
    const driftClient = req.app.locals.driftClient as DriftClient;

    const { orders } = req.body;

    if (!orders || orders.length === 0) {
      return res.status(400).send("No orders provided.");
    }

    const order = orders[0];
    const { marketIndex, amount, price, orderType } = order;

    const direction: PositionDirection =
      amount > 0 ? PositionDirection.LONG : PositionDirection.SHORT;

    if (orderType !== "limit" && orderType !== "market") {
      return res.status(400).send("Invalid order type.");
    }

    if (orderType === "limit") {
      const result = await OrderCreator.placeLimitOrder(
        driftClient,
        marketIndex,
        direction,
        amount,
        price
      );
      return res.status(200).json({ tx: result });
    } else if (orderType === "market") {
      const result = await OrderCreator.placeMarketOrder(
        driftClient,
        marketIndex,
        direction,
        amount
      );
      return res.status(200).json({ tx: result });
    }
  } catch (err) {
    console.log("/orders caught an error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    const singleLineError = JSON.stringify(errorMessage).replace(/\\n/g, ' ');
    return res.status(400).send(singleLineError);
  }
});


//returns all clients positions
router.get("/positions", (req, res) => {
  try {
    const user = req.app.locals.user as User;
    const positions = getAllPositions(user);
    res.status(200).json(positions);
  } catch (err) {
    res.status(400).send(JSON.stringify(err));
  }
});

//returns balance value in USD
router.get("/balance", (req, res) => {
  try {
    const user = req.app.locals.user as User;
    const precision = QUOTE_PRECISION;
    res.status(200).json({
      balance: convertToNumber(user.getNetUsdValue().sub(user.getUnrealizedPNL()), precision).toString(),
      unrealizedPnl: convertToNumber(user.getUnrealizedPNL(), precision),
      totalCollateral: convertToNumber(user.getTotalCollateral(), precision),
      freeCollateral: convertToNumber(user.getFreeCollateral(), precision),
      totalInitialMargin: convertToNumber(user.getInitialMarginRequirement(), precision),
      totalMaintenanceMargin: convertToNumber(user.getMaintenanceMarginRequirement(), precision),
    });
  } catch (err) {
    res.status(400).send(JSON.stringify(err));
  }
});

//returns extended info by market index
router.get("/positionInfo/:id", (req, res) => {
  try {
    const user = req.app.locals.user as User;
    const positionId = Number(req.params.id);
    const position = user.getPerpPosition(positionId);

    if (position === undefined) {
      return res.status(200).json({});
    }

    if (!position) {
      return res
        .status(404)
        .json({ error: `Position with ID ${positionId} not found` });
    }

    const baseQty = convertToNumber(position.baseAssetAmount, BASE_PRECISION);
    const quoteEntryAmount = convertToNumber(position.quoteEntryAmount, QUOTE_PRECISION);
    const entryPrice = baseQty === 0 ? 0 : Math.abs(quoteEntryAmount / baseQty);

    res.status(200).json({
      amount: baseQty.toString(),
      averageEntry: entryPrice.toString(),
      marketIndex: position.marketIndex,
      liquidationPrice: null, //todo
      unrealizedPnl: null, //todo
      unsettledPnl: null,
      oraclePrice: null, //todo
    });
  } catch (err) {
    res.status(400).send(JSON.stringify(err));
  }
});

//returns all coins indexes and order requirements
router.get("/markets", (req, res) => {
  const driftClient = req.app.locals.driftClient as DriftClient;

  try {
    if (!driftClient) {
      return res.status(500).json({ error: "DriftClient not found" });
    }

    const perpMarkets = driftClient.getPerpMarketAccounts();
    const spotMarkets = driftClient.getSpotMarketAccounts();

    const perpResult = perpMarkets.map((element) => ({
      marketIndex: element.marketIndex,
      symbol: String.fromCharCode(...element.name).trim(),
      priceStep: (
        element.amm.orderTickSize.toNumber() / QUOTE_PRECISION.toNumber()
      ).toString(),
      amountStep: (
        element.amm.orderStepSize.toNumber() / AMM_RESERVE_PRECISION.toNumber()
      ).toString(),
      minOrderSize: (
        element.amm.minOrderSize.toNumber() / BASE_PRECISION.toNumber()
      ).toString(),
      initialMarginRatio: (
        element.marginRatioInitial / FUNDING_RATE_BUFFER_PRECISION.toNumber()
      ).toString(),
      maintenanceMarginRatio: (
        element.marginRatioMaintenance /
        FUNDING_RATE_BUFFER_PRECISION.toNumber()
      ).toString(),
    }));

    const spotResult = spotMarkets.map((element) => ({
      marketIndex: element.marketIndex.toString(),
      symbol: String.fromCharCode(...element.name).trim(),
      priceStep: (
        element.orderTickSize.toNumber() / QUOTE_PRECISION.toNumber()
      ).toString(),
      amountStep: null,
      minOrderSize: (
        element.minOrderSize.toNumber() / BASE_PRECISION.toNumber()
      ).toString(),
      initialMarginRatio: null,
      maintenanceMarginRatio: null,
    }));

    res.status(200).json({
      spot: spotResult,
      perp: perpResult,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

//cancels orders
router.delete("/orders", async (req, res) => {
  const driftClient = req.app.locals.driftClient as DriftClient;
  const ids: number[] = req.body.ids;

  if (!Array.isArray(ids)) {
    return res
      .status(400)
      .json({ error: "Invalid data: IDs should be an array" });
  }

  try {
    const result = await driftClient.cancelOrdersByIds(ids);
    res
      .status(200)
      .json({ message: "Orders cancelled successfully", tx: result });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

export { router };
