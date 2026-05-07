/**
 * RichEditor - Hafif contenteditable HTML editör
 * Sıfır dependency, ~250 satır. Compose ve imza için kullanılır.
 */
class RichEditor {
  constructor(containerId, opts = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error('RichEditor: container yok: ' + containerId);
    this.opts = Object.assign({
      placeholder: 'Yazın...',
      compact: false  // imza için küçük versiyon
    }, opts);
    this._build();
  }

  _build() {
    this.container.classList.add('rich-editor');
    if (this.opts.compact) this.container.classList.add('rich-editor-small');
    this.container.innerHTML = `
      <div class="rte-toolbar">${this._toolbarHTML()}</div>
      <div class="rte-content" contenteditable="true" spellcheck="true"
           data-placeholder="${this._escAttr(this.opts.placeholder)}"></div>
    `;
    this.toolbar = this.container.querySelector('.rte-toolbar');
    this.editor = this.container.querySelector('.rte-content');
    this._bindToolbar();
    this._bindPaste();
    this._bindKeyboard();
  }

  _toolbarHTML() {
    return `
      <button type="button" data-cmd="bold" title="Kalın (Ctrl+B)" style="font-weight:700;">B</button>
      <button type="button" data-cmd="italic" title="İtalik (Ctrl+I)" style="font-style:italic;">I</button>
      <button type="button" data-cmd="underline" title="Altı Çizili (Ctrl+U)" style="text-decoration:underline;">U</button>
      <button type="button" data-cmd="strikeThrough" title="Üstü Çizili" style="text-decoration:line-through;">S</button>
      <span class="rte-sep"></span>
      <select data-cmd="formatBlock" title="Paragraf Tipi">
        <option value="div">Normal</option>
        <option value="h1">Başlık 1</option>
        <option value="h2">Başlık 2</option>
        <option value="h3">Başlık 3</option>
        <option value="blockquote">Alıntı</option>
        <option value="pre">Kod Bloğu</option>
      </select>
      <span class="rte-sep"></span>
      <button type="button" data-cmd="insertUnorderedList" title="Madde Listesi">• Liste</button>
      <button type="button" data-cmd="insertOrderedList" title="Numaralı Liste">1. Liste</button>
      <span class="rte-sep"></span>
      <button type="button" data-cmd="justifyLeft" title="Sola Hizala">⬅</button>
      <button type="button" data-cmd="justifyCenter" title="Ortala">⬌</button>
      <button type="button" data-cmd="justifyRight" title="Sağa Hizala">➡</button>
      <span class="rte-sep"></span>
      <button type="button" data-cmd="link" title="Bağlantı Ekle">🔗</button>
      <button type="button" data-cmd="unlink" title="Bağlantıyı Kaldır">✗</button>
      <span class="rte-sep"></span>
      <input type="color" data-cmd="foreColor" title="Yazı Rengi" value="#cdd6f4">
      <button type="button" data-cmd="removeFormat" title="Biçimi Temizle">⌫</button>
      <span class="rte-sep"></span>
      <button type="button" data-cmd="html" title="HTML Kaynağı (toggle)">&lt;/&gt;</button>
    `;
  }

