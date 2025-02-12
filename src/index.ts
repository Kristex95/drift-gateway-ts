import express from 'express';
import bodyParser from 'body-parser';
import {router} from './routes/apiRoutes';
import {AnchorProvider, Wallet} from '@coral-xyz/anchor';
import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {
    loadKeypair,
    DriftClient,
    EventSubscriber,
    EventSubscriptionOptions,
    initialize,
    BulkAccountLoader,
    User,
    DriftClientSubscriptionConfig, SlotSubscriber, UserMap, DLOBSubscriber
} from "@drift-labs/sdk";

require('dotenv').config();
import http from 'http';
import {startWebSocketServer} from './websocket/WsHandler';
import {Command} from 'commander';
import {getDLOBProviderFromUserMap, getMarketsAndOraclesToLoad} from "./dlobProvider";

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const driftEnv = 'mainnet-beta'
const stateCommitment = 'confirmed';
//@ts-ignore
const sdkConfig = initialize({env: driftEnv});
const endpoint = process.env.DRIFT_ENDPOINT || 'https://mainnet.helius-rpc.com/?api-key=apiKey';
const wsEndpoint = process.env.DRIFT_WS_ENDPOINT || 'wss://mainnet.helius-rpc.com/ws?api-key=apiKey';

const program = new Command();
program
    .option('--rpc <type>', 'rpcNode')
    .option('--host <type>', 'host')
    .option('--port <type>', 'port')
    .option('--ws_port <type>', 'websocket port')
    .option('--private_key <type>', 'private key')
    .parse(process.argv);

const options = program.opts();

const app = express();
const server = http.createServer(app);
app.use(bodyParser.json());

async function init() {
    try {
        console.log(options)

        let accountSubscription: DriftClientSubscriptionConfig;
        const wallet = new Wallet(new Keypair());
        const connection = new Connection(endpoint, {
            wsEndpoint: wsEndpoint,
            commitment: stateCommitment,
        });

        accountSubscription = {
            type: 'websocket',
            commitment: stateCommitment,
            resubTimeoutMs: 30_000,
        };
        const slotSubscriber = new SlotSubscriber(connection, {
            resubTimeoutMs: 10_000,
        });
        await slotSubscriber.subscribe();

        const slotSource = {
            getSlot: () => slotSubscriber!.getSlot(),
        };

        const {perpMarketInfos, spotMarketInfos, oracleInfos} =
            getMarketsAndOraclesToLoad(sdkConfig);

        const driftClient = new DriftClient({
            connection,
            wallet,
            env: driftEnv,
            accountSubscription: accountSubscription,
            perpMarketIndexes: perpMarketInfos.map((m) => m.marketIndex),
            spotMarketIndexes: spotMarketInfos.map((m) => m.marketIndex),
            oracleInfos,
        });

        driftClient.eventEmitter.on('error', (e) => {
            console.info('clearing house error');
            console.error(e);
        });

        const userMap = new UserMap({
            driftClient,
            subscriptionConfig: {
                type: 'websocket',
                resubTimeoutMs: 30_000,
                commitment: stateCommitment,
            },
            skipInitialLoad: false,
            includeIdle: false,
        });

        const dlobProvider = getDLOBProviderFromUserMap(userMap);

        await dlobProvider.subscribe();
        console.log('subscribed to dlob provider');

        const dlobSubscriber = new DLOBSubscriber({
            driftClient,
            dlobSource: dlobProvider,
            slotSource,
            updateFrequency: 1000,
        })

        await dlobSubscriber.subscribe();


        app.locals.driftClient = driftClient;
        app.locals.connection = connection;
        console.log("Successfully subscribed to DriftClient.");

        var WS_PORT = options.ws_port || process.env.WS_PORT || 3001;
        server.listen(WS_PORT, () => {
            startWebSocketServer(
                server,
                driftClient,
                dlobSubscriber,
                slotSource,
                perpMarketInfos,
                );
            console.log(`Websocket is running on port ${WS_PORT}`);
        });
    } catch (error) {
        console.error("Error initializing DriftClient:", error);
    }
}

app.use('/v1', router);

var PORT = parseInt(options.port, 10) || process.env.PORT || 3000;
var HOST = options.host || '127.0.0.1'
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    init();
});