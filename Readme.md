gateway:

-pull
-npm install
-tsc (optional)

---------------------------

drift-client:

-mvn clean install

---------------------------

ArbiTrader:

app.drift.gatewayExecutablePath=.../src/index.js

-------------

env variables:

DRIFT_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=apiKey
DRIFT_WS_ENDPOINT=wss://mainnet.helius-rpc.com/ws?api-key=apiKey