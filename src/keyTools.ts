import * as bip39 from 'bip39';
import CryptoJS from 'crypto-js';
import idb from 'idb';
import * as ecc from "tiny-secp256k1";
import { BIP32Factory, BIP32Interface } from 'bip32';
const bip32 = BIP32Factory(ecc);

class InvalidMnemonicError extends Error {
  constructor() {
    super(`Invalid mnemonic`);
    this.name = 'InvalidMnemonicError';
  }
}

const keyTools = {
  

  encryptString(text: string, password: string): string {
    return CryptoJS.AES.encrypt(text, password).toString();
  },

  decryptString(ciphertext: string, password: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedString;
  },
  
  async storeIDB(data: string, key: string) {
  const db = await idb.openDB('wallet', 1, {
    upgrade(db) {
      db.createObjectStore('secrets');
    },
  });
  await db.put('secrets', data, key);
},

async getIDB(key: string) {
  const db = await idb.openDB('wallet', 1);
  return await db.get('secrets', key);
},

async clearIDB() {
    await idb.deleteDB('wallet');
  },
  
  
  generateNewMnemonic(network: any, password: string) {
	 
	  const mnemonic = bip39.generateMnemonic();
      this.restoreFromMnemonic(mnemonic, password, network);
	  
  },

  async restoreFromMnemonic(mnemonic: string, password: string, network: any) {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new InvalidMnemonicError();
  }
  
  const seed = bip39.mnemonicToSeedSync(mnemonic).toString('hex');
  const hdnode = bip32.fromSeed(Buffer.from(seed, 'hex'), network);
    
  const encryptedMnemonic = this.encryptString(mnemonic, password);
  await this.storeIDB(encryptedMnemonic, 'mnemonic');
  
  if (hdnode.privateKey) {
    const encryptedSeed = this.encryptString(hdnode.privateKey.toString('hex'), password);
    await this.storeIDB(encryptedSeed, 'masterKey');
  } else {
    throw new Error('Private key is undefined');
  }
},
  
  async getHDNode(password: string, network: any): Promise<BIP32Interface> {
  const encryptedSeed = await this.getIDB('masterKey');
  const seed = this.decryptString(encryptedSeed, password);
  const hdNode = bip32.fromSeed(Buffer.from(seed, 'hex'), network);
  return hdNode;
},
  
  
  
  
};

export default keyTools;