/**
 * ==============================================================================
 * 寺沢景子税理士事務所 公式Webサイト クライアントスクリプト（全テキストノーコード完全版）
 * ファイルパス: assets/js/main.js
 * 仕様: 画像・コラム・FAQ・料金・サービス・事務所情報・トップ全文章完全自動同期
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
    syncCmsImages();
    syncOfficeInfo();
    syncHomeTexts(); // ★ トップページ全文章自動同期
  }

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

  function initFaqAccordion() {
    const accordions = document.querySelectorAll('.faq-accordion-item');
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

  function getRepoBase() {
    const pathParts = window.location.pathname.split('/');
    let repoBase = '/';
    const repoIndex = pathParts.indexOf('terazawazeirishi');
    if (repoIndex !== -1) {
      repoBase = pathParts.slice(0, repoIndex + 1).join('/') + '/';
    }
    return repoBase;
  }

  function syncCmsImages() {
    const repoBase = getRepoBase();
    const jsonUrl = repoBase + 'content/site_images.json?v=' + Date.now();

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error('site_images.json HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        if (!data) return;

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

        if (data.hero_illustration) {
          const heroUrl = resolveImgUrl(data.hero_illustration);
          const heroSlot = document.querySelector('.hero-bg-artwork-slot');
          if (heroSlot && heroUrl) {
            heroSlot.innerHTML = `<img src="${heroUrl}" alt="寺沢景子税理士事務所 象徴アート" class="hero-bg-artwork-img" loading="eager">`;
          }
        }

        if (data.logo_img) {
          const logoUrl = resolveImgUrl(data.logo_img);
          if (logoUrl) {
            document.querySelectorAll('.brand-logo-img').forEach((el) => {
              el.outerHTML = `<img src="${logoUrl}" alt="寺沢景子税理士事務所 ロゴ" class="brand-logo-img" style="width:44px; height:44px; object-fit:contain;">`;
            });
          }
        }

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

        const aboutKeys = ['about_01', 'about_02', 'about_03', 'about_04', 'about_05'];
        document.querySelectorAll('.athena-about-section .athena-zigzag-item .zigzag-visual-slot').forEach((slot, idx) => {
          const k = aboutKeys[idx];
          if (data[k]) {
            const u = resolveImgUrl(data[k]);
            if (u) {
              slot.innerHTML = `<img src="${u}" alt="About理由 ${idx + 1}" class="zigzag-visual-img" style="width:100%; height:100%; object-fit:cover;">`;
            }
          }
        });

        const serviceKeys = ['service_01', 'service_02', 'service_03', 'service_04', 'service_05', 'service_06', 'service_07'];
        document.querySelectorAll('.service-card-item .service-card-img-slot').forEach((slot, idx) => {
          const k = serviceKeys[idx];
          if (data[k]) {
            const imgUrl = resolveImgUrl(data[k]);
            if (imgUrl) {
              slot.innerHTML = `<img src="${imgUrl}" alt="サービス写真 ${idx + 1}" class="service-card-img" style="width:100%; height:100%; object-fit:cover;">`;
            }
          }
        });

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

  function syncOfficeInfo() {
    const repoBase = getRepoBase();
    const jsonUrl = repoBase + 'content/office_info.json?v=' + Date.now();

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error('office_info.json HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        if (data.tel) {
          document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
            a.setAttribute('href', 'tel:' + data.tel.replace(/-/g, ''));
            const span = a.querySelector('span');
            if (span && span.textContent.includes('0969')) {
              span.textContent = data.tel;
            } else if (!span && a.textContent.includes('0969')) {
              a.textContent = data.tel;
            }
          });
        }

        document.querySelectorAll('.office-table tr').forEach((tr) => {
          const th = tr.querySelector('th');
          const td = tr.querySelector('td');
          if (!th || !td) return;
          const thText = th.textContent.trim();

          if (thText.includes('所在地') && data.address) {
            td.textContent = (data.postal_code ? '〒' + data.postal_code + ' ' : '') + data.address;
          } else if (thText.includes('営業時間') && data.opening_hours) {
            td.textContent = data.opening_hours;
          } else if (thText.includes('対応エリア') && data.areas) {
            td.textContent = data.areas;
          } else if (thText.includes('FAX') && data.fax) {
            td.textContent = data.fax;
          }
        });

        const teamCards = document.querySelectorAll('#team .representative-photo-frame, .message-grid');
        if (teamCards.length >= 1 && data.rep_message) {
          const repTextEl = document.querySelector('#team > div > div > div:first-child p:last-child');
          if (repTextEl) repTextEl.textContent = data.rep_message;
        }
        if (teamCards.length >= 2 && data.senior_message) {
          const seniorTextEl = document.querySelector('#team > div > div > div:last-child p:last-child');
          if (seniorTextEl) seniorTextEl.textContent = data.senior_message;
        }
      })
      .catch((err) => {
        console.warn('Office Info Sync status:', err.message);
      });
  }

  /* ★【新設】トップページ全文章自動同期エンジン */
  function syncHomeTexts() {
    if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && !window.location.pathname.endsWith('/terazawazeirishi/')) {
      return; // トップページ以外の時はスキップ
    }

    const repoBase = getRepoBase();
    const jsonUrl = repoBase + 'content/home_texts.json?v=' + Date.now();

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error('home_texts.json HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        // 1. ヒーローテキスト
        if (data.hero_title) {
          const titleEl = document.querySelector('.hero-main-title');
          if (titleEl) titleEl.innerHTML = data.hero_title.replace(/\n/g, '<br>');
        }
        if (data.hero_lead) {
          const leadEl = document.querySelector('.hero-lead-text');
          if (leadEl) leadEl.innerHTML = data.hero_lead.replace(/\n/g, '<br>');
        }

        // 月桂樹バッジ
        const badgeEls = document.querySelectorAll('.hero-badge-item span');
        if (badgeEls.length >= 3) {
          if (data.badge_1) badgeEls[0].textContent = data.badge_1;
          if (data.badge_2) badgeEls[1].textContent = data.badge_2;
          if (data.badge_3) badgeEls[2].textContent = data.badge_3;
        }

        // ヒーローボタン
        if (data.hero_cta_btn) {
          const btnSpan = document.querySelector('.hero-cta-group .floating-cta-btn span');
          if (btnSpan) btnSpan.textContent = data.hero_cta_btn;
        }

        // 2. About us 01〜05（見出しと本文）
        const zigzagItems = document.querySelectorAll('.athena-zigzag-item');
        zigzagItems.forEach((item, idx) => {
          const num = idx + 1;
          const titleKey = `about_0${num}_title`;
          const descKey = `about_0${num}_desc`;

          const headingEl = item.querySelector('.zigzag-heading');
          const textEl = item.querySelector('.zigzag-text');

          if (headingEl && data[titleKey]) headingEl.innerHTML = data[titleKey].replace(/\n/g, '<br>');
          if (textEl && data[descKey]) textEl.innerHTML = data[descKey].replace(/\n/g, '<br>');
        });

        // 3. 相談の流れ（FLOW STEP 01〜04）
        const flowSteps = document.querySelectorAll('#flow > div > div:last-child > div');
        flowSteps.forEach((step, idx) => {
          const num = idx + 1;
          const titleKey = `flow_0${num}_title`;
          const descKey = `flow_0${num}_desc`;

          const titleEl = step.querySelector('h4');
          const descEl = step.querySelector('p');

          if (titleEl && data[titleKey]) titleEl.textContent = data[titleKey];
          if (descEl && data[descKey]) descEl.textContent = data[descKey];
        });

        // 4. 下部CTAバナー
        const bannerSection = document.querySelector('section[style*="linear-gradient(135deg"]');
        if (bannerSection) {
          if (data.cta_banner_title) {
            const h2 = bannerSection.querySelector('h2');
            if (h2) h2.textContent = data.cta_banner_title;
          }
          if (data.cta_banner_desc) {
            const p = bannerSection.querySelector('p:nth-of-type(2)');
            if (p) p.innerHTML = data.cta_banner_desc.replace(/\n/g, '<br>');
          }
          if (data.cta_banner_btn) {
            const btnSpan = bannerSection.querySelector('.floating-cta-btn span');
            if (btnSpan) btnSpan.textContent = data.cta_banner_btn;
          }
        }
      })
      .catch((err) => {
        console.warn('Home Texts Sync status:', err.message);
      });
  }
})();
