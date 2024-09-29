export type OrderCancelData = {
  orderId: number;
  ts: number;
  signature: string;
  txIdx: number;
};

export type OrderExpireData = {
  orderId: number;
  fee: string;  // Fee is a string because it's represented as "-0.0012"
  ts: number;
  signature: string;
};

export type Order = {
  slot: number;
  price: string;
  amount: string;
  filled: string;
  triggerPrice: string;
  auctionStartPrice: string;
  auctionEndPrice: string;
  maxTs: number;
  oraclePriceOffset: string;
  orderId: number;
  marketIndex: number;
  orderType: "limit" | "market" | "stop"; 
  marketType: "perp" | "spot";
  userOrderId: number;
  direction: "buy" | "sell";
  reduceOnly: boolean;
  postOnly: boolean;
  auctionDuration: number;
};

export type OrderCreateData = {
  order: Order;
  ts: number;
  signature: string;
  txIdx: number;
};

type FillData = {
  side: "buy" | "sell";
  fee: string;
  amount: string;
  price: string;
  oraclePrice: string;
  orderId: number;
  marketIndex: number;
  marketType: "perp" | "spot";
  ts: number;
  txIdx: number;
  signature: string;
  maker: string;
  makerOrderId: number;
  makerFee: string;
  taker: string;
  takerOrderId: number;
  takerFee: string;
};

type OrderCancelMissingData = {
  userOrderId: number;
  orderId: number;
  ts: number;
  signature: string;
};

type FundingPaymentData = {
  amount: string;  // Representing the payment amount as a string
  marketIndex: number;
  ts: number;
  signature: string;
  txIdx: number;
};

export type OrderMessage = {
  data: {
    orderCancel: OrderCancelData | null;
    orderExpire: OrderCancelData | null;
    orderCreate: OrderCreateData | null;
    fill: FillData | null;
    orderCancelMissing: OrderCancelMissingData | null;
    fundingPayment: FundingPaymentData | null;
  };
  channel: string;
  subAccountId: number;
};