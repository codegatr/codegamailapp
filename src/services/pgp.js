/**
 * PGP Servisi - v1.25
 * OpenPGP.js (RFC 4880) ile uçtan uca şifreleme/imzalama
 *
 * Anahtarlar:
 * - User key pair (private + public) - kullanıcının kendi anahtarı
 * - Contact public keys - diğer kişilerin public key'leri
 *
 * İşlemler:
 * - Şifrele (encrypt): alıcının public key'i ile
 * - Şifre Çöz (decrypt): kendi private key'i ile + passphrase
 * - İmzala (sign): kendi private key'i ile + passphrase
 * - Doğrula (verify): gönderenin public key'i ile
 */

let openpgp = null;
function getOpenPGP() {
  if (!openpgp) {
    try { openpgp = require('openpgp'); }
    catch (e) {
      throw new Error('OpenPGP yüklenemedi: ' + e.message);
    }
  }
  return openpgp;
}

class PGPService {
  /**
   * Yeni anahtar çifti üret
   * @param {string} name - Kullanıcı adı
   * @param {string} email - E-posta
   * @param {string} passphrase - Private key şifresi
   * @returns {Promise<{publicKey, privateKey, fingerprint}>}
   */
  static async generateKeyPair(name, email, passphrase) {
    const pgp = getOpenPGP();
    const { privateKey, publicKey } = await pgp.generateKey({
      type: 'ecc',
      curve: 'curve25519',
      userIDs: [{ name: name || email, email: email }],
      passphrase: passphrase,
      format: 'armored'
    });

    // Fingerprint çıkar
    const keyObj = await pgp.readKey({ armoredKey: publicKey });
    const fingerprint = keyObj.getFingerprint().toUpperCase();

    return {
      publicKey,    // ASCII-armored public key
      privateKey,   // ASCII-armored private key (passphrase ile şifreli)
      fingerprint,
      keyId: keyObj.getKeyID().toHex().toUpperCase(),
      userIDs: keyObj.getUserIDs(),
      created: keyObj.getCreationTime().toISOString()
    };
  }

  /**
   * Public key bilgilerini oku (parse)
   */
  static async readPublicKey(armoredKey) {
    const pgp = getOpenPGP();
    const key = await pgp.readKey({ armoredKey });
    return {
      fingerprint: key.getFingerprint().toUpperCase(),
      keyId: key.getKeyID().toHex().toUpperCase(),
      userIDs: key.getUserIDs(),
      created: key.getCreationTime().toISOString(),
      armored: armoredKey
    };
  }

  /**
   * Mesajı şifrele (recipientPublicKeys + opsiyonel imzalama)
   */
  static async encryptMessage(plainText, recipientArmoredKeys, signingPrivateKey = null, signingPassphrase = '') {
    const pgp = getOpenPGP();

    // Public key'leri oku
    const publicKeys = await Promise.all(
      recipientArmoredKeys.map(k => pgp.readKey({ armoredKey: k }))
    );

    let signingKey = null;
    if (signingPrivateKey) {
      signingKey = await pgp.decryptKey({
        privateKey: await pgp.readPrivateKey({ armoredKey: signingPrivateKey }),
        passphrase: signingPassphrase
      });
    }

    const message = await pgp.createMessage({ text: plainText });
    const encrypted = await pgp.encrypt({
      message,
      encryptionKeys: publicKeys,
      signingKeys: signingKey || undefined,
      format: 'armored'
    });

    return encrypted; // ASCII-armored PGP MESSAGE BLOCK
  }

  /**
   * Şifreli mesajı çöz (private key + passphrase)
   * Eğer mesaj imzalı ise, signing key ile doğrula
   */
  static async decryptMessage(armoredMessage, privateArmoredKey, passphrase, senderPublicKeys = []) {
    const pgp = getOpenPGP();

    const privateKey = await pgp.decryptKey({
      privateKey: await pgp.readPrivateKey({ armoredKey: privateArmoredKey }),
      passphrase: passphrase
    });

    const message = await pgp.readMessage({ armoredMessage });

    let verificationKeys = undefined;
    if (senderPublicKeys && senderPublicKeys.length) {
      verificationKeys = await Promise.all(
        senderPublicKeys.map(k => pgp.readKey({ armoredKey: k }))
      );
    }

    const { data, signatures } = await pgp.decrypt({
      message,
      decryptionKeys: privateKey,
      verificationKeys,
      format: 'utf8'
    });

    let verified = null;
    if (signatures && signatures.length) {
      try {
        await signatures[0].verified;
        verified = { ok: true, keyId: signatures[0].keyID.toHex().toUpperCase() };
      } catch (e) {
        verified = { ok: false, error: e.message };
      }
    }

    return { decryptedText: data, verified };
  }

  /**
   * Mesajı sadece imzala (clearsign - okunabilir + imza)
   */
  static async signMessage(plainText, privateArmoredKey, passphrase) {
    const pgp = getOpenPGP();
    const privateKey = await pgp.decryptKey({
      privateKey: await pgp.readPrivateKey({ armoredKey: privateArmoredKey }),
      passphrase: passphrase
    });
    const message = await pgp.createCleartextMessage({ text: plainText });
    const signed = await pgp.sign({
      message,
      signingKeys: privateKey,
      format: 'armored'
    });
    return signed;
  }

  /**
   * İmzalı clearsigned mesajı doğrula
   */
  static async verifySignedMessage(armoredCleartextMessage, senderArmoredKey) {
    const pgp = getOpenPGP();
    const senderKey = await pgp.readKey({ armoredKey: senderArmoredKey });
    const message = await pgp.readCleartextMessage({ cleartextMessage: armoredCleartextMessage });
    const verifyResult = await pgp.verify({
      message,
      verificationKeys: senderKey
    });
    try {
      await verifyResult.signatures[0].verified;
      return { ok: true, text: verifyResult.data, keyId: verifyResult.signatures[0].keyID.toHex().toUpperCase() };
    } catch (e) {
      return { ok: false, error: e.message, text: verifyResult.data };
    }
  }

  /**
   * Mesaj body'sinde PGP MESSAGE BLOCK var mı kontrol
   */
  static detectPgpInBody(text) {
    if (!text) return null;
    if (text.includes('-----BEGIN PGP MESSAGE-----') && text.includes('-----END PGP MESSAGE-----')) {
      return 'encrypted';
    }
    if (text.includes('-----BEGIN PGP SIGNED MESSAGE-----') && text.includes('-----END PGP SIGNATURE-----')) {
      return 'signed';
    }
    return null;
  }

  /**
   * Body'den PGP MESSAGE BLOCK'unu çıkar (HTML/text karışık olsa bile)
   */
  static extractPgpBlock(text, type = 'encrypted') {
    if (!text) return null;
    if (type === 'encrypted') {
      const m = text.match(/-----BEGIN PGP MESSAGE-----[\s\S]*?-----END PGP MESSAGE-----/);
      return m ? m[0] : null;
    } else {
      const m = text.match(/-----BEGIN PGP SIGNED MESSAGE-----[\s\S]*?-----END PGP SIGNATURE-----/);
      return m ? m[0] : null;
    }
  }
}

module.exports = PGPService;
