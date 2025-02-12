import {
    DLOB,
    OracleInfo,
    OrderSubscriber,
    PerpMarketConfig,
    SpotMarketConfig,
    UserAccount,
    UserMap
} from '@drift-labs/sdk';
import { PublicKey } from '@solana/web3.js';

function parsePositiveIntArray(
    intArray: string,
    separator = ','
): number[] {
    return intArray
        .split(separator)
        .map((s) => s.trim())
        .map((s) => parseInt(s))
        .filter((n) => !isNaN(n) && n >= 0);
}

// comma separated list of perp market indexes to load: i.e. 0,1,2,3
const PERP_MARKETS_TO_LOAD =
    process.env.PERP_MARKETS_TO_LOAD !== undefined
        ? parsePositiveIntArray(process.env.PERP_MARKETS_TO_LOAD)
        : undefined;

// comma separated list of spot market indexes to load: i.e. 0,1,2,3
const SPOT_MARKETS_TO_LOAD =
    process.env.SPOT_MARKETS_TO_LOAD !== undefined
        ? parsePositiveIntArray(process.env.SPOT_MARKETS_TO_LOAD)
        : undefined;



export type wsMarketInfo = {
    marketIndex: number;
    marketName: string;
};

export const getMarketsAndOraclesToLoad = (
    sdkConfig: any
): {
    perpMarketInfos: wsMarketInfo[];
    spotMarketInfos: wsMarketInfo[];
    oracleInfos?: OracleInfo[];
} => {
    const oracleInfos: OracleInfo[] = [];
    const oraclesTracked = new Set();
    const perpMarketInfos: wsMarketInfo[] = [];
    const spotMarketInfos: wsMarketInfo[] = [];

    // only watch all markets if neither env vars are specified
    const noMarketsSpecified = !PERP_MARKETS_TO_LOAD && !SPOT_MARKETS_TO_LOAD;

    let perpIndexes = PERP_MARKETS_TO_LOAD;
    if (!perpIndexes) {
        if (noMarketsSpecified) {
            perpIndexes = sdkConfig.PERP_MARKETS.map((m: SpotMarketConfig) => m.marketIndex);
        } else {
            perpIndexes = [];
        }
    }
    let spotIndexes = SPOT_MARKETS_TO_LOAD;
    if (!spotIndexes) {
        if (noMarketsSpecified) {
            spotIndexes = sdkConfig.SPOT_MARKETS.map((m: SpotMarketConfig) => m.marketIndex);
        } else {
            spotIndexes = [];
        }
    }

    if (perpIndexes && perpIndexes.length > 0) {
        for (const idx of perpIndexes) {
            const perpMarketConfig = sdkConfig.PERP_MARKETS[idx] as PerpMarketConfig;
            if (!perpMarketConfig) {
                throw new Error(`Perp market config for ${idx} not found`);
            }
            const oracleKey = perpMarketConfig.oracle.toBase58();
            if (!oraclesTracked.has(oracleKey)) {
                console.info(`Tracking oracle ${oracleKey} for perp market ${idx}`);
                oracleInfos.push({
                    publicKey: perpMarketConfig.oracle,
                    source: perpMarketConfig.oracleSource,
                });
                oraclesTracked.add(oracleKey);
            }
            perpMarketInfos.push({
                marketIndex: perpMarketConfig.marketIndex,
                marketName: perpMarketConfig.symbol,
            });
        }
        console.info(
            `DlobPublisher tracking perp markets: ${JSON.stringify(perpMarketInfos)}`
        );
    }

    if (spotIndexes && spotIndexes.length > 0) {
        for (const idx of spotIndexes) {
            const spotMarketConfig = sdkConfig.SPOT_MARKETS[idx] as SpotMarketConfig;
            if (!spotMarketConfig) {
                throw new Error(`Spot market config for ${idx} not found`);
            }
            const oracleKey = spotMarketConfig.oracle.toBase58();
            if (!oraclesTracked.has(oracleKey)) {
                console.info(`Tracking oracle ${oracleKey} for spot market ${idx}`);
                oracleInfos.push({
                    publicKey: spotMarketConfig.oracle,
                    source: spotMarketConfig.oracleSource,
                });
                oraclesTracked.add(oracleKey);
            }
            spotMarketInfos.push({
                marketIndex: spotMarketConfig.marketIndex,
                marketName: spotMarketConfig.symbol,
            });
        }
        console.info(
            `DlobPublisher tracking spot markets: ${JSON.stringify(spotMarketInfos)}`
        );
    }

    return {
        perpMarketInfos,
        spotMarketInfos,
        oracleInfos,
    };
};

export type DLOBProvider = {
    subscribe(): Promise<void>;
    getDLOB(slot: number): Promise<DLOB>;
    getUniqueAuthorities(): PublicKey[];
    getUserAccounts(): Generator<{
        userAccount: UserAccount;
        publicKey: PublicKey;
    }>;
    getUserAccount(publicKey: PublicKey): UserAccount | undefined;
    size(): number;
    fetch(): Promise<void>;
    getSlot(): number;
};

export function getDLOBProviderFromUserMap(userMap: UserMap): DLOBProvider {
    return {
        subscribe: async () => {
            await userMap.subscribe();
        },
        getDLOB: async (slot: number) => {
            return await userMap.getDLOB(slot);
        },
        getUniqueAuthorities: () => {
            return userMap.getUniqueAuthorities();
        },
        getUserAccounts: function* () {
            // @ts-ignore
            for (const user of userMap.values()) {
                yield {
                    userAccount: user.getUserAccount(),
                    publicKey: user.getUserAccountPublicKey(),
                };
            }
        },
        getUserAccount: (publicKey) => {
            return userMap.get(publicKey.toString())?.getUserAccount();
        },
        size: () => {
            return userMap.size();
        },
        fetch: () => {
            return userMap.sync();
        },
        getSlot: () => {
            return userMap.getSlot();
        },
    };
}

export function getDLOBProviderFromOrderSubscriber(
    orderSubscriber: OrderSubscriber
): DLOBProvider {
    return {
        subscribe: async () => {
            await orderSubscriber.subscribe();
        },
        getDLOB: async (slot: number) => {
            return await orderSubscriber.getDLOB(slot);
        },
        getUniqueAuthorities: () => {
            const authorities = new Set<string>();
            // @ts-ignore
            for (const { userAccount } of orderSubscriber.usersAccounts.values()) {
                authorities.add(userAccount.authority.toBase58());
            }
            const pubkeys = Array.from(authorities).map((a) => new PublicKey(a));
            return pubkeys;
        },
        getUserAccounts: function* () {
            // @ts-ignore
            for (const [key, { userAccount },] of orderSubscriber.usersAccounts.entries()) {
                yield { userAccount: userAccount, publicKey: new PublicKey(key) };
            }
        },
        getUserAccount: (publicKey) => {
            return orderSubscriber.usersAccounts.get(publicKey.toString())
                ?.userAccount;
        },
        size(): number {
            return orderSubscriber.usersAccounts.size;
        },
        fetch() {
            return orderSubscriber.fetch();
        },
        getSlot: () => {
            return orderSubscriber.getSlot();
        },
    };
}