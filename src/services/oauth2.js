/**
 * v1.42: OAuth2 Provider - Microsoft + Google
 *
 * Modern auth (XOAUTH2) - Outlook.com / Hotmail / Gmail için
 * Microsoft 2024 Eylül'den itibaren basic auth'u kapattı, OAuth2 zorunlu.
 *
 * PKCE flow (public client - secret yok):
 * 1. Code verifier + challenge oluştur
 * 2. BrowserWindow popup'ta authorize URL aç
 * 3. Redirect URL'sini izle, code yakala
 * 4. Code'u access_token + refresh_token'a çevir
 * 5. Refresh logic: süre dolunca refresh_token ile yenile
 *
 * KULLANICI: Azure Portal / Google Cloud Console'da "Public client / Native"
 * tipinde app kayıt edip CLIENT_ID'sini config'e yazmalı. Aksi halde flow başlamaz.
 */

const crypto = require('crypto');
const { BrowserWindow } = require('electron');
const https = require('https');
const url = require('url');

// =====================================================================
// CONFIG: Azure / Google'da app kayıt edilince doldurulur
// =====================================================================
// v1.44: Client ID'ler runtime'da appConfig'den dinamik okunabilir
let _appConfigRef = null;
function setAppConfig(config) { _appConfigRef = config; }
function getClientId(provider) {
  // Önce env, sonra config (UI üzerinden girilen)
  if (provider === 'microsoft') {
    return process.env.CODEGA_MS_CLIENT_ID || _appConfigRef?.get('oauth2MicrosoftClientId') || '';
  }
  if (provider === 'google') {
    return process.env.CODEGA_GOOGLE_CLIENT_ID || _appConfigRef?.get('oauth2GoogleClientId') || '';
  }
  return '';
}

