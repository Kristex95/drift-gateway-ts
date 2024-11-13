import express from 'express';
import bodyParser from 'body-parser';
import { router } from './routes/apiRoutes';
import { Connection ,PublicKey } from "@solana/web3.js";
import { Wallet, loadKeypair, DriftClient, EventSubscriber, EventSubscriptionOptions } from "@drift-labs/sdk";
require('dotenv').config();
import http from 'http';
import { startWebSocketServer } from './websocket/WsHandler';
import { Command } from 'commander';

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

// Initialize DriftClient and attach it to the app
async function init() {
  try {
    // Establish connection to Solana
    const connection = new Connection(
      options.rpc,
      'confirmed'
    );

    const wallet = new Wallet(loadKeypair(options.private_key));

    // Initialize DriftClient
    const driftClient = new DriftClient({
      connection,
      wallet,
      programID: new PublicKey("dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"),
      opts: {preflightCommitment: "confirmed", commitment: "confirmed"}
    });

    // Subscribe to Drift client events
    await driftClient.subscribe();
    const user = await driftClient.getUser();
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