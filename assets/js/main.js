/**
 * ==============================================================================
 * 寺沢景子税理士事務所 公式Webサイト クライアントスクリプト（完全修復安定版）
 * ファイルパス: assets/js/main.js
 * 仕様: API-Key-Free / services.html サービス画像01〜07完全連動修復
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
    syncCmsImages(); // ★ 画像自動同期
  }

  /* 1. スクロール影 */
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

  /* 2. モバイルナビ */
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

  /* 3. FAQアコーディオン */
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

  /* 4. スムーススクロール */
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

  /* 5. 【完全修復版】Pages CMS 画像自動同期エンジン */
  function syncCmsImages() {
    const pathParts = window.location.pathname.split('/');
    let repoBase = '/';
    const repoIndex = pathParts.indexOf('terazawazeirishi');
    if (repoIndex !== -1) {
      repoBase = pathParts.slice(0, repoIndex + 1).join('/') + '/';
    }

    const jsonUrl = repoBase + 'content/site_images.json?v=' + Date.now();

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error('site_images.json HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        // パス解決ヘルパー
        const resolveImgUrl = (rawPath) => {
          if (!rawPath || typeof rawPath !== 'string') return '';
          const trimmed = rawPath.trim();
          if (!trimmed) return '';
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
          let clean = trimmed.replace(/^(\.\/|\/)/, '');
          if (clean.startsWith('terazawazeirishi/')) {
            clean = clean.replace('terazawazeirishi/', '');
          }
          return repoBase + clean;
        };

        // --- A. 税理士写真（寺沢代表 ＆ ベテラン税理士） ---
        const photoFrames = document.querySelectorAll('.representative-photo-frame');
        if (photoFrames.length >= 1 && data.rep_keiko) {
          const keikoUrl = resolveImgUrl(data.rep_keiko);
          if (keikoUrl) {
            photoFrames[0].innerHTML = `
              <img src="${keikoUrl}" alt="寺沢景子 代表税理士" class="representative-photo-img" style="width:100%; height:100%; object-fit:cover; display:block;">
              <span class="representative-overlay-text">Keiko Terazawa</span>
            `;
          }
        }
        if (photoFrames.length >= 2 && data.rep_senior) {
          const seniorUrl = resolveImgUrl(data.rep_senior);
          if (seniorUrl) {
            photoFrames[1].innerHTML = `
              <img src="${seniorUrl}" alt="ベテラン税理士" class="representative-photo-img" style="width:100%; height:100%; object-fit:cover; display:block;">
              <span class="representative-overlay-text">Senior Tax Advisor</span>
            `;
          }
        }

        // --- B. ヒーロー象徴アート (IMG-01) ---
        if (data.hero_illustration) {
          const heroUrl = resolveImgUrl(data.hero_illustration);
          const heroSlot = document.querySelector('.hero-bg-artwork-slot');
          if (heroSlot && heroUrl) {
            heroSlot.innerHTML = `<img src="${heroUrl}" alt="寺沢景子税理士事務所 象徴アート" class="hero-bg-artwork-img" loading="eager">`;
          }
        }

        // --- C. ロゴ ---
        if (data.logo_img) {
          const logoUrl = resolveImgUrl(data.logo_img);
          if (logoUrl) {
            document.querySelectorAll('.brand-logo-img').forEach((el) => {
              el.outerHTML = `<img src="${logoUrl}" alt="寺沢景子税理士事務所 ロゴ" class="brand-logo-img" style="width:44px; height:44px; object-fit:contain;">`;
            });
          }
        }

        // --- D. ヒーロー透かし (IMG-02) ---
        if (data.watermark_crest) {
          const crestUrl = resolveImgUrl(data.watermark_crest);
          const hero = document.getElementById('hero');
          if (hero && crestUrl) {
            hero.style.backgroundImage = `url('${crestUrl}'), linear-gradient(135deg, #FFFFFF 0%, var(--color-bg-subtle) 60%, var(--color-floral-bg) 100%)`;
            hero.style.backgroundRepeat = 'no-repeat';
            hero.style.backgroundPosition = 'center center';
            hero.style.backgroundSize = '700px auto, cover';
          }
        }

        // --- E. About us 01〜05 ジグザグ写真 ---
        const aboutKeys = ['about_01', 'about_02', 'about_03', 'about_04', 'about_05'];
        document.querySelectorAll('.athena-zigzag-item .zigzag-visual-slot').forEach((slot, idx) => {
          const k = aboutKeys[idx];
          if (data[k]) {
            const u = resolveImgUrl(data[k]);
            if (u) {
              slot.innerHTML = `<img src="${u}" alt="About理由 ${idx + 1}" class="zigzag-visual-img" style="width:100%; height:100%; object-fit:cover;">`;
            }
          }
        });

        // --- F. 【完全修復】サービス写真 01〜07（トップページ ＆ services.html 両対応） ---
        const serviceKeys = ['service_01', 'service_02', 'service_03', 'service_04', 'service_05', 'service_06', 'service_07'];

        // トップページのサービスカード
        document.querySelectorAll('.service-card-item .service-card-img-slot').forEach((slot, idx) => {
          const k = serviceKeys[idx];
          if (data[k]) {
            const imgUrl = resolveImgUrl(data[k]);
            if (imgUrl) {
              slot.innerHTML = `<img src="${imgUrl}" alt="サービス写真 ${idx + 1}" class="service-card-img" style="width:100%; height:100%; object-fit:cover;">`;
            }
          }
        });

        // services.html の各個別サービス詳細枠（★バグ完全除去）
        const serviceDetailIds = ['#corporate', '#audit', '#startup', '#finance', '#cloud', '#inheritance', '#labor'];
        serviceDetailIds.forEach((id, idx) => {
          const k = serviceKeys[idx];
          if (data[k]) {
            const imgUrl = resolveImgUrl(data[k]); // ★確実にURLを定義
            if (imgUrl) {
              const article = document.querySelector(id);
              if (article) {
                const imgSlot = article.querySelector('.zigzag-visual-slot');
                if (imgSlot) {
                  imgSlot.innerHTML = `<img src="${imgUrl}" alt="サービス詳細 ${idx + 1}" class="zigzag-visual-img" style="width:100%; height:100%; object-fit:cover; display:block;">`;
                }
              }
            }
          }
        });

        // --- G. CTAバナー背景 ---
        if (data.cta_banner_bg) {
          const ctaUrl = resolveImgUrl(data.cta_banner_bg);
          if (ctaUrl) {
            document.querySelectorAll('section[style*="linear-gradient"]').forEach((banner) => {
              banner.style.backgroundImage = `linear-gradient(rgba(15, 24, 41, 0.88), rgba(27, 42, 74, 0.92)), url('${ctaUrl}')`;
              banner.style.backgroundSize = 'cover';
              banner.style.backgroundPosition = 'center';
            });
          }
        }
      })
      .catch((err) => {
        console.warn('CMS Image Sync status:', err.message);
      });
  }
})();
