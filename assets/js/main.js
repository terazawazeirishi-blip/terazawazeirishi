/**
 * TERAZAWA WEBSITE STUDIO - Public Rendering & CMS Sync Engine
 * Module: assets/js/main.js
 * Version: 3.9.0 (Dynamic Layout Adapter: Auto-Hide Frame & Full-Width Text)
 */
(function () {
  'use strict';

  // blog/ 階層判定（サブディレクトリ対応）
  const isBlog = window.location.pathname.indexOf('/blog/') !== -1;
  const basePath = isBlog ? '../' : './';

  function resolveUrl(path) {
    if (!path || typeof path !== 'string') return '';
    let c = path.trim().replace(/^(\.\/|\/)+/, '').replace(/^terazawazeirishi\//, '');
    if (!c.includes('/') && !c.startsWith('data:')) c = 'assets/images/uploads/' + c;
    return basePath + c + '?t=' + Date.now();
  }

  // 税理士紹介写真の処理（画像があれば260px枠、なければ枠ごと消去）
  function handleRepresentativePhoto(selector, rawPath, altText) {
    const frame = document.querySelector(selector);
    if (!frame) return;
    const imgUrl = rawPath ? resolveUrl(rawPath) : '';
    if (imgUrl) {
      frame.style.display = '';
      frame.textContent = '';
      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = altText;
      img.style.cssText = 'width: 100%; max-width: 260px; height: 260px; object-fit: cover; border-radius: 8px; display: block; margin: 0 auto; box-shadow: 0 4px 16px rgba(27,42,74,0.08);';
      frame.appendChild(img);
    } else {
      frame.style.display = 'none'; // 画像なし時は枠ごと消去
    }
  }

  async function syncImages() {
    try {
      const res = await fetch(basePath + 'content/site_images.json?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();

      // 1. 代表税理士・副代表写真（画像なし時は枠ごと消去）
      handleRepresentativePhoto('.representative-card:first-child .representative-photo-frame, .rep-photo-keiko', data.rep_keiko, '寺澤景子 代表税理士');
      handleRepresentativePhoto('.representative-card:last-child .representative-photo-frame, .rep-photo-senior', data.rep_senior, '田河定茂 副代表税理士');

      // 2. 選ばれる理由01〜05（画像がある時はジグザグ写真、無い時は枠ごと消して文章を全幅100%に拡大）
      const rows = document.querySelectorAll('.features-zigzag-list .feature-row, .about-row');
      for (let i = 1; i <= 5; i++) {
        const key = 'about_0' + i;
        const rawPath = data[key];
        const imgUrl = rawPath ? resolveUrl(rawPath) : '';
        const row = rows[i - 1];

        if (row) {
          const imgCol = row.querySelector('.feature-img-col, .about-photo-placeholder');
          const textCol = row.querySelector('.feature-text-col');

          if (imgUrl) {
            // ★【画像がある場合】枠を表示して画像を挿入（通常のジグザグレイアウト）
            if (imgCol) {
              imgCol.style.display = '';
              imgCol.textContent = '';
              const img = document.createElement('img');
              img.src = imgUrl;
              img.alt = '選ばれる理由 ' + i;
              img.style.cssText = 'width: 100%; max-width: 500px; height: auto; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; display: block; margin: 0 auto;';
              imgCol.appendChild(img);
            }
            if (textCol) {
              textCol.style.width = '';
              textCol.style.maxWidth = '';
            }
          } else {
            // ★【画像がない場合】写真枠を丸ごと消去し、文章側を横幅いっぱい（全幅）に拡大
            if (imgCol) {
              imgCol.style.display = 'none';
            }
            if (textCol) {
              textCol.style.cssText = 'width: 100% !important; max-width: 100% !important; flex: 1 1 100% !important;';
            }
          }
        }
      }

      // 3. ロゴ
      if (data.logo_img) {
        document.querySelectorAll('.site-logo img').forEach(function (img) {
          img.src = resolveUrl(data.logo_img);
        });
      }

      // 4. ヒーロー象徴アート（画像なし時は枠ごと消去）
      const heroArt = document.querySelector('.hero-bg-artwork-wrap, .athena-hero-art');
      if (heroArt) {
        if (data.hero_illustration) {
          heroArt.style.display = '';
          const img = heroArt.querySelector('img');
          if (img) img.src = resolveUrl(data.hero_illustration);
        } else {
          heroArt.style.display = 'none';
        }
      }

    } catch (e) {
      console.warn('[TERAZAWA] Image sync error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncImages);
  } else {
    syncImages();
  }
})();
