import * as bip39 from 'bip39';
import * as cryptojs from 'crypto-js';

const keyTools = {
  generateNewMnemonic(): string {
    return bip39.generateMnemonic();
  },

  restoreSeedFromMnemonic(mnemonic: string): string {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error("Invalid mnemonic");
    }
  
    return bip39.mnemonicToSeedSync(mnemonic).toString('hex');
  },

  encryptString(text: string, password: string): string {
    return cryptojs.AES.encrypt(text, password).toString();
  },

  decryptString(ciphertext: string, password: string): string {
    const bytes = cryptojs.AES.decrypt(ciphertext, password);
    const decryptedString = bytes.toString(cryptojs.enc.Utf8);
    return decryptedString;
  }
};

export default keyTools;