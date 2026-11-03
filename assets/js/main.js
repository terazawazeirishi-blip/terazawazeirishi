/**
 * TERAZAWA WEBSITE STUDIO - Public Rendering & CMS Sync Engine
 * Module: assets/js/main.js
 * Version: 3.5.0 (Athena Standard / Dynamic Image Injector & Cache-Buster Complete)
 */
(function () {
  'use strict';

  /* ==========================================================================
   * 1. パス解決エンジン (GitHub Pages サブディレクトリ /terazawazeirishi/ 対応)
   * ========================================================================== */
  const pathname = window.location.pathname;
  const isSubDirBlog = pathname.indexOf('/blog/') !== -1;
  const repoBase = isSubDirBlog ? '../' : './';

  function resolveUrl(rawPath) {
    if (!rawPath || typeof rawPath !== 'string') return '';
    const trimmed = rawPath.trim();
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return '#';
    if (/^(https?:|mailto:|tel:|#)/i.test(trimmed)) return trimmed;
    let clean = trimmed.replace(/^(\.\/|\/)+/, '');
    if (clean.startsWith('terazawazeirishi/')) {
      clean = clean.replace(/^terazawazeirishi\//, '');
    }
    return repoBase + clean;
  }

  function resolveImgUrl(rawPath, addCacheBuster) {
    if (!rawPath || typeof rawPath !== 'string') return '';
    let clean = rawPath.trim().replace(/^(\.\/|\/)+/, '');
    if (clean.startsWith('terazawazeirishi/')) {
      clean = clean.replace(/^terazawazeirishi\//, '');
    }
    // ファイル名単体で保存された場合の自動補正
    if (!clean.includes('/') && !clean.startsWith('data:')) {
      clean = 'assets/images/uploads/' + clean;
    }
    let fullUrl = resolveUrl(clean);
    if (addCacheBuster && fullUrl && !fullUrl.startsWith('data:') && !fullUrl.startsWith('#')) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    }
    return fullUrl;
  }

  /* ==========================================================================
   * 2. エラー診断・ロギング機構
   * ========================================================================== */
  const cmsDiagnostics = [];
  const isDebugMode = new URLSearchParams(window.location.search).get('cms_debug') === '1';

  function reportCmsIssue(source, errorType, detail) {
    const entry = {
      timestamp: new Date().toISOString(),
      source: source,
      errorType: errorType,
      detail: String(detail)
    };
    cmsDiagnostics.push(entry);
    console.warn('[TERAZAWA CMS Notice]', entry);
  }

  async function fetchCmsJson(fileName) {
    const url = resolveUrl('content/' + fileName) + '?v=' + Date.now();
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        if (response.status !== 404) reportCmsIssue(fileName, 'HTTP_ERROR', response.status);
        return null;
      }
      return await response.json();
    } catch (e) {
      reportCmsIssue(fileName, 'NETWORK_ERROR', e.message);
      return null;
    }
  }

  /* ==========================================================================
   * 3. XSS安全DOM操作ユーティリティ
   * ========================================================================== */
  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = String(text);
    return el;
  }

  function setTextSafe(selectorOrEl, value) {
    if (value === undefined || value === null || value === '') return;
    const targets = typeof selectorOrEl === 'string'
      ? document.querySelectorAll(selectorOrEl)
      : [selectorOrEl];
    targets.forEach(function (el) {
      if (el) el.textContent = String(value);
    });
  }

  function setOrHide(selectorOrEl, value) {
    const targets = typeof selectorOrEl === 'string'
      ? document.querySelectorAll(selectorOrEl)
      : [selectorOrEl];
    targets.forEach(function (el) {
      if (!el) return;
      if (value === undefined || value === null || String(value).trim() === '') {
        el.style.display = 'none';
      } else {
        el.style.display = '';
        el.textContent = String(value);
      }
    });
  }

  /**
   * 画像要素またはdiv枠へ安全・確実に画像を注入する関数
   */
  function applyImageToTarget(el, imgUrl, altText) {
    if (!el || !imgUrl) return;
    if (el.tagName === 'IMG') {
      el.src = imgUrl;
      if (altText) el.alt = altText;
    } else {
      // 枠（div等）の中に既存のimgがあるか確認
      let innerImg = el.querySelector('img');
      if (innerImg) {
        innerImg.src = imgUrl;
        if (altText) innerImg.alt = altText;
      } else {
        // imgが存在しないdiv枠の場合はプレースホルダー文字を消去し、画像を動的挿入
        el.textContent = '';
        const newImg = document.createElement('img');
        newImg.src = imgUrl;
        newImg.alt = altText || 'サイト画像';
        newImg.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;';
        el.appendChild(newImg);
      }
    }
  }

  /* ==========================================================================
   * 4. サイト全画像スロット同期エンジン (全17スロット完全網羅)
   * ========================================================================== */
  let cachedImages = null;

  async function syncCmsImages() {
    const data = await fetchCmsJson('site_images.json');
    if (!data) return null;
    cachedImages = data;

    // 全17スロットとHTMLセレクタの精密マッピング
    const imageSelectors = {
      logo_img: ['.site-logo', '.footer-logo', '.navbar-brand', '[data-cms-img="logo_img"]'],
      hero_illustration: ['.hero-bg-artwork-wrap', '.athena-hero-art', '[data-cms-img="hero_illustration"]'],
      rep_keiko: ['[data-rep-photo="keiko"]', '.rep-photo-keiko', '.representative-card:first-child .representative-photo-frame', '[data-cms-img="rep_keiko"]'],
      rep_senior: ['[data-rep-photo="senior"]', '.rep-photo-senior', '.representative-card:last-child .representative-photo-frame', '[data-cms-img="rep_senior"]'],
      about_01: ['[data-about-img="01"]', '[data-about-img="1"]', '.features-zigzag-list .feature-row:nth-child(1) .feature-img-col', '.about-row:nth-child(1) .about-photo-placeholder', '[data-cms-img="about_01"]'],
      about_02: ['[data-about-img="02"]', '[data-about-img="2"]', '.features-zigzag-list .feature-row:nth-child(2) .feature-img-col', '.about-row:nth-child(2) .about-photo-placeholder', '[data-cms-img="about_02"]'],
      about_03: ['[data-about-img="03"]', '[data-about-img="3"]', '.features-zigzag-list .feature-row:nth-child(3) .feature-img-col', '.about-row:nth-child(3) .about-photo-placeholder', '[data-cms-img="about_03"]'],
      about_04: ['[data-about-img="04"]', '[data-about-img="4"]', '.features-zigzag-list .feature-row:nth-child(4) .feature-img-col', '.about-row:nth-child(4) .about-photo-placeholder', '[data-cms-img="about_04"]'],
      about_05: ['[data-about-img="05"]', '[data-about-img="5"]', '.features-zigzag-list .feature-row:nth-child(5) .feature-img-col', '.about-row:nth-child(5) .about-photo-placeholder', '[data-cms-img="about_05"]'],
      service_01: ['#service-01 .service-card-img-wrap', '[data-service-img="service_01"]', '[data-cms-img="service_01"]'],
      service_02: ['#service-02 .service-card-img-wrap', '[data-service-img="service_02"]', '[data-cms-img="service_02"]'],
      service_03: ['#service-03 .service-card-img-wrap', '[data-service-img="service_03"]', '[data-cms-img="service_03"]'],
      service_04: ['#service-04 .service-card-img-wrap', '[data-service-img="service_04"]', '[data-cms-img="service_04"]'],
      service_05: ['#service-05 .service-card-img-wrap', '[data-service-img="service_05"]', '[data-cms-img="service_05"]'],
      service_06: ['#service-06 .service-card-img-wrap', '[data-service-img="service_06"]', '[data-cms-img="service_06"]'],
      service_07: ['#service-07 .service-card-img-wrap', '[data-service-img="service_07"]', '[data-cms-img="service_07"]'],
      cta_banner_bg: ['.cta-banner-section', '[data-cms-img="cta_banner_bg"]']
    };

    Object.keys(imageSelectors).forEach(function (slotKey) {
      const rawVal = data[slotKey];
      if (!rawVal || typeof rawVal !== 'string') return;
      const fullImgUrl = resolveImgUrl(rawVal, true);

      imageSelectors[slotKey].forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) {
          if (slotKey === 'cta_banner_bg') {
            el.style.backgroundImage = 'url("' + fullImgUrl + '")';
          } else {
            applyImageToTarget(el, fullImgUrl, slotKey);
          }
        });
      });
    });

    return data;
  }

  /* ==========================================================================
   * 5. 各テキスト・配列同期関数
   * ========================================================================== */
  async function syncOfficeInfo() {
    const data = await fetchCmsJson('office_info.json');
    if (!data) return;
    ['office_name', 'english_name', 'postal_code', 'address', 'tel', 'fax', 'business_hours', 'target_area', 'affiliation', 'copyright_text'].forEach(function(k){
      setTextSafe('[data-cms="' + k + '"]', data[k]);
    });
    if (data.tel) {
      document.querySelectorAll('a[data-cms-tel]').forEach(function (a) { a.href = 'tel:' + String(data.tel).replace(/[^\d+]/g, ''); });
    }
    if (data.partner_sr_url) {
      document.querySelectorAll('a[data-cms-partner-link]').forEach(function (a) {
        a.href = resolveUrl(data.partner_sr_url);
        if (data.partner_sr_name) a.textContent = data.partner_sr_name;
      });
    }
  }

  async function syncHomeTexts() {
    const data = await fetchCmsJson('home_texts.json');
    if (!data) return;
    Object.keys(data).forEach(function (key) {
      setTextSafe('[data-cms-home="' + key + '"]', data[key]);
    });
  }

  async function syncProfileTexts() {
    const data = await fetchCmsJson('profile_texts.json');
    if (!data) return;
    setTextSafe('[data-cms-profile="page_title"]', data.page_title);
    setTextSafe('[data-cms-profile="page_subtitle"]', data.page_subtitle);
    ['rep_keiko', 'rep_senior'].forEach(function (repKey) {
      const rep = data[repKey];
      if (!rep) return;
      setTextSafe('[data-cms-profile="' + repKey + '.name"]', rep.name);
      setTextSafe('[data-cms-profile="' + repKey + '.name_kana"]', rep.name_kana);
      setTextSafe('[data-cms-profile="' + repKey + '.title"]', rep.title);
      setTextSafe('[data-cms-profile="' + repKey + '.message"]', rep.message);
    });
  }

  async function syncServicesTexts() {
    const data = await fetchCmsJson('services.json');
    if (!data || !Array.isArray(data.services)) return;
    const containers = document.querySelectorAll('[data-cms-service-list], .athena-service-cards');
    containers.forEach(function (container) {
      if (data.services.length === 0) return;
      container.textContent = '';
      data.services.forEach(function (srv, idx) {
        const card = createEl('article', 'service-card-item athena-service-card');
        const imgKey = srv.image_key || ('service_' + (idx + 1 < 10 ? '0' + (idx + 1) : (idx + 1)));
        const rawImg = srv.image || (cachedImages && cachedImages[imgKey]);
        if (rawImg) {
          const imgWrap = createEl('div', 'service-card-img-wrap');
          const img = createEl('img', 'service-card-img');
          img.src = resolveImgUrl(rawImg, true);
          img.alt = srv.title || 'サービス画像';
          imgWrap.appendChild(img);
          card.appendChild(imgWrap);
        }
        const body = createEl('div', 'service-card-body');
        body.appendChild(createEl('span', 'service-card-num', srv.num || ('0' + (idx + 1))));
        body.appendChild(createEl('h3', 'service-card-title', srv.title || ''));
        if (srv.summary) body.appendChild(createEl('p', 'service-card-summary', srv.summary));
        if (srv.link) {
          const a = createEl('a', 'service-card-link', '詳しく見る →');
          a.href = resolveUrl(srv.link);
          body.appendChild(a);
        }
        card.appendChild(body);
        container.appendChild(card);
      });
    });
  }

  async function syncPricingTexts() {
    const data = await fetchCmsJson('pricing.json');
    if (!data) return;
    setTextSafe('[data-cms-pricing="page_title"]', data.page_title);
  }

  async function syncFaqTexts() {
    const data = await fetchCmsJson('faq.json');
    if (!data || !Array.isArray(data.faq_list)) return;
    const container = document.querySelector('[data-cms-faq-list], .faq-accordion-list');
    if (!container) return;
    container.textContent = '';
    data.faq_list.forEach(function (item, idx) {
      const wrapper = createEl('div', 'faq-item');
      const btn = createEl('button', 'faq-question-btn');
      btn.type = 'button';
      btn.appendChild(createEl('span', 'faq-q-mark', 'Q.'));
      btn.appendChild(createEl('span', 'faq-q-text', item.question || ''));
      const icon = createEl('span', 'faq-toggle-icon', idx === 0 ? '−' : '＋');
      btn.appendChild(icon);

      const panel = createEl('div', 'faq-answer-panel');
      if (idx !== 0) panel.style.display = 'none';
      panel.appendChild(createEl('p', 'faq-a-text', item.answer || ''));

      btn.addEventListener('click', function () {
        const isClosed = panel.style.display === 'none';
        panel.style.display = isClosed ? 'block' : 'none';
        icon.textContent = isClosed ? '−' : '＋';
      });

      wrapper.appendChild(btn);
      wrapper.appendChild(panel);
      container.appendChild(wrapper);
    });
  }

  async function syncLegalTexts() {
    const data = await fetchCmsJson('legal_texts.json');
    if (!data) return;
    setTextSafe('[data-cms-legal="page_title"]', data.page_title);
  }

  /* ==========================================================================
   * 6. 初期化
   * ========================================================================== */
  async function bootstrap() {
    await syncCmsImages();
    await Promise.all([
      syncOfficeInfo(),
      syncHomeTexts(),
      syncProfileTexts(),
      syncServicesTexts(),
      syncPricingTexts(),
      syncFaqTexts(),
      syncLegalTexts()
    ]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
