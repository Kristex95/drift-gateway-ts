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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
exports.startWebSocketServer = startWebSocketServer;
exports.broadcastMessage = broadcastMessage;
var ws_1 = require("ws");
var sdk_1 = require("@drift-labs/sdk");
var OrderActionConverter_1 = require("./OrderActionConverter");
var UpdateOrderAction_1 = require("../service/UpdateOrderAction");
var clients = [];
var userAccountPublicKey;
// Function to initialize WebSocket server
function startWebSocketServer(server, connection, driftClient) {
    subscribeToEvent(connection, driftClient);
    var wss = new ws_1.WebSocketServer({ server: server });
    driftClient.getUserAccountPublicKey().then(function (result) {
        userAccountPublicKey = String(result);
    });
    wss.on("connection", function (ws) {
        var clientId = Date.now();
        var client = { id: clientId, ws: ws, subscribed: false, isAlive: true };
        clients.push(client);
        console.log("Client connected: ".concat(clientId));
        ws.on("error", function (error) {
            console.error("Client ".concat(clientId, " encountered an error:"), error);
        });
        ws.on("message", function (message) {
            client.isAlive = true;
            handleIncomingMessage(message, clientId);
        });
        ws.on("close", function () {
            console.log("Client disconnected: ".concat(clientId));
            clients = clients.filter(function (client) { return client.id !== clientId; });
        });
    });
    // Schedule check every 60 seconds
    setInterval(function () {
        var now = Date.now();
        clients.forEach(function (client) {
            if (!client.isAlive) {
                console.log("Client ".concat(client.id, " is unresponsive, closing connection."));
                client.ws.terminate();
                clients = clients.filter(function (c) { return c.id !== client.id; });
            }
            else {
                client.isAlive = false;
            }
        });
    }, 60000);
    console.log("WebSocket server started.");
}
function subscribeToEvent(connection, driftClient) {
    return __awaiter(this, void 0, void 0, function () {
        var options, eventSubscriber;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = {
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
                    eventSubscriber = new sdk_1.EventSubscriber(connection, driftClient.program, options);
                    return [4 /*yield*/, eventSubscriber.subscribe()];
                case 1:
                    _a.sent();
                    eventSubscriber.eventEmitter.on("newEvent", function (event) {
                        var _a, _b;
                        if (event.eventType == "OrderActionRecord") {
                            var orderActionRecord = event;
                            if (((_a = orderActionRecord.taker) === null || _a === void 0 ? void 0 : _a.toString()) == userAccountPublicKey || ((_b = orderActionRecord.maker) === null || _b === void 0 ? void 0 : _b.toString()) == userAccountPublicKey) {
                                var processedAction_1 = (0, UpdateOrderAction_1.processUpdateOrder)(orderActionRecord);
                                if (processedAction_1 == null)
                                    return;
                                clients.forEach(function (client) {
                                    broadcastMessage(processedAction_1, client);
                                });
                            }
                        }
                        else if (event.eventType == "OrderRecord") {
                            var orderRecord = event;
                            if (orderRecord.user.toString() == userAccountPublicKey) {
                                var orderRecordResult_1 = OrderActionConverter_1.OrderActionConverter.OrderCreateAction(orderRecord);
                                clients.forEach(function (client) {
                                    broadcastMessage(orderRecordResult_1, client);
                                });
                            }
                        }
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function handleIncomingMessage(message, clientId) {
    try {
        var parsedMessage = JSON.parse(message);
        if (Buffer.isBuffer(message)) {
            if (!message.toString().includes("heartbeat")) {
                console.log("ReceivedBuf: ".concat(message.toString()));
            }
            return;
        }
        console.log("Received: ".concat(parsedMessage.toString()));
        if (parsedMessage.method === "subscribe") {
            var client = clients.find(function (client) { return client.id === clientId; });
            if (client) {
                client.subscribed = true;
                console.log("Client ".concat(clientId, " subscribed."));
            }
        }
    }
    catch (error) {
        console.error("Error parsing message:", error);
    }
}
function broadcastMessage(message, client) {
    var logTime = new Date().toISOString();
    var jsonMessage = JSON.stringify({
        data: message,
        channel: "orders",
        subAccountId: 0
    });
    if (client.ws.readyState === ws_1.WebSocket.OPEN) {
        console.log("".concat(logTime, " sent: ").concat(JSON.stringify(jsonMessage)));
        client.ws.send(jsonMessage);
    }
}
