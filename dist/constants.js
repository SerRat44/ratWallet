"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NETWORK_TYPES = exports.NetworkType = exports.AddressType = void 0;
var AddressType;
(function (AddressType) {
    AddressType[AddressType["P2PKH"] = 0] = "P2PKH";
    AddressType[AddressType["P2WPKH"] = 1] = "P2WPKH";
    AddressType[AddressType["P2TR"] = 2] = "P2TR";
})(AddressType || (exports.AddressType = AddressType = {}));
var NetworkType;
(function (NetworkType) {
    NetworkType[NetworkType["MAINNET"] = 0] = "MAINNET";
    NetworkType[NetworkType["TESTNET"] = 1] = "TESTNET";
})(NetworkType || (exports.NetworkType = NetworkType = {}));
exports.NETWORK_TYPES = [
    {
        value: NetworkType.MAINNET,
        label: "LIVENET",
        name: "livenet",
        validNames: [0, "livenet", "mainnet", "bitcoin"],
    },
    {
        value: NetworkType.TESTNET,
        label: "TESTNET",
        name: "testnet",
        validNames: ["testnet"],
    },
];
