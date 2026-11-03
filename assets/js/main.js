(function () {
  'use strict';

  function resolveUrl(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const clean = raw.trim().replace(/^(\.\/|\/)+/, '').replace(/^terazawazeirishi\//, '');
    const path = (!clean.includes('/') && !clean.startsWith('data:')) ? 'assets/images/uploads/' + clean : clean;
    return './' + path + '?t=' + Date.now();
  }

  function setImg(target, src, alt, maxW, h) {
    if (!src) return;
    document.querySelectorAll(target).forEach(function (el) {
      el.textContent = '';
      const img = document.createElement('img');
      img.src = src;
      img.alt = alt || '';
      img.style.cssText = 'width:100%;max-width:' + maxW + 'px;height:' + h + ';object-fit:cover;border-radius:8px;display:block;margin:0 auto;';
      el.appendChild(img);
    });
  }

  async function syncImages() {
    try {
      const res = await fetch('./content/site_images.json?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const d = await res.json();

      // 1. 代表税理士（寺澤景子）: 1つ目の写真枠に260px固定で挿入
      if (d.rep_keiko) setImg('.representative-card:first-child .representative-photo-frame, .rep-photo-keiko', resolveUrl(d.rep_keiko), '寺澤景子 代表税理士', 260, '260px');

      // 2. 副代表（田河定茂）: 2つ目の写真枠に260px固定で挿入
      if (d.rep_senior) setImg('.representative-card:last-child .representative-photo-frame, .rep-photo-senior', resolveUrl(d.rep_senior), '田河定茂 副代表税理士', 260, '260px');

      // 3. 選ばれる理由01〜05: 各行の写真枠に挿入
      const placeholders = document.querySelectorAll('.about-photo-placeholder, .features-zigzag-list .feature-img-col');
      for (let i = 1; i <= 5; i++) {
        const key = 'about_0' + i;
        if (d[key] && placeholders[i - 1]) {
          placeholders[i - 1].textContent = '';
          const img = document.createElement('img');
          img.src = resolveUrl(d[key]);
          img.alt = '選ばれる理由 ' + i;
          img.style.cssText = 'width:100%;max-width:500px;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:8px;display:block;margin:0 auto;';
          placeholders[i - 1].appendChild(img);
        }
      }

      // 4. ロゴ
      if (d.logo_img) {
        document.querySelectorAll('.site-logo img').forEach(function(img){ img.src = resolveUrl(d.logo_img); });
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncImages);
  } else {
    syncImages();
  }
})();
