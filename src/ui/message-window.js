// v1.32: Ayrı mesaj penceresi renderer
(async function () {
  const params = new URLSearchParams(window.location.search);
  const messageId = parseInt(params.get('id'), 10);

  // Tema'yı uygula (ayrı pencere de tema'yı paylaşır)
  try {
    const cfg = await window.api.config.get();
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark');
    let theme = cfg.theme || 'dark';
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    html.classList.add('theme-' + theme);
    if (cfg.accentColor) {
      html.style.setProperty('--primary', cfg.accentColor);
      const r = parseInt(cfg.accentColor.slice(1, 3), 16);
      const g = parseInt(cfg.accentColor.slice(3, 5), 16);
      const b = parseInt(cfg.accentColor.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      html.style.setProperty('--primary-text', brightness > 155 ? '#1a1a1a' : '#ffffff');
    }
  } catch (_) {}

  if (!messageId || isNaN(messageId)) {
    document.getElementById('mwContent').innerHTML = '<div class="mw-loading">❌ Geçersiz mesaj ID</div>';
    return;
  }

  let currentMessage = null;
  try {
    currentMessage = await window.api.messages.get(messageId);
  } catch (e) {
    document.getElementById('mwContent').innerHTML = '<div class="mw-loading">❌ Mesaj yüklenemedi: ' + e.message + '</div>';
    return;
  }

  if (!currentMessage) {
    document.getElementById('mwContent').innerHTML = '<div class="mw-loading">❌ Mesaj bulunamadı</div>';
    return;
  }

  // Okundu işaretle
  if (!currentMessage.is_read) {
    try { await window.api.messages.markRead(messageId, true); } catch (_) {}
  }

  // Title güncelle
  document.title = (currentMessage.subject || '(Konusuz)') + ' — CODEGA Mail';

  // Account info
  try {
    const accs = await window.api.accounts.list();
    const acc = accs.find(a => a.id === currentMessage.account_id);
    if (acc) {
      document.getElementById('mwAccount').textContent = `${acc.display_name} (${acc.email})`;
    }
  } catch (_) {}

  renderMessage(currentMessage);
  bindActions(currentMessage);

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDate(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleString('tr-TR'); } catch (_) { return String(d); }
  }

  function renderMessage(msg) {
    const fromHtml = msg.from_name
      ? `<strong>${escapeHtml(msg.from_name)}</strong> &lt;${escapeHtml(msg.from_addr || '')}&gt;`
      : escapeHtml(msg.from_addr || '');
    const toHtml = escapeHtml(msg.to_addrs || '');
    const ccHtml = msg.cc_addrs ? `<div style="grid-column:1/-1;display:grid;grid-template-columns:70px 1fr;gap:6px 14px;"><div class="mw-meta-label">Cc:</div><div>${escapeHtml(msg.cc_addrs)}</div></div>` : '';

    let bodyHtml;
    if (msg.body_html && msg.body_html.trim()) {
      // HTML body - sandboxed iframe
      bodyHtml = `<iframe srcdoc="${escapeHtml(msg.body_html)}" sandbox="allow-same-origin" style="width:100%;min-height:400px;border:none;" id="mwBodyIframe"></iframe>`;
    } else {
      bodyHtml = `<pre style="white-space:pre-wrap;word-break:break-word;font-family:inherit;">${escapeHtml(msg.body_text || '(boş)')}</pre>`;
    }

    let attachmentsHtml = '';
    if (msg.attachments && msg.attachments.length) {
      attachmentsHtml = `
        <div class="mw-attachments">
          <strong>📎 ${msg.attachments.length} ek dosya:</strong>
          ${msg.attachments.map(a => `
            <div class="mw-attachment-item">
              <span>📄</span>
              <span style="flex:1;">${escapeHtml(a.filename || 'dosya')}</span>
              <span style="color:var(--muted);">${a.size ? (a.size / 1024).toFixed(1) + ' KB' : ''}</span>
            </div>
          `).join('')}
          <small style="color:var(--muted);display:block;margin-top:8px;">Ekleri indirmek için ana pencerede aç.</small>
        </div>
      `;
    }

    document.getElementById('mwContent').innerHTML = `
      <div class="mw-subject">${escapeHtml(msg.subject || '(Konusuz)')}</div>
      <div class="mw-meta">
        <div class="mw-meta-label">Kimden:</div><div>${fromHtml}</div>
        <div class="mw-meta-label">Kime:</div><div>${toHtml}</div>
        ${ccHtml}
        <div class="mw-meta-label">Tarih:</div><div>${formatDate(msg.date)}</div>
      </div>
      <div class="mw-body">${bodyHtml}</div>
      ${attachmentsHtml}
    `;

    // iframe içeriğini auto-resize
    const iframe = document.getElementById('mwBodyIframe');
    if (iframe) {
      iframe.onload = () => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          // Tema renklerini iframe içine de uygula
          const styles = window.getComputedStyle(document.documentElement);
          const bgColor = styles.getPropertyValue('--bg').trim();
          const textColor = styles.getPropertyValue('--text').trim();
          const styleEl = doc.createElement('style');
          styleEl.textContent = `body { background: ${bgColor}; color: ${textColor}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.6; padding: 12px; } a { color: ${styles.getPropertyValue('--primary').trim()}; } img { max-width: 100%; height: auto; }`;
          doc.head.appendChild(styleEl);
          // Yüksekliği ayarla
          iframe.style.height = (doc.body.scrollHeight + 30) + 'px';
        } catch (_) {}
      };
    }
  }

  function bindActions(msg) {
    document.getElementById('mwReply').onclick = () => {
      window.api.openComposeReply?.(msg.id, false);
      // Mevcut UI: open-compose IPC ana pencerede compose modali açar
      window.api.invokeOpenCompose?.({ replyTo: msg, replyAll: false });
      window.close();
    };
    document.getElementById('mwReplyAll').onclick = () => {
      window.api.invokeOpenCompose?.({ replyTo: msg, replyAll: true });
      window.close();
    };
    document.getElementById('mwForward').onclick = () => {
      window.api.invokeOpenCompose?.({ forwardOf: msg });
      window.close();
    };
    document.getElementById('mwArchive').onclick = async () => {
      const r = await window.api.archive.archive(msg.id);
      if (r.ok) window.close();
    };
    document.getElementById('mwDelete').onclick = async () => {
      if (!confirm('Bu mesaj silinsin mi?')) return;
      try {
        await window.api.messages.delete(msg.id);
        window.close();
      } catch (e) { alert('Hata: ' + e.message); }
    };
  }

  // Klavye kısayolları
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      window.close();
    }
    if (e.key === 'Escape') {
      window.close();
    }
  });
})();
