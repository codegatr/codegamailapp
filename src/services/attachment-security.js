/**
 * AttachmentSecurity - Tehlikeli ek dosya tespit sistemi
 * Endüstri standardı uzantı kategorileri
 */
class AttachmentSecurity {
  static EXTENSIONS = {
    // Doğrudan çalıştırılabilir - KRİTİK
    executable: [
      'exe', 'scr', 'com', 'pif', 'msi', 'msp', 'mst', 'app', 'dmg',
      'gadget', 'cpl', 'inf', 'reg', 'lnk', 'url', 'hta', 'sct',
      'jse', 'shs', 'shb', 'wsh', 'wsf', 'wsc'
    ],
    // Script - YÜKSEK risk
    script: [
      'bat', 'cmd', 'vbs', 'vbe', 'js', 'ps1', 'psm1', 'ps2', 'psc1',
      'py', 'pyw', 'pl', 'rb', 'sh', 'php', 'asp', 'aspx', 'cgi'
    ],
    // Java - YÜKSEK risk (sandbox kaçabilir)
    java: ['jar', 'class', 'jnlp'],
    // Arşiv - DİKKAT (içinde executable olabilir)
    archive: [
      'rar', 'zip', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz',
      'iso', 'img', 'cab', 'arj', 'ace', 'lzh', 'lha'
    ],
    // Office macro içerebilir - YÜKSEK risk
    macro: [
      'docm', 'dotm', 'xlsm', 'xltm', 'xlsb', 'xlam',
      'pptm', 'potm', 'ppsm', 'sldm'
    ],
    // Eski Office (macro destekler)
    legacyOffice: ['doc', 'xls', 'ppt'],
    // Genelde güvenli ama embedded içerik olabilir
    document: ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'csv', 'rtf', 'odt', 'ods'],
    image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif'],
    // SVG XSS riski içerebilir
    svg: ['svg', 'svgz'],
    media: ['mp3', 'mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'ogg', 'wav', 'flac']
  };

