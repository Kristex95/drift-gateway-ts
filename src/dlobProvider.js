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
exports.getMarketsAndOraclesToLoad = void 0;
exports.getDLOBProviderFromUserMap = getDLOBProviderFromUserMap;
exports.getDLOBProviderFromOrderSubscriber = getDLOBProviderFromOrderSubscriber;
var web3_js_1 = require("@solana/web3.js");
function parsePositiveIntArray(intArray, separator) {
    if (separator === void 0) { separator = ','; }
    return intArray
        .split(separator)
        .map(function (s) { return s.trim(); })
        .map(function (s) { return parseInt(s); })
        .filter(function (n) { return !isNaN(n) && n >= 0; });
}
// comma separated list of perp market indexes to load: i.e. 0,1,2,3
var PERP_MARKETS_TO_LOAD = process.env.PERP_MARKETS_TO_LOAD !== undefined
    ? parsePositiveIntArray(process.env.PERP_MARKETS_TO_LOAD)
    : undefined;
// comma separated list of spot market indexes to load: i.e. 0,1,2,3
var SPOT_MARKETS_TO_LOAD = process.env.SPOT_MARKETS_TO_LOAD !== undefined
    ? parsePositiveIntArray(process.env.SPOT_MARKETS_TO_LOAD)
    : undefined;
var getMarketsAndOraclesToLoad = function (sdkConfig) {
    var oracleInfos = [];
    var oraclesTracked = new Set();
    var perpMarketInfos = [];
    var spotMarketInfos = [];
    // only watch all markets if neither env vars are specified
    var noMarketsSpecified = !PERP_MARKETS_TO_LOAD && !SPOT_MARKETS_TO_LOAD;
    var perpIndexes = PERP_MARKETS_TO_LOAD;
    if (!perpIndexes) {
        if (noMarketsSpecified) {
            perpIndexes = sdkConfig.PERP_MARKETS.map(function (m) { return m.marketIndex; });
        }
        else {
            perpIndexes = [];
        }
    }
    var spotIndexes = SPOT_MARKETS_TO_LOAD;
    if (!spotIndexes) {
        if (noMarketsSpecified) {
            spotIndexes = sdkConfig.SPOT_MARKETS.map(function (m) { return m.marketIndex; });
        }
        else {
            spotIndexes = [];
        }
    }
    if (perpIndexes && perpIndexes.length > 0) {
        for (var _i = 0, perpIndexes_1 = perpIndexes; _i < perpIndexes_1.length; _i++) {
            var idx = perpIndexes_1[_i];
            var perpMarketConfig = sdkConfig.PERP_MARKETS[idx];
            if (!perpMarketConfig) {
                throw new Error("Perp market config for ".concat(idx, " not found"));
            }
            var oracleKey = perpMarketConfig.oracle.toBase58();
            if (!oraclesTracked.has(oracleKey)) {
                console.info("Tracking oracle ".concat(oracleKey, " for perp market ").concat(idx));
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
        console.info("DlobPublisher tracking perp markets: ".concat(JSON.stringify(perpMarketInfos)));
    }
    if (spotIndexes && spotIndexes.length > 0) {
        for (var _a = 0, spotIndexes_1 = spotIndexes; _a < spotIndexes_1.length; _a++) {
            var idx = spotIndexes_1[_a];
            var spotMarketConfig = sdkConfig.SPOT_MARKETS[idx];
            if (!spotMarketConfig) {
                throw new Error("Spot market config for ".concat(idx, " not found"));
            }
            var oracleKey = spotMarketConfig.oracle.toBase58();
            if (!oraclesTracked.has(oracleKey)) {
                console.info("Tracking oracle ".concat(oracleKey, " for spot market ").concat(idx));
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
        console.info("DlobPublisher tracking spot markets: ".concat(JSON.stringify(spotMarketInfos)));
    }
    return {
        perpMarketInfos: perpMarketInfos,
        spotMarketInfos: spotMarketInfos,
        oracleInfos: oracleInfos,
    };
};
exports.getMarketsAndOraclesToLoad = getMarketsAndOraclesToLoad;
function getDLOBProviderFromUserMap(userMap) {
    var _this = this;
    return {
        subscribe: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, userMap.subscribe()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        getDLOB: function (slot) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, userMap.getDLOB(slot)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        getUniqueAuthorities: function () {
            return userMap.getUniqueAuthorities();
        },
        getUserAccounts: function () {
            var _i, _a, user;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = userMap.values();
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        user = _a[_i];
                        return [4 /*yield*/, {
                                userAccount: user.getUserAccount(),
                                publicKey: user.getUserAccountPublicKey(),
                            }];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        },
        getUserAccount: function (publicKey) {
            var _a;
            return (_a = userMap.get(publicKey.toString())) === null || _a === void 0 ? void 0 : _a.getUserAccount();
        },
        size: function () {
            return userMap.size();
        },
        fetch: function () {
            return userMap.sync();
        },
        getSlot: function () {
            return userMap.getSlot();
        },
    };
}
function getDLOBProviderFromOrderSubscriber(orderSubscriber) {
    var _this = this;
    return {
        subscribe: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, orderSubscriber.subscribe()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        getDLOB: function (slot) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, orderSubscriber.getDLOB(slot)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        getUniqueAuthorities: function () {
            var authorities = new Set();
            // @ts-ignore
            for (var _i = 0, _a = orderSubscriber.usersAccounts.values(); _i < _a.length; _i++) {
                var userAccount = _a[_i].userAccount;
                authorities.add(userAccount.authority.toBase58());
            }
            var pubkeys = Array.from(authorities).map(function (a) { return new web3_js_1.PublicKey(a); });
            return pubkeys;
        },
        getUserAccounts: function () {
            var _i, _a, _b, key, userAccount;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _i = 0, _a = orderSubscriber.usersAccounts.entries();
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        _b = _a[_i], key = _b[0], userAccount = _b[1].userAccount;
                        return [4 /*yield*/, { userAccount: userAccount, publicKey: new web3_js_1.PublicKey(key) }];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        },
        getUserAccount: function (publicKey) {
            var _a;
            return (_a = orderSubscriber.usersAccounts.get(publicKey.toString())) === null || _a === void 0 ? void 0 : _a.userAccount;
        },
        size: function () {
            return orderSubscriber.usersAccounts.size;
        },
        fetch: function () {
            return orderSubscriber.fetch();
        },
        getSlot: function () {
            return orderSubscriber.getSlot();
        },
    };
}
