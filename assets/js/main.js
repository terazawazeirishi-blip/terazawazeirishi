/**
 * TERAZAWA WEBSITE STUDIO - Public Rendering & CMS Sync Engine
 * Module: assets/js/main.js
 * Version: 3.7.0 (Fixed: Confined Photo Sizing & Clean Safe Fallback)
 */
(function () {
  'use strict';

  /* ==========================================================================
   * 1. パス解決エンジン
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
    if (!clean.includes('/') && !clean.startsWith('data:')) {
      clean = 'assets/images/uploads/' + clean;
    }
    let full = resolveUrl(clean);
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
   * 安全な画像挿入（枠の大きさを絶対に超えないストッパー付き）
   */
  function injectPhotoSafely(frameEl, imgUrl, altText) {
    if (!frameEl || !imgUrl) return;
    frameEl.textContent = ''; // 枠内のプレースホルダー文字のみ消去
    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = altText || '税理士写真';
    // 最大幅260pxを超えず、枠内に美しく収まるスタイルを強制
    img.style.cssText = 'width: 100%; max-width: 260px; height: auto; aspect-ratio: 1/1; object-fit: cover; border-radius: 8px; display: block; margin: 0 auto; box-shadow: 0 4px 16px rgba(27,42,74,0.08);';
    frameEl.appendChild(img);
  }

  /* ==========================================================================
   * 2. サイト画像同期（写真枠限定・安全実行）
   * ========================================================================== */
  async function syncCmsImages() {
    const data = await fetchCmsJson('site_images.json');
    if (!data) return null;

    // 代表税理士 寺澤景子（幅260px枠に安全限定）
    if (data.rep_keiko) {
      const keikoUrl = resolveImgUrl(data.rep_keiko);
      document.querySelectorAll('.representative-card:first-child .representative-photo-frame, [data-rep-photo="keiko"], .rep-photo-keiko, [data-cms-img="rep_keiko"]').forEach(function (el) {
        injectPhotoSafely(el, keikoUrl, '寺澤 景子 代表税理士');
      });
    }

    // 副代表・ベテラン税理士 田河定茂（幅260px枠に安全限定）
    if (data.rep_senior) {
      const seniorUrl = resolveImgUrl(data.rep_senior);
      document.querySelectorAll('.representative-card:last-child .representative-photo-frame, [data-rep-photo="senior"], .rep-photo-senior, [data-cms-img="rep_senior"]').forEach(function (el) {
        injectPhotoSafely(el, seniorUrl, '田河 定茂 副代表税理士');
      });
    }

    // 選ばれる理由01〜05（写真枠のみに限定）
    for (let i = 1; i <= 5; i++) {
      const slotKey = 'about_0' + i;
      if (data[slotKey]) {
        const aboutUrl = resolveImgUrl(data[slotKey]);
        document.querySelectorAll('.features-zigzag-list .feature-row:nth-child(' + i + ') .feature-img-col, [data-cms-img="' + slotKey + '"]').forEach(function (el) {
          el.textContent = '';
          const img = document.createElement('img');
          img.src = aboutUrl;
          img.alt = '選ばれる理由 ' + i;
          img.style.cssText = 'width: 100%; max-width: 500px; height: auto; border-radius: 8px; display: block;';
          el.appendChild(img);
        });
      }
    }

    // ロゴ
    if (data.logo_img) {
      const logoUrl = resolveImgUrl(data.logo_img);
      document.querySelectorAll('.site-logo img, [data-cms-img="logo_img"]').forEach(function (img) {
        img.src = logoUrl;
      });
    }

    // ヒーロー象徴アート
    if (data.hero_illustration) {
      const heroUrl = resolveImgUrl(data.hero_illustration);
      document.querySelectorAll('.hero-bg-artwork-wrap img, .athena-hero-art img, [data-cms-img="hero_illustration"]').forEach(function (img) {
        img.src = heroUrl;
      });
    }

    return data;
  }

  /* ==========================================================================
   * 3. 基本情報同期
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
  }

  /* ==========================================================================
   * 4. 起動処理
   * ========================================================================== */
  async function init() {
    await syncCmsImages();
    await syncOfficeInfo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
