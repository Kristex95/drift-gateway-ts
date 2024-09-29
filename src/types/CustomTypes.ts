import { OrderActionRecord, OrderAction, OrderRecord, BN } from "@drift-labs/sdk";

export type ExtendedOrderActionRecord = OrderActionRecord & {
  txSig: string;
  txSigIndex: number;
};

export type ExtendedOrderRecord = OrderRecord & {
  txSig: string;
};