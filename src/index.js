"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var body_parser_1 = __importDefault(require("body-parser"));
var apiRoutes_1 = require("./routes/apiRoutes");
var anchor = __importStar(require("@coral-xyz/anchor"));
var anchor_1 = require("@coral-xyz/anchor");
var web3_js_1 = require("@solana/web3.js");
var sdk_1 = require("@drift-labs/sdk");
require('dotenv').config();
var http_1 = __importDefault(require("http"));
var WsHandler_1 = require("./websocket/WsHandler");
var commander_1 = require("commander");
process.on('uncaughtException', function (err) {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', function (reason, promise) {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
var program = new commander_1.Command();
program
    .option('--rpc <type>', 'rpcNode')
    .option('--host <type>', 'host')
    .option('--port <type>', 'port')
    .option('--ws_port <type>', 'websocket port')
    .option('--private_key <type>', 'private key')
    .parse(process.argv);
var options = program.opts();
var app = (0, express_1.default)();
var server = http_1.default.createServer(app);
app.use(body_parser_1.default.json());
function init() {
    return __awaiter(this, void 0, void 0, function () {
        var wallet, env, sdkConfig, connection_1, provider, driftPublicKey, bulkAccountLoader, driftClient_1, user, _a, WS_PORT, error_1;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    wallet = new anchor_1.Wallet((0, sdk_1.loadKeypair)(options.private_key));
                    env = 'mainnet-beta';
                    sdkConfig = (0, sdk_1.initialize)({ env: env });
                    connection_1 = new web3_js_1.Connection(options.rpc, 'confirmed');
                    provider = new anchor.AnchorProvider(connection_1, wallet, {
                        preflightCommitment: 'confirmed',
                        skipPreflight: false,
                        commitment: 'confirmed',
                    });
                    driftPublicKey = new web3_js_1.PublicKey(sdkConfig.DRIFT_PROGRAM_ID);
                    bulkAccountLoader = new sdk_1.BulkAccountLoader(provider.connection, 'confirmed', 1000);
                    driftClient_1 = new sdk_1.DriftClient({
                        connection: provider.connection,
                        wallet: provider.wallet,
                        programID: driftPublicKey,
                        accountSubscription: {
                            type: 'polling',
                            accountLoader: bulkAccountLoader,
                        },
                    });
                    return [4 /*yield*/, driftClient_1.subscribe()];
                case 1:
                    _c.sent();
                    _a = sdk_1.User.bind;
                    _b = {
                        driftClient: driftClient_1
                    };
                    return [4 /*yield*/, driftClient_1.getUserAccountPublicKey()];
                case 2:
                    user = new (_a.apply(sdk_1.User, [void 0, (_b.userAccountPublicKey = _c.sent(),
                            _b.accountSubscription = {
                                type: 'polling',
                                accountLoader: bulkAccountLoader,
                            },
                            _b)]))();
                    return [4 /*yield*/, user.subscribe()];
                case 3:
                    _c.sent();
                    app.locals.driftClient = driftClient_1;
                    app.locals.user = user;
                    app.locals.connection = connection_1;
                    console.log("Successfully subscribed to DriftClient.");
                    WS_PORT = options.ws_port || process.env.WS_PORT || 3001;
                    server.listen(WS_PORT, function () {
                        (0, WsHandler_1.startWebSocketServer)(server, connection_1, driftClient_1);
                        console.log("Websocket is running on port ".concat(WS_PORT));
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _c.sent();
                    console.error("Error initializing DriftClient:", error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
app.use('/v1', apiRoutes_1.router);
var PORT = parseInt(options.port, 10) || process.env.PORT || 3000;
var HOST = options.host || '127.0.0.1';
app.listen(PORT, function () {
    console.log("Server is running on port ".concat(PORT));
    init();
});
