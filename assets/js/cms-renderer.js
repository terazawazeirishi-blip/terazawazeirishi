/**
 * TERAZAWA WEBSITE STUDIO - Security Sanitizer & Type Validator
 * Module: assets/js/cms-renderer.js
 * Version: 3.0.0 (Zero-Dependency & Pure Deterministic Security Engine)
 */
(function (global) {
  'use strict';

  // 許可するHTMLタグ（ホワイトリスト）
  const ALLOWED_TAGS = new Set([
    'p', 'br', 'span', 'strong', 'b', 'em', 'i', 'u', 's',
    'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'a', 'img'
  ]);

  // 許可する属性（タグ別ホワイトリスト）
  const ALLOWED_ATTRS = {
    '*': new Set(['class', 'id', 'title', 'aria-label', 'aria-hidden']),
    'a': new Set(['href', 'target', 'rel']),
    'img': new Set(['src', 'alt', 'width', 'height', 'loading'])
  };

  // 許可するURLプロトコル
  const SAFE_URL_PATTERN = /^(https?:|mailto:|tel:|\/|\.\/|\.\.\/|#)/i;

  const CmsRenderer = {
    /**
     * 1. 安全なURLの検証と抽出
     * @param {string} rawUrl 
     * @returns {string} 安全なURL（不正な場合は '#' を返却）
     */
    sanitizeUrl: function (rawUrl) {
      if (!rawUrl || typeof rawUrl !== 'string') return '#';
      const clean = rawUrl.trim();
      if (/^(javascript|data|vbscript):/i.test(clean)) {
        console.warn('[TERAZAWA Security] Blocked dangerous URL protocol:', clean);
        return '#';
      }
      if (SAFE_URL_PATTERN.test(clean)) {
        return clean;
      }
      // スキームなしの相対パスとみなせる場合
      if (!clean.includes(':')) {
        return clean;
      }
      return '#';
    },

    /**
     * 2. リッチテキスト用ホワイトリスト型HTMLサニタイザー
     * @param {string} rawHtml 
     * @returns {DocumentFragment} 安全にパース・洗浄されたDOMフラグメント
     */
    sanitizeHtmlToFragment: function (rawHtml) {
      const fragment = document.createDocumentFragment();
      if (!rawHtml || typeof rawHtml !== 'string') return fragment;

      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');

      function cleanNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          return document.createTextNode(node.textContent);
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return null;
        }

        const tagName = node.tagName.toLowerCase();
        if (!ALLOWED_TAGS.has(tagName)) {
          // 許可されていないタグ（script, iframe等）はその配下のテキストのみ救出
          const textContainer = document.createDocumentFragment();
          Array.from(node.childNodes).forEach(function (child) {
            const cleanedChild = cleanNode(child);
            if (cleanedChild) textContainer.appendChild(cleanedChild);
          });
          return textContainer;
        }

        const safeEl = document.createElement(tagName);

        // 属性の安全検査
        Array.from(node.attributes).forEach(function (attr) {
          const attrName = attr.name.toLowerCase();
          const attrValue = attr.value;

          // on* (onclick, onerror等) は無条件で破棄
          if (attrName.startsWith('on')) return;

          const globalAllowed = ALLOWED_ATTRS['*'];
          const tagAllowed = ALLOWED_ATTRS[tagName];

          const isAllowed = (globalAllowed && globalAllowed.has(attrName)) ||
                            (tagAllowed && tagAllowed.has(attrName));

          if (isAllowed) {
            if (attrName === 'href' || attrName === 'src') {
              safeEl.setAttribute(attrName, CmsRenderer.sanitizeUrl(attrValue));
            } else if (attrName === 'target' && attrValue === '_blank') {
              safeEl.setAttribute('target', '_blank');
              safeEl.setAttribute('rel', 'noopener noreferrer'); // セキュリティ強制
            } else {
              safeEl.setAttribute(attrName, attrValue);
            }
          }
        });

        // 子要素を再帰的に洗浄
        Array.from(node.childNodes).forEach(function (child) {
          const cleanedChild = cleanNode(child);
          if (cleanedChild) safeEl.appendChild(cleanedChild);
        });

        return safeEl;
      }

      Array.from(doc.body.childNodes).forEach(function (child) {
        const cleaned = cleanNode(child);
        if (cleaned) fragment.appendChild(cleaned);
      });

      return fragment;
    },

    /**
     * 3. 型検証ユーティリティ
     */
    validator: {
      isArray: function (val) {
        return Array.isArray(val);
      },
      isObject: function (val) {
        return val !== null && typeof val === 'object' && !Array.isArray(val);
      },
      isNonEmptyString: function (val) {
        return typeof val === 'string' && val.trim().length > 0;
      },
      isBoolean: function (val) {
        return typeof val === 'boolean';
      }
    },

    /**
     * 4. 安全なDOM更新
     * @param {HTMLElement} container 
     * @param {string} rawHtml 
     */
    setSafeHtml: function (container, rawHtml) {
      if (!container) return;
      container.textContent = ''; // 既存をクリア
      const cleanFragment = CmsRenderer.sanitizeHtmlToFragment(rawHtml);
      container.appendChild(cleanFragment);
    }
  };

  // グローバル（window）に安全に公開
  global.CmsRenderer = CmsRenderer;

})(typeof window !== 'undefined' ? window : this);