  _bindToolbar() {
    this.toolbar.querySelectorAll('button[data-cmd]').forEach(btn => {
      btn.addEventListener('mousedown', (e) => e.preventDefault()); // selection korumak için
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this._exec(btn.dataset.cmd);
      });
    });
    this.toolbar.querySelectorAll('select[data-cmd]').forEach(sel => {
      sel.addEventListener('change', (e) => {
        this._exec(sel.dataset.cmd, sel.value);
        sel.value = 'div';
        this.editor.focus();
      });
    });
    this.toolbar.querySelectorAll('input[data-cmd]').forEach(inp => {
      inp.addEventListener('change', (e) => {
        this._exec(inp.dataset.cmd, inp.value);
        this.editor.focus();
      });
    });
  }

  _bindKeyboard() {
    this.editor.addEventListener('keydown', (e) => {
      // execCommand zaten Ctrl+B/I/U yakalar, ekstra bir şey gerek yok
      // Sadece Tab → 4 boşluk yap
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
      }
    });
  }

  _exec(cmd, val) {
    if (cmd === 'link') {
      const sel = window.getSelection();
      const selText = sel ? sel.toString() : '';
      const url = prompt('Bağlantı URL:', 'https://');
      if (url) {
        if (selText) {
          document.execCommand('createLink', false, url);
        } else {
          document.execCommand('insertHTML', false,
            `<a href="${this._escAttr(url)}">${this._escHtml(url)}</a>`);
        }
      }
      return;
    }
    if (cmd === 'html') {
      this._toggleHTMLMode();
      return;
    }
    document.execCommand(cmd, false, val);
    this.editor.focus();
  }

  _toggleHTMLMode() {
    if (this.editor.dataset.mode === 'html') {
      // HTML mod'dan zengin moda
      const html = this.editor.textContent;
      this.editor.innerHTML = html;
      this.editor.dataset.mode = '';
    } else {
      // Zengin moddan HTML görüntü moda
      const html = this.editor.innerHTML;
      this.editor.textContent = html;
      this.editor.dataset.mode = 'html';
    }
    this.editor.focus();
  }

  _bindPaste() {
    this.editor.addEventListener('paste', (e) => {
      const types = e.clipboardData?.types || [];
      // HTML varsa - sanitize et
      if (types.includes('text/html')) {
        const html = e.clipboardData.getData('text/html');
        const clean = this._sanitize(html);
        if (clean) {
          e.preventDefault();
          document.execCommand('insertHTML', false, clean);
        }
      }
      // text/plain ise default davranış (güvenli, otomatik escape)
    });
  }

  _sanitize(html) {
    const ALLOWED_TAGS = new Set([
      'p', 'div', 'span', 'br', 'hr',
      'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'sub', 'sup',
      'a', 'img',
      'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'font'
    ]);
    const ALLOWED_ATTR = {
      '*': ['style'],
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'width', 'height'],
      'font': ['color', 'face', 'size'],
      'td': ['colspan', 'rowspan'],
      'th': ['colspan', 'rowspan']
    };
    const tmp = document.createElement('div');
    tmp.innerHTML = html;

    // <script>, <style>, <iframe>, vs. tag'leri tamamen sil
    tmp.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach(el => el.remove());

    // Tüm node'ları gez
    const walker = document.createTreeWalker(tmp, NodeFilter.SHOW_ELEMENT, null);
    const toUnwrap = [];
    let node;
    while (node = walker.nextNode()) {
      const tag = node.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        toUnwrap.push(node);
        continue;
      }
      // Attribute filtrele
      const allowed = ALLOWED_ATTR[tag] || [];
      const wildAllowed = ALLOWED_ATTR['*'] || [];
      [...node.attributes].forEach(attr => {
        const an = attr.name.toLowerCase();
        if (!allowed.includes(an) && !wildAllowed.includes(an)) {
          node.removeAttribute(attr.name);
        }
        // javascript: link engelle
        if (an === 'href' && /^\s*javascript:/i.test(attr.value)) {
          node.removeAttribute('href');
        }
        // event handler attr (onclick vb.) zaten yukarıda filtrelendi
      });
    }
    // Yasaklı tag'leri içerikle birlikte unwrap et
    toUnwrap.forEach(n => {
      while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n);
      n.parentNode.removeChild(n);
    });
    return tmp.innerHTML;
  }

  _escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  _escAttr(str) {
    return this._escHtml(str);
  }

  // Public API
  getHTML() {
    if (this.editor.dataset.mode === 'html') return this.editor.textContent;
    return this.editor.innerHTML;
  }

  getText() {
    if (this.editor.dataset.mode === 'html') {
      // HTML mod'da textContent zaten plain
      const tmp = document.createElement('div');
      tmp.innerHTML = this.editor.textContent;
      return tmp.innerText || tmp.textContent || '';
    }
    return this.editor.innerText || this.editor.textContent || '';
  }

  setHTML(html) {
    this.editor.dataset.mode = '';
    this.editor.innerHTML = html || '';
  }

  clear() {
    this.editor.dataset.mode = '';
    this.editor.innerHTML = '';
  }

  focus() { this.editor.focus(); }
  isEmpty() { return !this.getText().trim(); }
}

window.RichEditor = RichEditor;
