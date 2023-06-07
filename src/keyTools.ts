import * as bip39 from 'bip39';
import CryptoJS from 'crypto-js';

class InvalidMnemonicError extends Error {
  constructor() {
    super(`Invalid mnemonic`);
    this.name = 'InvalidMnemonicError';
  }
}

const keyTools = {
  generateNewMnemonic(): string {
    return bip39.generateMnemonic();
  },

  restoreSeedFromMnemonic(mnemonic: string): string {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new InvalidMnemonicError();
    }
  
    return bip39.mnemonicToSeedSync(mnemonic).toString('hex');
  },

  encryptString(text: string, password: string): string {
    return CryptoJS.AES.encrypt(text, password).toString();
  },

  decryptString(ciphertext: string, password: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedString;
  }
};

export default keyTools;