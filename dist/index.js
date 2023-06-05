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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const ecc = __importStar(require("tiny-secp256k1"));
bitcoin.initEccLib(ecc);
const ecpair_1 = __importDefault(require("ecpair"));
const utils_1 = require("./utils");
const constants_1 = require("./constants");
const ECPair = (0, ecpair_1.default)(ecc);
const bip32_1 = require("bip32");
const bip32 = (0, bip32_1.BIP32Factory)(ecc);
class Wallet {
    constructor(seed, networkType, addressType) {
        const network = (0, utils_1.toPsbtNetwork)(networkType);
        this.hdNode = bip32.fromSeed(Buffer.from(seed, 'hex'), network);
        this.networkType = networkType;
        this.addressType = addressType;
        this.pubkey = this.hdNode.publicKey.toString('hex');
    }
    requestAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getAccounts();
        });
    }
    getAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = "m/44'/0'/0'/0/0"; // or whatever BIP44 path you want to use
            const child = this.hdNode.derivePath(path);
            const address = (0, utils_1.publicKeyToAddress)(child.publicKey.toString("hex"), this.addressType, this.networkType);
            return [address];
        });
    }
    getNetwork() {
        return __awaiter(this, void 0, void 0, function* () {
            return constants_1.NETWORK_TYPES[this.networkType].name;
        });
    }
    switchNetwork(network) {
        return __awaiter(this, void 0, void 0, function* () {
            if (constants_1.NETWORK_TYPES[constants_1.NetworkType.MAINNET].validNames.includes(network)) {
                this.networkType = constants_1.NetworkType.MAINNET;
            }
            else if (constants_1.NETWORK_TYPES[constants_1.NetworkType.TESTNET].validNames.includes(network)) {
                this.networkType = constants_1.NetworkType.TESTNET;
            }
            else {
                throw new Error(`the network is invalid, supported networks: ${constants_1.NETWORK_TYPES.map((v) => v.name).join(",")}`);
            }
            return this.getNetwork();
        });
    }
    getPublicKey() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.pubkey;
        });
    }
    getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                confirmed: 0,
                unconfirmed: 0,
                total: 0,
            };
        });
    }
    sendBitcoin(toAddress, satoshis) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("not implemented in abstract wallet");
        });
    }
    signMessage(text) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = "m/44'/0'/0'/0/0";
            const child = this.hdNode.derivePath(path);
            const ecpair = ECPair.fromPrivateKey(child.privateKey);
            const hash = bitcoin.crypto.sha256(Buffer.from(text));
            const signature = ecpair.sign(hash);
            return signature.toString('base64');
        });
    }
    signTx() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("not implemented in abstract wallet");
        });
    }
    pushTx() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("not implemented in abstract wallet");
        });
    }
    signPsbt(psbtHex, inputs) {
        return __awaiter(this, void 0, void 0, function* () {
            const psbtNetwork = (0, utils_1.toPsbtNetwork)(this.networkType);
            const psbt = bitcoin.Psbt.fromHex(psbtHex, { network: psbtNetwork });
            const currentAddress = (0, utils_1.publicKeyToAddress)(this.pubkey, this.addressType, this.networkType);
            if (!inputs) {
                const toSignInputs = [];
                psbt.data.inputs.forEach((v, index) => {
                    var _a;
                    const script = ((_a = v.witnessUtxo) === null || _a === void 0 ? void 0 : _a.script) || v.nonWitnessUtxo;
                    if (script) {
                        const address = bitcoin.address.fromOutputScript(script, psbtNetwork);
                        if (currentAddress === address) {
                            toSignInputs.push({
                                index,
                                publicKey: this.pubkey,
                            });
                        }
                    }
                });
                inputs = toSignInputs;
            }
            inputs.forEach(input => {
                const path = "m/44'/0'/0'/0/" + input.index; // or whatever BIP44 path you're using
                const child = this.hdNode.derivePath(path);
                psbt.signInput(input.index, child);
            });
            psbt.validateSignaturesOfAllInputs(utils_1.validator);
            psbt.finalizeAllInputs();
            return psbt.toHex();
        });
    }
    pushPsbtTx() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("not implemented in abstract wallet");
        });
    }
}
exports.Wallet = Wallet;