const OAUTH_CONFIG = {
  microsoft: {
    get clientId() { return getClientId('microsoft'); },
    authority: 'https://login.microsoftonline.com/common',
    authorizeEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoEndpoint: 'https://graph.microsoft.com/v1.0/me',
    redirectUri: 'http://localhost:51842/callback',
    scopes: [
      'offline_access',
      'https://outlook.office.com/IMAP.AccessAsUser.All',
      'https://outlook.office.com/SMTP.Send',
      'User.Read'
    ],
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587
  },
  google: {
    get clientId() { return getClientId('google'); },
    authorizeEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
    redirectUri: 'http://localhost:51843/callback',
    scopes: [
      'https://mail.google.com/',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587
  }
};

function isProviderConfigured(provider) {
  return !!OAUTH_CONFIG[provider]?.clientId;
}

function getProviderConfig(provider) {
  return OAUTH_CONFIG[provider];
}

// =====================================================================
// PKCE Helper
// =====================================================================
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// =====================================================================
// HTTP POST helper (token endpoint için)
// =====================================================================
function httpPostForm(endpoint, formData) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(formData).toString();
    const u = new URL(endpoint);
    const req = https.request({
      method: 'POST',
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error_description || parsed.error || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error('Geçersiz token yanıtı: ' + data.slice(0, 100)));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpGetJson(endpoint, accessToken) {
  return new Promise((resolve, reject) => {
    const u = new URL(endpoint);
    const req = https.request({
      method: 'GET',
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
          else reject(new Error(parsed.error?.message || `HTTP ${res.statusCode}`));
        } catch (e) {
          reject(new Error('Geçersiz user info yanıtı'));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// =====================================================================
// Auth Flow - Ana fonksiyon
// =====================================================================

/**
 * OAuth2 login flow'unu başlat. Popup BrowserWindow açar.
 * @param {string} provider - 'microsoft' | 'google'
 * @returns {Promise<{accessToken, refreshToken, expiresAt, email, displayName, provider}>}
 */
async function startAuthFlow(provider) {
  const cfg = OAUTH_CONFIG[provider];
  if (!cfg) throw new Error('Bilinmeyen sağlayıcı: ' + provider);
  if (!cfg.clientId) {
    // v1.61: Daha açıklayıcı tanı mesajı
    const fromEnv = process.env[provider === 'microsoft' ? 'CODEGA_MS_CLIENT_ID' : 'CODEGA_GOOGLE_CLIENT_ID'];
    const fromConfig = _appConfigRef?.get(provider === 'microsoft' ? 'oauth2MicrosoftClientId' : 'oauth2GoogleClientId');
    const configReady = !!_appConfigRef;
    throw new Error(
      `Client ID bulunamadı.\n\n` +
      `Tanı:\n` +
      `  • Env variable: ${fromEnv ? 'VAR' : 'yok'}\n` +
      `  • Config'te değer: ${fromConfig ? '"' + fromConfig.slice(0, 8) + '..." (VAR)' : 'yok'}\n` +
      `  • Config bağlantısı: ${configReady ? 'OK' : 'BAĞLI DEĞİL (kritik bug)'}\n\n` +
      `Çözüm: OAuth2 Kurulum Sihirbazı'nda Client ID'yi yapıştır, KAYDET butonuna bas, sonra Test'e tekrar bas.`
    );
  }

  // PKCE
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString('hex');

  // Authorize URL
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    response_type: 'code',
    redirect_uri: cfg.redirectUri,
    scope: cfg.scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: provider === 'microsoft' ? 'select_account' : 'consent'
  });
  if (provider === 'google') {
    params.set('access_type', 'offline'); // refresh_token için
  }
  const authUrl = cfg.authorizeEndpoint + '?' + params.toString();

  // Loopback HTTP server başlat (redirect yakalamak için)
  const code = await openBrowserWindowAndCaptureCode(authUrl, cfg.redirectUri, state);

  // Code → Token
  const tokenForm = {
    client_id: cfg.clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: cfg.redirectUri,
    code_verifier: codeVerifier
  };
  const tokens = await httpPostForm(cfg.tokenEndpoint, tokenForm);

  if (!tokens.access_token) throw new Error('access_token alınamadı');

  // User info çek
  const userInfo = await httpGetJson(cfg.userInfoEndpoint, tokens.access_token);
  let email = '';
  let displayName = '';
  if (provider === 'microsoft') {
    email = userInfo.mail || userInfo.userPrincipalName || '';
    displayName = userInfo.displayName || '';
  } else {
    email = userInfo.email || '';
    displayName = userInfo.name || '';
  }

  return {
    provider,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    email,
    displayName,
    serverConfig: {
      imapHost: cfg.imapHost,
      imapPort: cfg.imapPort,
      smtpHost: cfg.smtpHost,
      smtpPort: cfg.smtpPort
    }
  };
}

/**
 * BrowserWindow popup aç + redirect URL'sinden code yakala
 */
function openBrowserWindowAndCaptureCode(authUrl, redirectUri, expectedState) {
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 520,
      height: 720,
      title: 'CODEGA Mail - Hesap Bağlantısı',
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    let resolved = false;

    // v1.60: Microsoft AADSTS hata kodlarını Türkçe açıkla
    function translateMicrosoftError(errorCode, errorDesc) {
      const lower = (errorCode + ' ' + errorDesc).toLowerCase();
      if (lower.includes('aadsts7000218') || lower.includes('public client flow')) {
        return 'Azure App\'inde "Allow public client flows" AÇIK değil!\n\nÇözüm: Azure Portal > App registration > Authentication > Aşağıda "Allow public client flows" → YES → Save';
      }
      if (lower.includes('aadsts500113') || lower.includes('no reply address')) {
        return 'Azure App\'inde Redirect URI tanımlanmamış!\n\nÇözüm: Azure Portal > Authentication > + Add a platform > Mobile and desktop applications > URI ekle: http://localhost:51842/callback';
      }
      if (lower.includes('aadsts50194') || lower.includes('not configured as a multi-tenant') || lower.includes('aadsts50020')) {
        return 'Azure App hesap tipi yanlış seçildi!\n\nKişisel Microsoft hesabı (outlook.com / hotmail) için:\nAzure Portal > Authentication > "Personal Microsoft accounts only" veya "Both organizational and personal" seçin.';
      }
      if (lower.includes('aadsts65001') || lower.includes('consent') || lower.includes('admin')) {
        return 'API izinleri için onay gerekli.\n\nÇözüm: Azure Portal > API permissions > "Grant admin consent for ..." butonuna basın (kişisel hesap için bu adım gerekmez, hesabı popup\'ta tekrar onaylayın).';
      }
      if (lower.includes('aadsts50011') || lower.includes('reply url mismatch')) {
        return 'Redirect URI EŞLEŞMİYOR!\n\nAzure\'a kayıtlı URI ile kodun beklediği farklı.\nKodun beklediği: http://localhost:51842/callback\n\nAzure Portal > Authentication > Redirect URIs altında bu adresin TAM AYNI olması gerekir.';
      }
      if (lower.includes('aadsts900971') || lower.includes('no reply')) {
        return 'Redirect URI eksik. Authentication > Mobile and desktop applications > http://localhost:51842/callback ekleyin.';
      }
      if (lower.includes('aadsts7000222')) {
        return 'Client secret kullanıyorsunuz ama PKCE flow lazım. Public client olarak kaydedin.';
      }
      if (lower.includes('invalid_client')) {
        return 'Client ID hatalı veya app silinmiş. Azure Portal > Overview > Application (client) ID alanını tekrar kopyalayın.';
      }
      return null; // Bilinmeyen hata
    }

    function handleNavigation(navUrl) {
      if (!navUrl || !navUrl.startsWith(redirectUri.split('?')[0])) return;
      try {
        const parsed = new URL(navUrl);
        const code = parsed.searchParams.get('code');
        const state = parsed.searchParams.get('state');
        const error = parsed.searchParams.get('error');
        const errorDesc = parsed.searchParams.get('error_description');

        if (error) {
          // v1.60: Türkçe açıklama
          const translated = translateMicrosoftError(error, errorDesc || '');
          const message = translated || `${error}: ${errorDesc || 'Bilinmeyen hata'}`;
          if (!resolved) { resolved = true; win.close(); reject(new Error(message)); }
          return;
        }
        if (state !== expectedState) {
          if (!resolved) { resolved = true; win.close(); reject(new Error('State eşleşmedi (CSRF koruması)')); }
          return;
        }
        if (code) {
          if (!resolved) { resolved = true; win.close(); resolve(code); }
        }
      } catch (e) {
        if (!resolved) { resolved = true; win.close(); reject(e); }
      }
    }

    win.webContents.on('will-redirect', (_, navUrl) => handleNavigation(navUrl));
    win.webContents.on('will-navigate', (_, navUrl) => handleNavigation(navUrl));
    win.webContents.on('did-navigate', (_, navUrl) => handleNavigation(navUrl));

    // v1.60: Sayfa yüklenemezse (network/DNS hatası) yakala
    win.webContents.on('did-fail-load', (_, errorCode, errorDesc, validatedURL) => {
      if (errorCode === -3) return; // -3 = aborted (redirect sırasında normal)
      if (!resolved && !validatedURL.startsWith(redirectUri.split('?')[0])) {
        resolved = true;
        win.close();
        reject(new Error(`Sayfa yüklenemedi: ${errorDesc} (${errorCode})`));
      }
    });

    win.on('closed', () => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Pencere kapatıldı, giriş tamamlanmadı'));
      }
    });

    win.loadURL(authUrl).catch(reject);
  });
}

/**
 * Refresh token ile access token yenile
 */
async function refreshAccessToken(provider, refreshToken) {
  const cfg = OAUTH_CONFIG[provider];
  if (!cfg) throw new Error('Bilinmeyen sağlayıcı');
  if (!cfg.clientId) throw new Error('Sağlayıcı yapılandırılmamış');
  if (!refreshToken) throw new Error('Refresh token yok - yeniden giriş gerekli');

  const form = {
    client_id: cfg.clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: cfg.scopes.join(' ')
  };
  const tokens = await httpPostForm(cfg.tokenEndpoint, form);
  if (!tokens.access_token) throw new Error('Token yenilenemedi');

  return {
    accessToken: tokens.access_token,
    // Microsoft refresh_token rotation yapar, Google genelde aynı kalır
    refreshToken: tokens.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()
  };
}

/**
 * XOAUTH2 SASL auth string oluştur (IMAP/SMTP için)
 */
function buildXOAuth2Token(email, accessToken) {
  const auth = `user=${email}\x01auth=Bearer ${accessToken}\x01\x01`;
  return Buffer.from(auth, 'utf8').toString('base64');
}

module.exports = {
  setAppConfig,
  startAuthFlow,
  refreshAccessToken,
  buildXOAuth2Token,
  isProviderConfigured,
  getProviderConfig,
  OAUTH_CONFIG
};
