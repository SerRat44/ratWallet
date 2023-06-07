import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
bitcoin.initEccLib(ecc);
import ECPairFactory from "ecpair";
import { publicKeyToAddress, toPsbtNetwork, validator } from "./utils";
import { AddressType, NetworkType, NETWORK_TYPES } from "./constants";
import { nodeManager } from './nodeManager';
const ECPair = ECPairFactory(ecc);
import { BIP32Factory, BIP32Interface } from 'bip32';
const bip32 = BIP32Factory(ecc)

class InvalidAccountIndexError extends Error {
  constructor(index: number) {
    super(`Invalid account index: ${index}`);
    this.name = 'InvalidAccountIndexError';
  }
}

class noNodeManagerError extends Error {
	constructor() {
		super(`No node manager set`);
		this.name = 'noNodeManagerError';
	}	
}

export interface ToSignInput {
  index: number;
  publicKey: string;
  sighashTypes?: number[];
}

export class Wallet {
  private hdNode: BIP32Interface;
  private addressType: AddressType;
  private networkType: NetworkType;
  private nodeManager?: nodeManager;
  private pubkey: string;
  private accountIndex: number = 0;

  constructor(seed: string, networkType: NetworkType, addressType: AddressType) {
    const network = toPsbtNetwork(networkType);
    this.hdNode = bip32.fromSeed(Buffer.from(seed, 'hex'), network);
    this.networkType = networkType;
    this.addressType = addressType;
    this.pubkey = this.hdNode.publicKey.toString('hex');
  }
  
  setNodeManager(nodeManager: nodeManager) {
    this.nodeManager = nodeManager;
  }
  
  removeNodeManager(){
	  this.nodeManager = undefined;
  }
  
  async getAccountIndex() {
	  return this.accountIndex;
  }
  
   async nextAccount() {
    if (this.accountIndex < 2147483647) {
      this.accountIndex += 1;
    } else {
      throw new InvalidAccountIndexError(this.accountIndex + 1);
    }
    return this.getAccount();
  }

  async previousAccount() {
    if (this.accountIndex > 0) {
      this.accountIndex -= 1;
    } else {
      throw new InvalidAccountIndexError(this.accountIndex - 1);
    }
    return this.getAccount();
  }

  async setAccountIndex(index: number) {
    if (index >= 0 && index <= 2147483647) {
      this.accountIndex = index;
    } else {
      throw new InvalidAccountIndexError(index);
    }
    return this.getAccount();
  }
  
  async getAccount() {
    const path = `m/44'/0'/0'/${this.accountIndex}/0`;
    const child = this.hdNode.derivePath(path);
    const address = publicKeyToAddress(
        child.publicKey.toString("hex"),
        this.addressType,
        this.networkType
    );
    return address;
  }

  async getNetwork() {
    return NETWORK_TYPES[this.networkType].name;
  }

  async switchNetwork(network: string) {
    if (NETWORK_TYPES[NetworkType.MAINNET].validNames.includes(network)) {
      this.networkType = NetworkType.MAINNET;
    } else if (
      NETWORK_TYPES[NetworkType.TESTNET].validNames.includes(network)
    ) {
      this.networkType = NetworkType.TESTNET;
    } else {
      throw new Error(
        `the network is invalid, supported networks: ${NETWORK_TYPES.map(
          (v) => v.name
        ).join(",")}`
      );
    }
    return this.getNetwork();
  }

  getPublicKey() {
    return this.pubkey;
  }

  async getBalance() {
    if (!this.nodeManager) {
      throw new noNodeManagerError();
    }
    
    const address = await this.getAccount();
	const request = this.nodeManager.createRequest('getbalance', [address]);
    const balance = await this.nodeManager.sendRequest(request);
    return balance;
  }

  async sendBitcoin(toAddress: string, satoshis: number) {
    if (!this.nodeManager) {
      throw new noNodeManagerError();
    }
    
	const request = this.nodeManager.createRequest('sendtoaddress', [toAddress, satoshis]);
    const txid = await this.nodeManager.sendRequest(request);
    return txid;
  }

  async signMessage(text: string) {
    const path = `m/44'/0'/0'/${this.accountIndex}/0`;
    const child = this.hdNode.derivePath(path);
    const ecpair = ECPair.fromPrivateKey(child.privateKey!);
    const hash = bitcoin.crypto.sha256(Buffer.from(text));
    const signature = ecpair.sign(hash);
    return signature.toString('base64');
  }

  async signTx() {
    throw new Error("not implemented");
  }

  async pushTx() {
    throw new Error("not implemented");
  }

  async signPsbt(psbtHex: string, inputs?: ToSignInput[]) {
    const psbtNetwork = toPsbtNetwork(this.networkType);
    const psbt = bitcoin.Psbt.fromHex(psbtHex, { network: psbtNetwork });
    const currentAddress = publicKeyToAddress(
      this.pubkey,
      this.addressType,
      this.networkType
    );
    if (!inputs) {
      const toSignInputs: ToSignInput[] = [];
      psbt.data.inputs.forEach((v, index) => {
        const script = v.witnessUtxo?.script || v.nonWitnessUtxo;
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
      const path = `m/44'/0'/0'/${this.accountIndex}/0`;
      const child = this.hdNode.derivePath(path);
      psbt.signInput(input.index, child);
    });
    psbt.validateSignaturesOfAllInputs(validator);
    psbt.finalizeAllInputs();
    return psbt.toHex();
  }

  async pushPsbtTx() {
    throw new Error("not implemented");
  }
  
 
}
