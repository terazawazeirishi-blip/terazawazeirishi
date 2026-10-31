/**
 * ==============================================================================
 * 寺沢景子税理士事務所 公式Webサイト クライアントスクリプト（完全自動写真連動版）
 * ファイルパス: assets/js/main.js
 * 仕様: API-Key-Free / キャッシュバスター完備 / 税理士写真自動判別100%連動
 * ==============================================================================
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', initApp);

  function initApp() {
    initHeaderScroll();
    initMobileNav();
    initFaqAccordion();
    initSmoothScroll();
    applyAllCmsImages(); // ★ 全画像の完全自動反映
  }

  /**
   * 1. ヘッダースクロール影
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
   * 2. スマホメニュー
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
   * 3. FAQアコーディオン
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
   * 4. スムーススクロール
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
   * 5. 【完全版】Pages CMS 全画像自動反映（税理士写真100%検知・キャッシュ無効化）
   */
  function applyAllCmsImages() {
    const isBlogSubdir = window.location.pathname.includes('/blog/');
    const basePath = isBlogSubdir ? '../content/site_images.json' : './content/site_images.json';
    
    // キャッシュバスター（常に最新データを取得する）
    const jsonUrl = basePath + '?t=' + Date.now();

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error('site_images.json not found');
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        // 相対パス正規化関数（サブディレクトリ404を完全に防ぐ）
        const toUrl = (p) => {
          if (!p) return '';
          if (p.startsWith('http://') || p.startsWith('https://')) return p;
          // 先頭のスラッシュやドットを徹底除去
          const clean = p.replace(/^(\.\/|\/)/, '');
          return isBlogSubdir ? '../' + clean : './' + clean;
        };

        // --- A. 税理士ポートレート写真（★ページ内の写真枠を上から順に自動特定） ---
        const photoFrames = document.querySelectorAll('.representative-photo-frame');
        
        // 1番目の枠 ➜ 寺沢景子 代表税理士
        if (photoFrames.length >= 1 && data.rep_keiko) {
          photoFrames[0].innerHTML = `
            <img src="${toUrl(data.rep_keiko)}" alt="寺沢景子 代表税理士" class="representative-photo-img" style="width:100%; height:100%; object-fit:cover; display:block;">
            <span class="representative-overlay-text">Keiko Terazawa</span>
          `;
        }
        
        // 2番目の枠 ➜ ベテラン税理士［お名前仮入力］
        if (photoFrames.length >= 2 && data.rep_senior) {
          photoFrames[1].innerHTML = `
            <img src="${toUrl(data.rep_senior)}" alt="ベテラン税理士" class="representative-photo-img" style="width:100%; height:100%; object-fit:cover; display:block;">
            <span class="representative-overlay-text">Senior Tax Advisor</span>
          `;
        }

        // --- B. ヒーローメイン背景イラスト (IMG-01) ---
        if (data.hero_illustration) {
          const heroSlot = document.querySelector('.hero-bg-artwork-slot');
          if (heroSlot) {
            heroSlot.innerHTML = `<img src="${toUrl(data.hero_illustration)}" alt="寺沢景子税理士事務所 象徴アート" class="hero-bg-artwork-img" loading="eager">`;
          }
        }

        // --- C. ロゴ ---
        if (data.logo_img) {
          const logos = document.querySelectorAll('.brand-logo-img');
          logos.forEach((logo) => {
            logo.outerHTML = `<img src="${toUrl(data.logo_img)}" alt="寺沢景子税理士事務所 ロゴ" class="brand-logo-img" style="width:44px; height:44px; object-fit:contain;">`;
          });
        }

        // --- D. ヒーロー透かし (IMG-02) ---
        if (data.watermark_crest) {
          const hero = document.getElementById('hero');
          if (hero) {
            hero.style.backgroundImage = `url('${toUrl(data.watermark_crest)}'), linear-gradient(135deg, #FFFFFF 0%, var(--color-bg-subtle) 60%, var(--color-floral-bg) 100%)`;
            hero.style.backgroundRepeat = 'no-repeat';
            hero.style.backgroundPosition = 'center center';
            hero.style.backgroundSize = '700px auto, cover';
          }
        }

        // --- E. About us 01〜05 ジグザグ写真 ---
        const aboutKeys = ['about_01', 'about_02', 'about_03', 'about_04', 'about_05'];
        const zigzagSlots = document.querySelectorAll('.athena-zigzag-item .zigzag-visual-slot');
        zigzagSlots.forEach((slot, idx) => {
          const k = aboutKeys[idx];
          if (data[k]) {
            slot.innerHTML = `<img src="${toUrl(data[k])}" alt="About理由 ${idx + 1}" class="zigzag-visual-img" style="width:100%; height:100%; object-fit:cover;">`;
          }
        });

        // --- F. サービス写真 01〜07（トップ＆詳細連動） ---
        const serviceKeys = ['service_01', 'service_02', 'service_03', 'service_04', 'service_05', 'service_06', 'service_07'];
        const topServiceSlots = document.querySelectorAll('.service-card-item .service-card-img-slot');
        topServiceSlots.forEach((slot, idx) => {
          const k = serviceKeys[idx];
          if (data[k]) {
            slot.innerHTML = `<img src="${toUrl(data[k])}" alt="サービス写真 ${idx + 1}" class="service-card-img" style="width:100%; height:100%; object-fit:cover;">`;
          }
        });

        const serviceDetailIds = ['#corporate', '#audit', '#startup', '#finance', '#cloud', '#inheritance', '#labor'];
        serviceDetailIds.forEach((id, idx) => {
          const k = serviceKeys[idx];
          if (data[k]) {
            const article = document.querySelector(id);
            if (article) {
              const imgSlot = article.querySelector('.zigzag-visual-slot');
              if (imgSlot) {
                imgSlot.innerHTML = `<img src="${toUrl(data[k])}" alt="サービス詳細 ${idx + 1}" class="zigzag-visual-img" style="width:100%; height:100%; object-fit:cover;">`;
              }
            }
          }
        });

        // --- G. CTAバナー背景写真 ---
        if (data.cta_banner_bg) {
          const ctaBanners = document.querySelectorAll('section[style*="linear-gradient"]');
          ctaBanners.forEach((banner) => {
            banner.style.backgroundImage = `linear-gradient(rgba(15, 24, 41, 0.88), rgba(27, 42, 74, 0.92)), url('${toUrl(data.cta_banner_bg)}')`;
            banner.style.backgroundSize = 'cover';
            banner.style.backgroundPosition = 'center';
          });
        }
      })
      .catch((err) => {
        console.log('CMS images: using defaults.');
      });
  }
})();
