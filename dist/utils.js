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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPsbtNetwork = exports.publicKeyToAddress = exports.validator = exports.tweakSigner = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const ecc = __importStar(require("tiny-secp256k1"));
bitcoin.initEccLib(ecc);
const ecpair_1 = __importDefault(require("ecpair"));
const constants_1 = require("./constants");
const ECPair = (0, ecpair_1.default)(ecc);
const toXOnly = (pubKey) => pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);
function tapTweakHash(pubKey, h) {
    return bitcoin.crypto.taggedHash("TapTweak", Buffer.concat(h ? [pubKey, h] : [pubKey]));
}
function tweakSigner(signer, opts = {}) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let privateKey = signer.privateKey;
    if (!privateKey) {
        throw new Error("Private key is required for tweaking signer!");
    }
    if (signer.publicKey[0] === 3) {
        privateKey = ecc.privateNegate(privateKey);
    }
    const tweakedPrivateKey = ecc.privateAdd(privateKey, tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash));
    if (!tweakedPrivateKey) {
        throw new Error("Invalid tweaked private key!");
    }
    return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
        network: opts.network,
    });
}
exports.tweakSigner = tweakSigner;
const validator = (pubkey, msghash, signature) => ECPair.fromPublicKey(pubkey).verify(msghash, signature);
exports.validator = validator;
function publicKeyToAddress(publicKey, type, networkType) {
    const network = toPsbtNetwork(networkType);
    if (!publicKey)
        return "";
    const pubkey = Buffer.from(publicKey, "hex");
    if (type === constants_1.AddressType.P2PKH) {
        const { address } = bitcoin.payments.p2pkh({
            pubkey,
            network,
        });
        return address || "";
    }
    else if (type === constants_1.AddressType.P2WPKH) {
        const { address } = bitcoin.payments.p2wpkh({
            pubkey,
            network,
        });
        return address || "";
    }
    else if (type === constants_1.AddressType.P2TR) {
        const { address } = bitcoin.payments.p2tr({
            pubkey: pubkey.slice(1, 33),
            network,
        });
        return address || "";
    }
    else {
        return "";
    }
}
exports.publicKeyToAddress = publicKeyToAddress;
function toPsbtNetwork(networkType) {
    if (networkType === constants_1.NetworkType.MAINNET) {
        return bitcoin.networks.bitcoin;
    }
    else {
        return bitcoin.networks.testnet;
    }
}
exports.toPsbtNetwork = toPsbtNetwork;
