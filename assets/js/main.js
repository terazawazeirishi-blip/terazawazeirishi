(function () {
  'use strict';

  // 画面右下に診断結果を小さく表示する安全機能
  function showStatus(msg, isErr) {
    let b = document.getElementById('cms-status-indicator');
    if (!b) {
      b = document.createElement('div');
      b.id = 'cms-status-indicator';
      b.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:99999;background:' + (isErr ? '#e74c3c' : '#27ae60') + ';color:#fff;padding:6px 12px;border-radius:4px;font-size:12px;font-family:sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
      document.body.appendChild(b);
    }
    b.textContent = msg;
  }

  function resolveUrl(path) {
    if (!path) return '';
    let c = path.trim().replace(/^(\.\/|\/)+/, '').replace(/^terazawazeirishi\//, '');
    if (!c.includes('/') && !c.startsWith('data:')) c = 'assets/images/uploads/' + c;
    return './' + c + '?t=' + Date.now();
  }

  // 文字を含む最も内側の写真枠を探して画像を安全に入れる
  function replaceFrameByText(searchText, imgUrl, maxW, isSquare) {
    if (!imgUrl) return false;
    const all = document.querySelectorAll('div, p, span');
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      // 自分自身にその文字があり、子要素にdivを持たない「枠そのもの」を特定
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
      const res = await fetch('./content/site_images.json?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) {
        showStatus('エラー: site_images.jsonが見つかりません (' + res.status + ')', true);
        return;
      }
      const data = await res.json();

      let hitCount = 0;
      // 代表税理士
      if (data.rep_keiko && replaceFrameByText('Keiko Terazawa', resolveUrl(data.rep_keiko), 260, true)) hitCount++;
      // 副代表
      if (data.rep_senior && replaceFrameByText('Senior Tax Advisor', resolveUrl(data.rep_senior), 260, true)) hitCount++;
      // 選ばれる理由01〜05
      if (data.about_01 && replaceFrameByText('2人体制写真', resolveUrl(data.about_01), 500, false)) hitCount++;
      if (data.about_02 && replaceFrameByText('調査防衛枠', resolveUrl(data.about_02), 500, false)) hitCount++;
      if (data.about_03 && replaceFrameByText('実務枠', resolveUrl(data.about_03), 500, false)) hitCount++;
      if (data.about_04 && replaceFrameByText('社労士連携枠', resolveUrl(data.about_04), 500, false)) hitCount++;
      if (data.about_05 && replaceFrameByText('花のあるサロン枠', resolveUrl(data.about_05), 500, false)) hitCount++;

      showStatus('CMS同期: ' + hitCount + '箇所の写真を反映完了', false);
    } catch (err) {
      showStatus('実行エラー: ' + err.message, true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
