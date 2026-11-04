/**
 * TERAZAWA WEBSITE STUDIO - Public Rendering & CMS Sync Engine
 * Module: assets/js/main.js
 * Version: 6.0.0 (Master Unified Edition: Zero HTML-Touch & Complete 18-Slot Sync)
 */
(function () {
  'use strict';

  // サブディレクトリ対応パスヘルパー
  const pathParts = window.location.pathname.split('/');
  let repoBase = './';
  const repoIndex = pathParts.indexOf('terazawazeirishi');
  if (repoIndex !== -1) {
    repoBase = pathParts.slice(0, repoIndex + 1).join('/') + '/';
  } else if (window.location.pathname.includes('/blog/')) {
    repoBase = '../';
  }

  function resolveUrl(path) {
    if (!path || typeof path !== 'string') return '';
    const trimmed = path.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    let clean = trimmed.replace(/^(\.\/|\/)+/, '');
    if (clean.startsWith('terazawazeirishi/')) {
      clean = clean.replace('terazawazeirishi/', '');
    }
    return repoBase + clean + '?v=' + Date.now();
  }

  // 安全に写真枠の中へ画像を挿入（元の安定版 4.0.0 ロジックを完全継承・位置ズレゼロ）
  function setPhotoSafe(searchText, imgUrl, maxW, isSquare) {
    if (!imgUrl) return;
    const all = document.querySelectorAll('div, p, span, text');
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (el.textContent && el.textContent.includes(searchText)) {
        const frame = el.closest('.representative-photo-frame, .zigzag-visual-slot, div');
        if (frame) {
          frame.textContent = ''; // プレースホルダーの文字・SVGのみ消去
          const img = document.createElement('img');
          img.src = imgUrl;
          img.alt = searchText;
          img.className = 'representative-photo-img zigzag-visual-img';
          img.style.cssText = 'width:100%;' + (maxW ? 'max-width:' + maxW + 'px;' : '') + (isSquare ? 'height:' + maxW + 'px;aspect-ratio:1/1;' : 'height:auto;aspect-ratio:4/3;') + 'object-fit:cover;border-radius:8px;display:block;margin:0 auto;box-shadow:0 4px 16px rgba(27,42,74,0.08);';
          frame.appendChild(img);
          break;
        }
      }
    }
  }

  // 幾何学的整合性を担保する動的CSSルール（HTML側のCSS未定義による位置ズレを完全防御）
  function injectGeometryGuardCSS() {
    if (document.getElementById('terazawa-geometry-guard')) return;
    const style = document.createElement('style');
    style.id = 'terazawa-geometry-guard';
    style.textContent = `
      /* 画像なし項目の幾何学的整合性保証（枠完全消去 ＆ 100%全幅展開） */
      .athena-zigzag-item.has-no-image {
        display: block !important;
        direction: ltr !important;
        background: var(--color-bg-subtle);
        padding: 3rem 3.5rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-border);
        box-shadow: var(--shadow-sm);
      }
      .athena-zigzag-item.has-no-image .zigzag-visual-slot {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      .athena-zigzag-item.has-no-image .zigzag-content {
        width: 100% !important;
        max-width: 100% !important;
        direction: ltr !important;
        text-align: left !important;
      }
      .athena-zigzag-item.has-no-image .athena-num-bg {
        top: -1.2rem;
        right: 2rem;
      }

      .service-card-item.no-image {
        display: block !important;
        grid-template-columns: 1fr !important;
      }
      .service-card-item.no-image .service-card-img-slot {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      .service-card-item.no-image .service-card-body,
      .service-card-item.no-image .service-card-content {
        width: 100% !important;
        max-width: 100% !important;
        display: block !important;
      }

      @media (max-width: 768px) {
        .athena-zigzag-item.has-no-image {
          padding: 2rem 1.4rem;
        }
        .service-card-item {
          padding: 1.8rem 1.4rem;
          margin-bottom: 1.5rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  async function syncAllCmsData() {
    // 1. 幾何学的防護CSSを注入
    injectGeometryGuardCSS();

    try {
      const res = await fetch(repoBase + 'content/site_images.json?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      // ------------------------------------------------------------------------
      // 01. ロゴ画像 (logo_img)
      // ------------------------------------------------------------------------
      if (data.logo_img) {
        const logoUrl = resolveUrl(data.logo_img);
        document.querySelectorAll('.brand-logo, .site-logo').forEach(brand => {
          let img = brand.querySelector('img.brand-logo-img');
          const svg = brand.querySelector('svg.brand-logo-img');
          if (!img) {
            img = document.createElement('img');
            img.className = 'brand-logo-img';
            img.alt = '寺澤景子税理士事務所 ロゴ';
            img.style.cssText = 'width:44px; height:44px; object-fit:contain; flex-shrink:0;';
            if (svg) {
              brand.replaceChild(img, svg);
            } else {
              brand.insertBefore(img, brand.firstChild);
            }
          }
          img.src = logoUrl;
        });
      }

      // ------------------------------------------------------------------------
      // 02. 代表税理士（寺澤景子）＆ 副代表（田河定茂）写真 (rep_keiko, rep_senior)
      // 安定版 4.0.0 の実績ある安全ロジック（位置ズレ一切なし）
      // ------------------------------------------------------------------------
      if (data.rep_keiko) {
        setPhotoSafe('Keiko Terazawa', resolveUrl(data.rep_keiko), 260, true);
      }
      if (data.rep_senior) {
        setPhotoSafe('Senior Tax Advisor', resolveUrl(data.rep_senior), 260, true);
      }

      // ------------------------------------------------------------------------
      // 03. 透かし紋章 (watermark_crest)
      // ------------------------------------------------------------------------
      if (data.watermark_crest) {
        const crestUrl = resolveUrl(data.watermark_crest);
        const heroBgWrap = document.querySelector('.hero-bg-artwork-wrap, .athena-hero');
        if (heroBgWrap && !document.getElementById('cmsWatermarkCrest')) {
          const crestImg = document.createElement('img');
          crestImg.id = 'cmsWatermarkCrest';
          crestImg.alt = '寺澤景子税理士事務所 象徴紋章';
          crestImg.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width: clamp(320px, 45vw, 650px); opacity:0.045; pointer-events:none; z-index:1;';
          crestImg.src = crestUrl;
          heroBgWrap.insertBefore(crestImg, heroBgWrap.firstChild);
        }
      }

      // ------------------------------------------------------------------------
      // 04. ヒーロー象徴アート (hero_illustration)
      // ------------------------------------------------------------------------
      if (data.hero_illustration) {
        const heroArtUrl = resolveUrl(data.hero_illustration);
        document.querySelectorAll('.hero-illustration-img, .hero-bg-artwork-img').forEach(img => {
          img.src = heroArtUrl;
        });
      }

      // ------------------------------------------------------------------------
      // 05. 選ばれる理由01〜05 (about_01 〜 about_05)
      // 画像があれば写真展開、無ければ枠完全消去 ＆ 100%全幅化
      // ------------------------------------------------------------------------
      const aboutKeys = ['about_01', 'about_02', 'about_03', 'about_04', 'about_05'];
      const aboutItems = document.querySelectorAll('#about .athena-zigzag-item');
      let aboutCounter = 0;

      aboutItems.forEach((item, idx) => {
        const key = item.getAttribute('data-about-key') || aboutKeys[idx];
        const rawImg = data[key];
        const slot = item.querySelector('.zigzag-visual-slot');

        if (rawImg && slot) {
          // 画像がある場合：枠を表示し画像を挿入
          const isReverse = (aboutCounter % 2 === 1);
          aboutCounter++;
          item.classList.remove('has-no-image');
          if (isReverse) {
            item.classList.add('is-reverse');
          } else {
            item.classList.remove('is-reverse');
          }
          slot.style.display = '';
          slot.textContent = '';
          const img = document.createElement('img');
          img.src = resolveUrl(rawImg);
          img.className = 'zigzag-visual-img';
          img.style.cssText = 'width:100%; height:100%; object-fit:cover; display:block;';
          slot.appendChild(img);
        } else if (slot) {
          // 画像が無い場合：枠を完全に非表示化し、全幅カードへ変換
          item.classList.add('has-no-image');
          item.classList.remove('is-reverse');
          slot.style.display = 'none';
        }
      });

      // ------------------------------------------------------------------------
      // 06. 提供サービス (service_01 〜 service_07)
      // 画像があれば枠を展開、無ければ枠完全消去 ＆ 100%全幅化
      // ------------------------------------------------------------------------
      const serviceKeys = ['service_01', 'service_02', 'service_03', 'service_04', 'service_05', 'service_06', 'service_07'];
      const serviceCards = document.querySelectorAll('#services .service-card-item, #servicesContainer .service-card-item');
      let serviceCounter = 0;

      serviceCards.forEach((card, idx) => {
        const key = card.getAttribute('data-service-key') || serviceKeys[idx];
        const rawImg = data[key];
        const slot = card.querySelector('.service-card-img-slot, .zigzag-visual-slot');

        if (rawImg && slot) {
          // 画像がある場合：枠を表示し画像を挿入
          const isReverse = (serviceCounter % 2 === 1);
          serviceCounter++;
          card.classList.remove('no-image', 'has-no-image');
          card.classList.add('with-image');
          if (isReverse) {
            card.classList.add('is-reverse');
          } else {
            card.classList.remove('is-reverse');
          }
          slot.style.display = '';
          slot.textContent = '';
          const img = document.createElement('img');
          img.src = resolveUrl(rawImg);
          img.className = 'service-card-img';
          img.style.cssText = 'width:100%; height:100%; object-fit:cover; border-radius:var(--radius-md); display:block;';
          slot.appendChild(img);
        } else if (slot) {
          // 画像が無い場合：枠を完全に非表示化し、全幅カードへ変換
          card.classList.add('no-image', 'has-no-image');
          card.classList.remove('with-image', 'is-reverse');
          slot.style.display = 'none';
        }
      });

      // ------------------------------------------------------------------------
      // 07. 下部CTAバナー背景 (cta_banner_bg)
      // ------------------------------------------------------------------------
      if (data.cta_banner_bg) {
        const ctaBgUrl = resolveUrl(data.cta_banner_bg);
        document.querySelectorAll('.cta-banner-section, section:has(.cta-heading)').forEach(sec => {
          sec.style.backgroundImage = `linear-gradient(rgba(27, 42, 74, 0.88), rgba(27, 42, 74, 0.92)), url('${ctaBgUrl}')`;
          sec.style.backgroundSize = 'cover';
          sec.style.backgroundPosition = 'center';
        });
      }

    } catch (e) {
      console.warn('[TERAZAWA] Sync engine error:', e);
    }
  }

  // 実行トリガー
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncAllCmsData);
  } else {
    syncAllCmsData();
  }
})();