  /**
   * Dosya adını analiz eder, tehdit seviyesini döner
   * @param {string} filename
   * @param {boolean} senderTrusted - Gönderici güvenilir senders'ta mı?
   * @returns {object} { risk, category, warning, requireConfirmation, canOpen }
   */
  static analyze(filename, senderTrusted = false) {
    const lower = String(filename || '').trim().toLowerCase();
    if (!lower) return { risk: 'safe', category: 'unknown', canOpen: true };

    const parts = lower.split('.');
    const ext = parts[parts.length - 1] || '';
    const beforeExt = parts.length >= 3 ? parts[parts.length - 2] : null;

    // Çift uzantı saldırısı: invoice.pdf.exe, photo.jpg.scr
    if (beforeExt && this._isExecutableLike(ext) &&
        [...this.EXTENSIONS.document, ...this.EXTENSIONS.image, ...this.EXTENSIONS.media].includes(beforeExt)) {
      return {
        risk: 'critical',
        category: 'double_extension',
        warning: `🚨 ÇOK TEHLİKELİ — Bu dosya çift uzantılı (.${beforeExt}.${ext}). Görünüşte ${beforeExt.toUpperCase()} ama gerçekte ${ext.toUpperCase()} çalıştırılabilir. Bu klasik bir VİRÜS / ZARARLI YAZILIM hilesidir. AÇMAYIN.`,
        requireConfirmation: true,
        canOpen: false,
        ext, beforeExt
      };
    }

    // Direkt çalıştırılabilir
    if (this.EXTENSIONS.executable.includes(ext)) {
      return {
        risk: 'critical',
        category: 'executable',
        warning: `🚨 KRİTİK — Çalıştırılabilir dosya (.${ext}). Açtığınızda bilgisayarınızda program çalıştırır. ${senderTrusted ? '' : 'GÖNDERİCİ TANIMIYOR! '}Virüs/zararlı yazılım olabilir. AÇMAYIN.`,
        requireConfirmation: true,
        canOpen: false,
        ext
      };
    }

    // Script
    if (this.EXTENSIONS.script.includes(ext)) {
      return {
        risk: 'critical',
        category: 'script',
        warning: `⚠️ TEHLİKELİ — Script dosyası (.${ext}). Çalıştırılırsa sistem komutları yürütebilir. ${senderTrusted ? '' : 'TANIMADIĞINIZ GÖNDERİCİDEN! '}AÇMAYIN.`,
        requireConfirmation: true,
        canOpen: false,
        ext
      };
    }

    // Java
    if (this.EXTENSIONS.java.includes(ext)) {
      return {
        risk: 'high',
        category: 'java',
        warning: `⚠️ DİKKAT — Java dosyası (.${ext}). Sandbox dışına çıkabilir. Sadece güvendiğiniz kişilerden açın.`,
        requireConfirmation: true,
        canOpen: false,
        ext
      };
    }

    // Arşiv
    if (this.EXTENSIONS.archive.includes(ext)) {
      return {
        risk: senderTrusted ? 'medium' : 'high',
        category: 'archive',
        warning: `⚠️ ARŞİV DOSYASI (.${ext}) — İçinde virüs/zararlı yazılım olabilir. Antivirüs ile taranmasını öneririz. ${senderTrusted ? 'Gönderici güvenilir listede.' : 'TANIMADIĞINIZ KİŞİDEN GELEN ARŞİVLERİ AÇMAYIN.'}`,
        requireConfirmation: true,
        canOpen: senderTrusted,
        ext
      };
    }

    // Office macro içeren
    if (this.EXTENSIONS.macro.includes(ext)) {
      return {
        risk: 'high',
        category: 'macro',
        warning: `⚠️ MAKRO İÇEREN OFİS DOSYASI (.${ext}) — Açarken **MAKROLARI ETKİNLEŞTİRMEYİN**. Makrolar fidye yazılımı kurabilir. ${senderTrusted ? '' : 'Tanımadığınız bir kişiden gelen bu dosya çok şüpheli.'}`,
        requireConfirmation: true,
        canOpen: senderTrusted,
        ext
      };
    }

    // Eski Office formatları
    if (this.EXTENSIONS.legacyOffice.includes(ext)) {
      return {
        risk: senderTrusted ? 'low' : 'medium',
        category: 'legacy_office',
        warning: `Eski Office formatı (.${ext}). Makro içerebilir, açarken makro etkinleştirme isterse REDDEDİN.`,
        requireConfirmation: !senderTrusted,
        canOpen: true,
        ext
      };
    }

    // SVG
    if (this.EXTENSIONS.svg.includes(ext)) {
      return {
        risk: 'medium',
        category: 'svg',
        warning: `SVG dosyası — JavaScript içerebilir (XSS). Tarayıcıda açmayın, görüntüleyici kullanın.`,
        requireConfirmation: !senderTrusted,
        canOpen: true,
        ext
      };
    }

    // PDF (en çok exploit edilen format)
    if (ext === 'pdf') {
      return {
        risk: senderTrusted ? 'safe' : 'low',
        category: 'pdf',
        warning: senderTrusted ? null : 'PDF — Tanımadığınız kişiden geldiyse JavaScript içerip içermediğine dikkat. Adobe Reader güncel olsun.',
        requireConfirmation: false,
        canOpen: true,
        ext
      };
    }

    // Modern Office (XLSX, DOCX, PPTX) - genelde güvenli ama
    if (this.EXTENSIONS.document.includes(ext)) {
      return {
        risk: 'safe',
        category: 'document',
        warning: null,
        canOpen: true,
        ext
      };
    }

    // Görsel/Medya - güvenli
    if (this.EXTENSIONS.image.includes(ext) || this.EXTENSIONS.media.includes(ext)) {
      return { risk: 'safe', category: 'media', canOpen: true, ext };
    }

    // Bilinmeyen uzantı
    return {
      risk: 'low',
      category: 'unknown',
      warning: `Bilinmeyen dosya türü (.${ext}). Açmadan önce ne olduğundan emin olun.`,
      requireConfirmation: !senderTrusted,
      canOpen: true,
      ext
    };
  }

  static _isExecutableLike(ext) {
    return this.EXTENSIONS.executable.includes(ext) ||
           this.EXTENSIONS.script.includes(ext) ||
           this.EXTENSIONS.java.includes(ext);
  }

  /**
   * Mesajdaki tüm ek dosyaları analiz et, en yüksek riski dön
   */
  static analyzeAttachments(attachments, senderTrusted = false) {
    if (!attachments || !attachments.length) return { hasAttachments: false, maxRisk: 'safe' };
    const results = attachments.map(a => Object.assign(this.analyze(a.filename, senderTrusted), {
      filename: a.filename, size: a.size
    }));
    const riskOrder = ['safe', 'low', 'medium', 'high', 'critical'];
    let maxRisk = 'safe';
    for (const r of results) {
      if (riskOrder.indexOf(r.risk) > riskOrder.indexOf(maxRisk)) maxRisk = r.risk;
    }
    return {
      hasAttachments: true,
      maxRisk,
      results,
      dangerousCount: results.filter(r => r.risk === 'critical' || r.risk === 'high').length
    };
  }
}

module.exports = AttachmentSecurity;
