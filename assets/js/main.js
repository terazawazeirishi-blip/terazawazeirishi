(function () {
  'use strict';

  // blog/ 階層の場合は '../' 、トップ等の場合は './' に自動補正
  const isBlog = window.location.pathname.indexOf('/blog/') !== -1;
  const basePath = isBlog ? '../' : './';

  function resolveUrl(path) {
    if (!path) return '';
    let c = path.trim().replace(/^(\.\/|\/)+/, '').replace(/^terazawazeirishi\//, '');
    if (!c.includes('/') && !c.startsWith('data:')) c = 'assets/images/uploads/' + c;
    return basePath + c + '?t=' + Date.now();
  }

  function replaceFrameByText(searchText, imgUrl, maxW, isSquare) {
    if (!imgUrl) return false;
    const all = document.querySelectorAll('div, p, span');
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (el.textContent.includes(searchText) && el.querySelectorAll('div').length === 0) {
        const frame = el.closest('div') || el;
        frame.textContent = '';
        const img = document.createElement('img');
        img.src = imgUrl;
        img.style.cssText = 'width:100%;max-width:' + maxW + 'px;' + (isSquare ? 'height:' + maxW + 'px;' : 'height:auto;aspect-ratio:4/3;') + 'object-fit:cover;border-radius:8px;display:block;margin:0 auto;';
        frame.appendChild(img);
        return true;
      }
    }
    return false;
  }

  async function run() {
    try {
      // 階層に応じた正しいパスでJSONを取得
      const res = await fetch(basePath + 'content/site_images.json?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();

      // 代表税理士・副代表写真
      if (data.rep_keiko) replaceFrameByText('Keiko Terazawa', resolveUrl(data.rep_keiko), 260, true);
      if (data.rep_senior) replaceFrameByText('Senior Tax Advisor', resolveUrl(data.rep_senior), 260, true);

      // 選ばれる理由01〜05
      if (data.about_01) replaceFrameByText('2人体制写真', resolveUrl(data.about_01), 500, false);
      if (data.about_02) replaceFrameByText('調査防衛枠', resolveUrl(data.about_02), 500, false);
      if (data.about_03) replaceFrameByText('実務枠', resolveUrl(data.about_03), 500, false);
      if (data.about_04) replaceFrameByText('社労士連携枠', resolveUrl(data.about_04), 500, false);
      if (data.about_05) replaceFrameByText('花のあるサロン枠', resolveUrl(data.about_05), 500, false);

      // ロゴ
      if (data.logo_img) {
        document.querySelectorAll('.site-logo img').forEach(function(img){ img.src = resolveUrl(data.logo_img); });
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
