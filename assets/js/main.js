/**
 * TERAZAWA WEBSITE STUDIO - Public Rendering & CMS Sync Engine
 * Module: assets/js/main.js
 * Version: 5.0.0 (Pages CMS 18-Slot Perfect Sync Edition)
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

  // 18スロット完全同期メイン処理
  async function syncAllCmsImages() {
    try {
      const res = await fetch(repoBase + 'content/site_images.json?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      // ------------------------------------------------------------------------
      // 01. ヘッダー・フッター用ロゴ画像 (logo_img)
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
      // 02. ファーストビュー背景の透かし幾何学SVG / 紋章 (watermark_crest)
      // ------------------------------------------------------------------------
      if (data.watermark_crest) {
        const crestUrl = resolveUrl(data.watermark_crest);
        const heroBgWrap = document.querySelector('.hero-bg-artwork-wrap, .athena-hero');
        if (heroBgWrap) {
          let crestImg = document.querySelector('#cmsWatermarkCrest');
          if (!crestImg) {
            crestImg = document.createElement('img');
            crestImg.id = 'cmsWatermarkCrest';
            crestImg.alt = '寺澤景子税理士事務所 象徴紋章';
            crestImg.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width: clamp(320px, 45vw, 650px); opacity:0.045; pointer-events:none; z-index:1;';
            heroBgWrap.insertBefore(crestImg, heroBgWrap.firstChild);
          }
          crestImg.src = crestUrl;
        }
      }

      // ------------------------------------------------------------------------
      // 03. ヒーロー象徴アート (hero_illustration)
      // ------------------------------------------------------------------------
      if (data.hero_illustration) {
        const heroArtUrl = resolveUrl(data.hero_illustration);
        document.querySelectorAll('.hero-illustration-img, .hero-bg-artwork-img').forEach(img => {
          img.src = heroArtUrl;
        });
      }

      // ------------------------------------------------------------------------
      // 04. 代表税理士 寺澤景子 写真 (rep_keiko)
      // ------------------------------------------------------------------------
      if (data.rep_keiko) {
        const keikoUrl = resolveUrl(data.rep_keiko);
        const keikoFrame = document.querySelector('#team .representative-photo-frame:first-of-type, [data-rep="keiko"] .representative-photo-frame');
        if (keikoFrame) {
          keikoFrame.innerHTML = `<img src="${keikoUrl}" alt="代表税理士 寺澤景子" class="representative-photo-img" style="width:100%; height:100%; object-fit:cover; display:block;"><span class="representative-overlay-text">Keiko Terazawa</span>`;
        }
      }

      // ------------------------------------------------------------------------
      // 05. 副代表・ベテラン税理士 田河定茂 写真 (rep_senior)
      // ------------------------------------------------------------------------
      if (data.rep_senior) {
        const seniorUrl = resolveUrl(data.rep_senior);
        const seniorFrame = document.querySelector('#team .representative-photo-frame:last-of-type, [data-rep="senior"] .representative-photo-frame');
        if (seniorFrame) {
          seniorFrame.innerHTML = `<img src="${seniorUrl}" alt="副代表・ベテラン税理士 田河定茂" class="representative-photo-img" style="width:100%; height:100%; object-fit:cover; display:block;"><span class="representative-overlay-text">Senior Tax Advisor</span>`;
        }
      }

      // ------------------------------------------------------------------------
      // 06. 選ばれる理由01〜05 (about_01 〜 about_05)
      // ------------------------------------------------------------------------
      const aboutKeys = ['about_01', 'about_02', 'about_03', 'about_04', 'about_05'];
      const aboutItems = document.querySelectorAll('#about .athena-zigzag-item');
      let aboutCounter = 0;

      aboutItems.forEach((item, idx) => {
        const key = item.getAttribute('data-about-key') || aboutKeys[idx];
        const rawImg = data[key];
        const imgPath = resolveUrl(rawImg);
        const slot = item.querySelector('.zigzag-visual-slot');

        if (imgPath && slot) {
          // 画像がある時：枠を展開して写真を挿入し、左右交互（ジグザグ）化
          const isReverse = (aboutCounter % 2 === 1);
          aboutCounter++;
          item.classList.remove('has-no-image');
          if (isReverse) {
            item.classList.add('is-reverse');
          } else {
            item.classList.remove('is-reverse');
          }
          slot.style.display = '';
          const titleEl = item.querySelector('.zigzag-heading');
          const altText = titleEl ? titleEl.textContent.trim().replace(/\s+/g, ' ') : '選ばれる理由';
          slot.innerHTML = `<img src="${imgPath}" alt="${altText}" class="zigzag-visual-img" style="width:100%; height:100%; object-fit:cover; display:block;">`;
        } else if (slot) {
          // 画像が無い時：枠を跡形もなく完全に消去し、100%全幅レイアウトを維持
          item.classList.add('has-no-image');
          item.classList.remove('is-reverse');
          slot.style.display = 'none';
          slot.innerHTML = '';
        }
      });

      // ------------------------------------------------------------------------
      // 07. サービス01〜07 (service_01 〜 service_07)
      // ------------------------------------------------------------------------
      const serviceKeys = ['service_01', 'service_02', 'service_03', 'service_04', 'service_05', 'service_06', 'service_07'];
      const serviceCards = document.querySelectorAll('#servicesContainer .service-card-item, #services .service-card-item');
      let serviceCounter = 0;

      serviceCards.forEach((card, idx) => {
        const key = card.getAttribute('data-service-key') || serviceKeys[idx];
        const rawImg = data[key];
        const imgPath = resolveUrl(rawImg);
        const slot = card.querySelector('.service-card-img-slot, .zigzag-visual-slot');

        if (imgPath && slot) {
          // 画像がある時：枠を展開して写真を挿入し、左右交互（ジグザグ）化
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
          const titleEl = card.querySelector('.service-card-title, .zigzag-heading');
          const altText = titleEl ? titleEl.textContent.trim() : 'サービス案内';
          slot.innerHTML = `<img src="${imgPath}" alt="${altText}" class="service-card-img zigzag-visual-img" style="width:100%; height:100%; object-fit:cover; border-radius:var(--radius-md); display:block;">`;
        } else if (slot) {
          // 画像が無い時：枠を跡形もなく完全に消去し、100%全幅レイアウトを維持
          card.classList.add('no-image', 'has-no-image');
          card.classList.remove('with-image', 'is-reverse');
          slot.style.display = 'none';
          slot.innerHTML = '';
        }
      });

      // ------------------------------------------------------------------------
      // 08. 下部CTAバナー背景画像 (cta_banner_bg)
      // ------------------------------------------------------------------------
      if (data.cta_banner_bg) {
        const ctaBgUrl = resolveUrl(data.cta_banner_bg);
        document.querySelectorAll('.cta-banner-section, section:has(.cta-heading)').forEach(sec => {
          sec.style.backgroundImage = `linear-gradient(rgba(27, 42, 74, 0.88), rgba(27, 42, 74, 0.92)), url('${ctaBgUrl}')`;
          sec.style.backgroundSize = 'cover';
          sec.style.backgroundPosition = 'center';
        });
      }

    } catch (err) {
      console.warn('[TERAZAWA] CMS Images sync error:', err);
    }
  }

  // 実行トリガー
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncAllCmsImages);
  } else {
    syncAllCmsImages();
  }
})();
