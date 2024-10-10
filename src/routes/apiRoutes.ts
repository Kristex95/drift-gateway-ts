import {
  DriftClient,
  PositionDirection,
  AMM_RESERVE_PRECISION,
  QUOTE_PRECISION,
  BASE_PRECISION,
  FUNDING_RATE_BUFFER_PRECISION,
  User,
  PRICE_PRECISION,
} from "@drift-labs/sdk";
import { Router } from "express";
import { OrderCreator } from "../service/OrderCreator";
import { getAllPositions } from "../service/PositionService";

const router = Router();

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
  console.log(`TEMP: place order request called ${req}`)
  try {
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
    return res.status(400).send(errorMessage);
  }
});


//returns all clients positions
router.get("/positions", (req, res) => {
  try {
    const user = req.app.locals.user as User;
    const positions = getAllPositions(user);
    res.status(200).json(positions);
  } catch (err) {
    res.status(400).send(err);
  }
});

//returns balance value in USD
router.get("/balance", (req, res) => {
  try {
    const user = req.app.locals.user as User;
    const precision = QUOTE_PRECISION.toNumber();
    res.status(200).json({
      balance: (
        (user.getNetUsdValue().toNumber() -
          user.getUnrealizedPNL().toNumber()) /
          precision
      ).toString(),
      unrealizedPnl: user.getUnrealizedPNL().toNumber() / precision,
      totalCollateral: user.getTotalCollateral().toNumber() / precision,
      freeCollateral: user.getFreeCollateral().toNumber() / precision,
      totalInitialMargin: user.getInitialMarginRequirement().toNumber() / precision,
      totalMaintenanceMargin: user.getMaintenanceMarginRequirement().toNumber() / precision,
    });
  } catch (err) {
    res.status(400).send(err);
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

    res.status(200).json({
      amount: (
        position.baseAssetAmount.toNumber() / BASE_PRECISION.toNumber()
      ).toString(),
      averageEntry: position.quoteEntryAmount.toNumber().toString(),
      marketIndex: position.marketIndex,
      liquidationPrice: null, //todo
      unrealizedPnl: null, //todo
      unsettledPnl: position.settledPnl.toNumber(), //todo unsettled
      oraclePrice: null, //todo
    });
  } catch (err) {
    res.status(400).send(err);
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
