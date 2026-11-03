/**
 * TERAZAWA WEBSITE STUDIO - Public Rendering & CMS Sync Engine
 * Module: assets/js/main.js
 * Version: 3.8.0 (Final Deterministic Edition: Safe Photo Inset & Zero-Fail)
 */
(function () {
  'use strict';

  /* 1. パス解決エンジン */
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
    // キャッシュバスター付与（ブラウザキャッシュを確実に破棄）
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

  /* 2. 画像の安全な枠内挿入（サイズを厳格固定） */
  function setPhoto(frameSelector, imgUrl, altText, isRepresentative) {
    if (!imgUrl) return;
    const frames = document.querySelectorAll(frameSelector);
    frames.forEach(function (frame) {
      frame.textContent = ''; // プレースホルダーの文字を消去
      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = altText || 'サイト画像';
      if (isRepresentative) {
        // 代表・副代表写真: 最大幅260pxの正方形枠に厳密固定（巨大化を物理防止）
        img.style.cssText = 'width: 100%; max-width: 260px; height: 260px; object-fit: cover; border-radius: 8px; display: block; margin: 0 auto; box-shadow: 0 4px 16px rgba(27,42,74,0.08);';
      } else {
        // 選ばれる理由01〜05: 最大幅500pxの枠内に収める
        img.style.cssText = 'width: 100%; max-width: 500px; height: auto; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; display: block; margin: 0 auto;';
      }
      frame.appendChild(img);
    });
  }

  /* 3. サイト画像同期処理 */
  async function syncCmsImages() {
    const data = await fetchCmsJson('site_images.json');
    if (!data) return null;

    // 代表税理士 寺澤景子（260px固定）
    if (data.rep_keiko) {
      const url = resolveImgUrl(data.rep_keiko);
      setPhoto('.representative-card:first-child .representative-photo-frame, .rep-photo-keiko, [data-rep-photo="keiko"], [data-cms-img="rep_keiko"]', url, '寺澤 景子 代表税理士', true);
    }

    // 副代表・ベテラン税理士 田河定茂（260px固定）
    if (data.rep_senior) {
      const url = resolveImgUrl(data.rep_senior);
      setPhoto('.representative-card:last-child .representative-photo-frame, .rep-photo-senior, [data-rep-photo="senior"], [data-cms-img="rep_senior"]', url, '田河 定茂 副代表税理士', true);
    }

    // 選ばれる理由 01〜05（各行の写真枠に限定挿入）
    for (let i = 1; i <= 5; i++) {
      const key = 'about_0' + i;
      if (data[key]) {
        const url = resolveImgUrl(data[key]);
        setPhoto('.features-zigzag-list .feature-row:nth-child(' + i + ') .feature-img-col, .features-zigzag-list .feature-row:nth-child(' + i + ') .about-photo-placeholder, [data-cms-img="' + key + '"]', url, '選ばれる理由 ' + i, false);
      }
    }

    // ヒーロー象徴アート
    if (data.hero_illustration) {
      const url = resolveImgUrl(data.hero_illustration);
      document.querySelectorAll('.hero-bg-artwork-wrap img, .athena-hero-art img, [data-cms-img="hero_illustration"]').forEach(function (img) {
        img.src = url;
      });
    }

    // ロゴ
    if (data.logo_img) {
      const url = resolveImgUrl(data.logo_img);
      document.querySelectorAll('.site-logo img, [data-cms-img="logo_img"]').forEach(function (img) {
        img.src = url;
      });
    }

    return data;
  }

  /* 4. 起動処理 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncCmsImages);
  } else {
    syncCmsImages();
  }
})();
