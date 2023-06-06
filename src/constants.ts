export enum AddressType {
  P2PKH,
  P2WPKH,
  P2TR,
}

export enum NetworkType {
  MAINNET,
  TESTNET,
}

export const NETWORK_TYPES = [
  {
    value: NetworkType.MAINNET,
    label: "MAINNET",
    name: "mainnet",
    validNames: [0, "livenet", "mainnet", "bitcoin"],
  },
  {
    value: NetworkType.TESTNET,
    label: "TESTNET",
    name: "testnet",
    validNames: ["testnet"],
  },
];
