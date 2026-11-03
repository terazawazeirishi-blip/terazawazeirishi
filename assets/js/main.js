/**
 * TERAZAWA WEBSITE STUDIO - Public Rendering & CMS Sync Engine
 * Module: assets/js/main.js
 * Version: 3.6.0 (Zero-Fail / Ultra-Robust Image & Text Sync Edition)
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

  function resolveImgUrl(rawPath) {
    if (!rawPath || typeof rawPath !== 'string') return '';
    let clean = rawPath.trim().replace(/^(\.\/|\/)+/, '');
    if (clean.startsWith('terazawazeirishi/')) {
      clean = clean.replace(/^terazawazeirishi\//, '');
    }
    // uploads補正
    if (!clean.includes('/') && !clean.startsWith('data:')) {
      clean = 'assets/images/uploads/' + clean;
    }
    let full = resolveUrl(clean);
    // キャッシュバスター付与（ブラウザキャッシュを即座に破棄）
    if (full && !full.startsWith('data:') && !full.startsWith('#')) {
      full += (full.includes('?') ? '&' : '?') + 't=' + Date.now();
    }
    return full;
  }

  async function fetchCmsJson(fileName) {
    const url = resolveUrl('content/' + fileName) + '?v=' + Date.now();
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.warn('[TERAZAWA] JSON load notice:', fileName, e.message);
      return null;
    }
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

  /**
   * ターゲット要素（img または div枠）へ画像を強制注入する関数
   */
  function injectImage(targetEl, imgUrl, altText) {
    if (!targetEl || !imgUrl) return;
    if (targetEl.tagName === 'IMG') {
      targetEl.src = imgUrl;
      if (altText) targetEl.alt = altText;
    } else {
      let existingImg = targetEl.querySelector('img');
      if (existingImg) {
        existingImg.src = imgUrl;
        if (altText) existingImg.alt = altText;
      } else {
        targetEl.textContent = ''; // プレースホルダーの文字を完全消去
        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = altText || 'サイト画像';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;';
        targetEl.appendChild(img);
      }
    }
  }

  /* ==========================================================================
   * 2. サイト全画像スロット同期（全17スロット完全網羅）
   * ========================================================================== */
  let cachedImages = null;

  async function syncCmsImages() {
    const data = await fetchCmsJson('site_images.json');
    if (!data) return null;
    cachedImages = data;

    // スロット名と探索セレクタの包括的マッピング
    const map = {
      logo_img: ['[data-cms-img="logo_img"]', '.site-logo', '.footer-logo', '.navbar-brand img'],
      watermark_crest: ['[data-cms-img="watermark_crest"]', '.athena-hero-crest', '.watermark-crest'],
      hero_illustration: ['[data-cms-img="hero_illustration"]', '.hero-bg-artwork-wrap', '.athena-hero-art', 'img[src*="hero-flower"]'],
      rep_keiko: ['[data-cms-img="rep_keiko"]', '[data-rep-photo="keiko"]', '.representative-card:first-child .representative-photo-frame', '.rep-photo-keiko'],
      rep_senior: ['[data-cms-img="rep_senior"]', '[data-rep-photo="senior"]', '.representative-card:last-child .representative-photo-frame', '.rep-photo-senior'],
      about_01: ['[data-cms-img="about_01"]', '[data-about-img="01"]', '.features-zigzag-list .feature-row:nth-child(1) .feature-img-col', '.about-row:nth-child(1) .about-photo-placeholder', '.about-box-01'],
      about_02: ['[data-cms-img="about_02"]', '[data-about-img="02"]', '.features-zigzag-list .feature-row:nth-child(2) .feature-img-col', '.about-row:nth-child(2) .about-photo-placeholder', '.about-box-02'],
      about_03: ['[data-cms-img="about_03"]', '[data-about-img="03"]', '.features-zigzag-list .feature-row:nth-child(3) .feature-img-col', '.about-row:nth-child(3) .about-photo-placeholder', '.about-box-03'],
      about_04: ['[data-cms-img="about_04"]', '[data-about-img="04"]', '.features-zigzag-list .feature-row:nth-child(4) .feature-img-col', '.about-row:nth-child(4) .about-photo-placeholder', '.about-box-04'],
      about_05: ['[data-cms-img="about_05"]', '[data-about-img="05"]', '.features-zigzag-list .feature-row:nth-child(5) .feature-img-col', '.about-row:nth-child(5) .about-photo-placeholder', '.about-box-05'],
      service_01: ['[data-cms-img="service_01"]', '#service-01 .service-card-img-wrap', '[data-service-img="service_01"]'],
      service_02: ['[data-cms-img="service_02"]', '#service-02 .service-card-img-wrap', '[data-service-img="service_02"]'],
      service_03: ['[data-cms-img="service_03"]', '#service-03 .service-card-img-wrap', '[data-service-img="service_03"]'],
      service_04: ['[data-cms-img="service_04"]', '#service-04 .service-card-img-wrap', '[data-service-img="service_04"]'],
      service_05: ['[data-cms-img="service_05"]', '#service-05 .service-card-img-wrap', '[data-service-img="service_05"]'],
      service_06: ['[data-cms-img="service_06"]', '#service-06 .service-card-img-wrap', '[data-service-img="service_06"]'],
      service_07: ['[data-cms-img="service_07"]', '#service-07 .service-card-img-wrap', '[data-service-img="service_07"]'],
      cta_banner_bg: ['[data-cms-img="cta_banner_bg"]', '.cta-banner-section', '.cta-banner-bg-overlay']
    };

    // テキスト内容から枠を逆引き検出するフォールバック
    const textFallbacks = [
      { key: 'about_01', text: '2人体制写真' },
      { key: 'about_02', text: '寺澤景子税理士 調査防衛枠' },
      { key: 'about_03', text: 'ベテラン税理士 実務枠' },
      { key: 'about_04', text: 'ザワテラス社労士連携枠' },
      { key: 'about_05', text: '相談風景・花のあるサロン枠' },
      { key: 'rep_keiko', text: 'Keiko Terazawa' },
      { key: 'rep_senior', text: 'Senior Tax Advisor' }
    ];

    Object.keys(map).forEach(function (slotKey) {
      const rawPath = data[slotKey];
      if (!rawPath || typeof rawPath !== 'string') return;
      const fullUrl = resolveImgUrl(rawPath);

      map[slotKey].forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) {
          if (slotKey === 'cta_banner_bg') {
            el.style.backgroundImage = 'url("' + fullUrl + '")';
          } else {
            injectImage(el, fullUrl, slotKey);
          }
        });
      });
    });

    // テキストが含まれる未置換のdiv枠を走査して強制画像化
    textFallbacks.forEach(function (fb) {
      const rawPath = data[fb.key];
      if (!rawPath) return;
      const fullUrl = resolveImgUrl(rawPath);

      document.querySelectorAll('div, section, article').forEach(function (node) {
        if (node.children.length <= 3 && node.textContent.includes(fb.text)) {
          injectImage(node, fullUrl, fb.key);
        }
      });
    });

    return data;
  }

  /* ==========================================================================
   * 3. 基本情報・テキスト同期
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
    Object.keys(data).forEach(function (k) { setTextSafe('[data-cms-home="' + k + '"]', data[k]); });
  }

  /* ==========================================================================
   * 4. 起動処理
   * ========================================================================== */
  async function init() {
    await syncCmsImages();
    await Promise.all([
      syncOfficeInfo(),
      syncHomeTexts()
    ]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
