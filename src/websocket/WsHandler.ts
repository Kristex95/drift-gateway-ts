import {WebSocketServer, WebSocket} from "ws";
import {
    DriftClient,
    EventSubscriber,
    EventSubscriptionOptions, MarketType,
    DLOBSubscriber,
} from "@drift-labs/sdk";
import {Connection, PublicKey} from "@solana/web3.js";
import http from "http";
import {OrderActionConverter} from "./OrderActionConverter";
import {ExtendedOrderActionRecord, ExtendedOrderRecord} from "../types/CustomTypes";
import {processUpdateOrder} from "../service/UpdateOrderAction";
import {SlotSource} from "@drift-labs/sdk/src/dlob/types";
import {wsMarketInfo} from "../dlobProvider";


const dimensions = 10 ** 6

interface WebSocketConnection {
    id: number;
    ws: WebSocket;
    subscribed: boolean; // Track subscription status
    isAlive: boolean; // Track if the connection is alive
}

let clients: WebSocketConnection[] = [];
let userAccountPublicKey: string;

// Function to initialize WebSocket server
export function startWebSocketServer(
    server: http.Server,
    driftClient: DriftClient,
    dlobSubscriber: DLOBSubscriber,
    slotSource: SlotSource,
    perpMarketInfos: wsMarketInfo[],
) {
    const wss = new WebSocketServer({server});

    wss.on("connection", (ws: WebSocket) => {
        const clientId = Date.now();
        const client: WebSocketConnection = {id: clientId, ws, subscribed: false, isAlive: true};
        clients.push(client);

        console.log(`Client connected: ${clientId}`);

        ws.on("error", (error) => {
            console.error(`Client ${clientId} encountered an error:`, error);
        });

        ws.on("message", (message: string) => {
            client.isAlive = true;
            handleIncomingMessage(message, clientId);
        });

        ws.on("close", () => {
            console.log(`Client disconnected: ${clientId}`);
            clients = clients.filter((client) => client.id !== clientId);
        });
    });

    dlobSubscriber.eventEmitter.on('update', (dlob) => {
        const slot = slotSource.getSlot();
        perpMarketInfos.forEach((market) => {
            const oracleDataAndSlot = driftClient.getOracleDataForPerpMarket(
                market.marketIndex
            );

            const l2 = dlob.getL2({
                marketIndex: market.marketIndex,
                marketType: MarketType.PERP,
                slot: slot,
                oraclePriceData: oracleDataAndSlot,
                depth: 100,
            });

            let bids = [];
            let asks = [];
          //  console.info(`market name: ${market.marketName} idx: ${market.marketIndex} `);
            for (const bid of l2.bids) {
                bids.push({price: bid.price.toNumber() / dimensions, size: bid.size.toNumber() / dimensions});
            }
            for (const ask of l2.asks) {
                asks.push({price: ask.price.toNumber() / dimensions, size: ask.size.toNumber() / dimensions});
            }
            if (bids.length > 0 && asks.length > 0) {
                const ob = {bids: bids, asks: asks, name: market.marketName}

                clients.forEach((client) => {
                    const logTime = new Date().toISOString();
                    const jsonMessage = JSON.stringify({
                        data: ob,
                        channel: "orders",
                        slot: slot,
                    });
                    if (client.ws.readyState === WebSocket.OPEN) {
                        console.log(`${logTime} sent: ${JSON.stringify(jsonMessage)}`);
                        client.ws.send(jsonMessage);
                    }
                });
               // console.log(market.marketName, asks, bids)
            }
        });
    });

    // Schedule check every 60 seconds
    setInterval(() => {
        const now = Date.now();
        clients.forEach((client) => {
            if (!client.isAlive) {
                console.log(`Client ${client.id} is unresponsive, closing connection.`);
                client.ws.terminate();
                clients = clients.filter((c) => c.id !== client.id);
            } else {
                client.isAlive = false;
            }
        });
    }, 60000);
    console.log("WebSocket server started.");
}

async function subscribeToEvent(
    connection: Connection,
    driftClient: DriftClient
) {
    const options: EventSubscriptionOptions = {
        eventTypes: ["OrderActionRecord", "OrderRecord"],
        maxTx: 4096,
        maxEventsPerType: 4096,
        orderBy: "blockchain",
        orderDir: "asc",
        commitment: "confirmed",
        logProviderConfig: {
            type: "websocket",
        },
    };

    const eventSubscriber = new EventSubscriber(
        connection,
        driftClient.program,
        options
    );
    await eventSubscriber.subscribe();
    eventSubscriber.eventEmitter.on("newEvent", (event) => {
        if (event.eventType == "OrderActionRecord") {
            const orderActionRecord = event as ExtendedOrderActionRecord;
            if (orderActionRecord.taker?.toString() == userAccountPublicKey || orderActionRecord.maker?.toString() == userAccountPublicKey) {
                const processedAction = processUpdateOrder(orderActionRecord);
                if (processedAction == null) return;
                clients.forEach((client) => {
                    broadcastMessage(processedAction, client);
                });
            }
        } else if (event.eventType == "OrderRecord") {
            const orderRecord = event as ExtendedOrderRecord;
            if (orderRecord.user.toString() == userAccountPublicKey) {
                const orderRecordResult = OrderActionConverter.OrderCreateAction(orderRecord);
                clients.forEach((client) => {
                    broadcastMessage(orderRecordResult, client);
                });
            }
        }
    });
}

function handleIncomingMessage(message: string, clientId: number) {
    try {
        const parsedMessage = JSON.parse(message);
        if (Buffer.isBuffer(message)) {
            if (!message.toString().includes("heartbeat")) {
                console.log(`ReceivedBuf: ${message.toString()}`);
            }
            return;
        }

        console.log(`Received: ${parsedMessage.toString()}`);
        if (parsedMessage.method === "subscribe") {
            const client = clients.find(client => client.id === clientId);
            if (client) {
                client.subscribed = true;
                console.log(`Client ${clientId} subscribed.`);
            }
        }
    } catch (error) {
        console.error("Error parsing message:", error);
    }
}

export function broadcastMessage(message: object, client: WebSocketConnection) {
    const logTime = new Date().toISOString();
    const jsonMessage = JSON.stringify({
        data: message,
        channel: "orders",
        subAccountId: 0
    });
    if (client.ws.readyState === WebSocket.OPEN) {
        console.log(`${logTime} sent: ${JSON.stringify(jsonMessage)}`);
        client.ws.send(jsonMessage);
    }
}
