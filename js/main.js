/**
 * ミネルヴァ税理士法人 SPAルーター ＆ UIインタラクション
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. メガドロワー開閉制御
  const megaMenuBtn = document.getElementById('megaMenuBtn');
  const megaDrawer = document.getElementById('megaDrawer');

  window.toggleDrawer = function() {
    if (megaDrawer) {
      megaDrawer.classList.toggle('active');
    }
  };

  if (megaMenuBtn) {
    megaMenuBtn.addEventListener('click', window.toggleDrawer);
  }

  // 2. SPAページルーター（全リンクの相互遷移制御）
  window.navigateTo = function(viewKey, scrollToId = null) {
    // 全てのビューを非表示
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.remove('active');
    });

    // 目的のビューを表示
    const targetView = document.getElementById(`view-${viewKey}`);
    if (targetView) {
      targetView.classList.add('active');
      
      if (scrollToId) {
        setTimeout(() => {
          const el = document.getElementById(scrollToId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // 3. URLハッシュ連動（ブラウザの「戻る・進む」に対応）
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const viewMap = {
        'home': 'home',
        'about': 'about',
        'services': 'home',
        'service-tax': 'service-tax',
        'service-startup': 'service-startup',
        'service-finance': 'service-finance',
        'service-subsidy': 'service-subsidy',
        'service-bpo': 'service-bpo',
        'service-dd': 'service-dd',
        'service-global': 'service-global',
        'company-overview': 'company-overview',
        'company-message': 'company-message',
        'company-faq': 'company-faq',
        'price': 'price',
        'recruit': 'recruit',
        'column': 'column',
        'contact': 'contact'
      };
      if (viewMap[hash]) {
        window.navigateTo(viewMap[hash], hash === 'services' ? 'services' : null);
      }
    } else {
      window.navigateTo('home');
    }
  });

  // 初回アクセス時のハッシュチェック
  if (window.location.hash) {
    window.dispatchEvent(new Event('hashchange'));
  }
});
