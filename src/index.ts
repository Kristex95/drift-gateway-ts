import express from 'express';
import bodyParser from 'body-parser';
import { router } from './routes/apiRoutes';
import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection ,Keypair,PublicKey } from "@solana/web3.js";
import { loadKeypair, DriftClient, EventSubscriber, EventSubscriptionOptions, initialize, BulkAccountLoader, User } from "@drift-labs/sdk";
require('dotenv').config();
import http from 'http';
import { startWebSocketServer } from './websocket/WsHandler';
import { Command } from 'commander';

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

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
    const wallet = new Wallet(loadKeypair(options.private_key));

    const env = 'mainnet-beta';
    const sdkConfig = initialize({ env });

    const connection = new Connection(
      options.rpc,
      'confirmed'
    );
    
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      {
          preflightCommitment: 'confirmed',
          skipPreflight: false,
          commitment: 'confirmed',
      }
    );
    
    const driftPublicKey = new PublicKey(sdkConfig.DRIFT_PROGRAM_ID);
    const bulkAccountLoader = new BulkAccountLoader(
      provider.connection,
      'confirmed',
      1000
    );
    const driftClient = new DriftClient({
      connection: provider.connection,
      wallet: provider.wallet,
      programID: driftPublicKey,
      accountSubscription: {
        type: 'polling',
        accountLoader: bulkAccountLoader,
      },
    });
    await driftClient.subscribe();
    
    const user = new User({
      driftClient: driftClient,
      userAccountPublicKey: await driftClient.getUserAccountPublicKey(),
      accountSubscription: {
          type: 'polling',
          accountLoader: bulkAccountLoader,
      },
    });
    await user.subscribe();
    
    app.locals.driftClient = driftClient;
    app.locals.user = user;
    app.locals.connection = connection;
    console.log("Successfully subscribed to DriftClient.");

    var WS_PORT = options.ws_port || process.env.WS_PORT || 3001;
    server.listen(WS_PORT, () => {
      startWebSocketServer(server, connection, driftClient);
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