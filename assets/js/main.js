/**
 * 寺沢景子税理士事務所 公式Webサイト クライアントスクリプト
 * ファイルパス: assets/js/main.js
 * 機能: ヘッダー制御 / メニュー開閉 / スムーススクロール / 【NEW】CMS画像自動反映
 * 仕様: API-Key-Free / Pure Vanilla JS / Zero Dependency
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', initApp);

  function initApp() {
    initHeaderScroll();
    initMobileNav();
    initFaqAccordion();
    initSmoothScroll();
    applyCmsImages(); // ★ CMSで設定された画像を自動反映
  }

  /**
   * 1. スクロール検知によるヘッダーのシャドウ付与
   */
  function initHeaderScroll() {
    const header = document.getElementById('siteHeader');
    if (!header) return;

    const handleScroll = () => {
      if (window.scrollY > 20) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  /**
   * 2. スマホ用ハンバーガーメニューの開閉制御
   */
  function initMobileNav() {
    const btn = document.getElementById('hamburgerBtn');
    const nav = document.getElementById('headerNav');
    if (!btn || !nav) return;

    btn.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    const navLinks = nav.querySelectorAll('.nav-link, .header-cta-btn');
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    });
  }

  /**
   * 3. FAQアコーディオン開閉制御
   */
  function initFaqAccordion() {
    const accordions = document.querySelectorAll('.faq-accordion-item');
    if (!accordions.length) return;

    accordions.forEach((item) => {
      const trigger = item.querySelector('.faq-question-btn');
      const content = item.querySelector('.faq-answer-pane');
      if (!trigger || !content) return;

      trigger.addEventListener('click', () => {
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', !isExpanded);
        content.hidden = isExpanded;
        item.classList.toggle('is-active', !isExpanded);
      });
    });
  }

  /**
   * 4. ページ内アンカースムーススクロール
   */
  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    const headerHeight = 84;

    links.forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || targetId === '') return;

        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /**
   * 5. 【NEW】Pages CMSの画像設定（content/site_images.json）を自動反映
   */
  function applyCmsImages() {
    // サブディレクトリや下層ページからの相対パスを調整
    const jsonPath = window.location.pathname.includes('/blog/') 
      ? '../content/site_images.json' 
      : './content/site_images.json';

    fetch(jsonPath)
      .then((res) => {
        if (!res.ok) throw new Error('site_images.json not found');
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        // パス補正（CMSが assets/... で保存したパスを相対パス化）
        const formatPath = (p) => {
          if (!p) return '';
          if (p.startsWith('http') || p.startsWith('./') || p.startsWith('../')) return p;
          return window.location.pathname.includes('/blog/') ? '../' + p : './' + p;
        };

        // ① ヒーロー背景イラスト
        if (data.hero_illustration) {
          const heroSlot = document.querySelector('.hero-bg-artwork-slot');
          if (heroSlot) {
            heroSlot.innerHTML = `<img src="${formatPath(data.hero_illustration)}" alt="寺沢景子税理士事務所 メインイラスト" class="hero-bg-artwork-img" loading="eager">`;
          }
        }

        // ② 寺沢景子 代表写真（トップおよびプロフィールページ）
        if (data.rep_keiko) {
          const repKeikoFrames = document.querySelectorAll('.representative-photo-frame:first-of-type, [data-rep="keiko"]');
          repKeikoFrames.forEach((frame) => {
            const existingImg = frame.querySelector('.representative-photo-img');
            if (existingImg) {
              frame.innerHTML = `<img src="${formatPath(data.rep_keiko)}" alt="寺沢景子 代表税理士" class="representative-photo-img" style="width:100%; height:100%; object-fit:cover;"><span class="representative-overlay-text">Keiko Terazawa</span>`;
            }
          });
        }

        // ③ ベテラン税理士 写真
        if (data.rep_senior) {
          const repSeniorFrames = document.querySelectorAll('[data-rep="senior"]');
          repSeniorFrames.forEach((frame) => {
            frame.innerHTML = `<img src="${formatPath(data.rep_senior)}" alt="ベテラン税理士" class="representative-photo-img" style="width:100%; height:100%; object-fit:cover;"><span class="representative-overlay-text">Senior Tax Advisor</span>`;
          });
        }

        // ④〜⑧ About us 01〜05 ジグザグ写真
        const aboutKeys = ['about_01', 'about_02', 'about_03', 'about_04', 'about_05'];
        const zigzagSlots = document.querySelectorAll('.athena-zigzag-item .zigzag-visual-slot');
        zigzagSlots.forEach((slot, index) => {
          const key = aboutKeys[index];
          if (data[key]) {
            slot.innerHTML = `<img src="${formatPath(data[key])}" alt="About ${index + 1}" class="zigzag-visual-img" style="width:100%; height:100%; object-fit:cover;">`;
          }
        });
      })
      .catch((err) => {
        // JSONが未作成または読み込み失敗時は、HTML初期埋め込みのSVGがそのまま表示されます
        console.log('CMS images: using defaults.');
      });
  }
})();