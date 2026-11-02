/**
 * ==============================================================================
 * 寺沢景子税理士事務所 公式Webサイト クライアントスクリプト（全文字完全網羅版）
 * ファイルパス: assets/js/main.js
 * 仕様: 全ページの全文字・全見出し・全タグ・トップサービスカード完全自動連動
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
    syncOfficeInfo();    // 事務所情報・ヘッダー・フッター同期
    syncHomeTexts();     // トップページ全文章同期
    syncProfileTexts();  // 税理士紹介同期
    syncServicesTexts(); // ★ サービス文字をトップと詳細両方に完全連動
    syncPricingTexts();  // ★ 料金ページ見出し同期
    syncFaqTexts();      // ★ FAQページ見出し同期
    syncLegalTexts();    // お問い合わせ・規約同期
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

  /* 画像同期 */
  function syncCmsImages() {
    const repoBase = getRepoBase();
    fetch(repoBase + 'content/site_images.json?v=' + Date.now())
      .then((res) => res.ok ? res.json() : null)
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
          const u = resolveImgUrl(data.rep_keiko);
          if (u) photoFrames[0].innerHTML = `<img src="${u}" alt="寺沢景子 代表税理士" class="representative-photo-img" style="width:100%; height:100%; object-fit:cover; display:block;"><span class="representative-overlay-text">Keiko Terazawa</span>`;
        }
        if (photoFrames.length >= 2 && data.rep_senior) {
          const u = resolveImgUrl(data.rep_senior);
          if (u) photoFrames[1].innerHTML = `<img src="${u}" alt="ベテラン税理士" class="representative-photo-img" style="width:100%; height:100%; object-fit:cover; display:block;"><span class="representative-overlay-text">Senior Tax Advisor</span>`;
        }
        if (data.hero_illustration) {
          const u = resolveImgUrl(data.hero_illustration);
          const slot = document.querySelector('.hero-bg-artwork-slot');
          if (slot && u) slot.innerHTML = `<img src="${u}" alt="寺沢景子税理士事務所 象徴アート" class="hero-bg-artwork-img" loading="eager">`;
        }
        if (data.logo_img) {
          const u = resolveImgUrl(data.logo_img);
          if (u) document.querySelectorAll('.brand-logo-img').forEach((el) => { el.outerHTML = `<img src="${u}" alt="ロゴ" class="brand-logo-img" style="width:44px; height:44px; object-fit:contain;">`; });
        }
        if (data.watermark_crest) {
          const u = resolveImgUrl(data.watermark_crest);
          const hero = document.getElementById('hero');
          if (hero && u) {
            hero.style.backgroundImage = `url('${u}'), linear-gradient(135deg, #FFFFFF 0%, var(--color-bg-subtle) 60%, var(--color-floral-bg) 100%)`;
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
            if (u) slot.innerHTML = `<img src="${u}" alt="About ${idx + 1}" class="zigzag-visual-img" style="width:100%; height:100%; object-fit:cover;">`;
          }
        });
        const serviceKeys = ['service_01', 'service_02', 'service_03', 'service_04', 'service_05', 'service_06', 'service_07'];
        document.querySelectorAll('.service-card-item .service-card-img-slot').forEach((slot, idx) => {
          const k = serviceKeys[idx];
          if (data[k]) {
            const u = resolveImgUrl(data[k]);
            if (u) slot.innerHTML = `<img src="${u}" alt="サービス写真 ${idx + 1}" class="service-card-img" style="width:100%; height:100%; object-fit:cover;">`;
          }
        });
        if (data.cta_banner_bg) {
          const u = resolveImgUrl(data.cta_banner_bg);
          if (u) document.querySelectorAll('section[style*="linear-gradient"]').forEach((b) => {
            b.style.backgroundImage = `linear-gradient(rgba(15, 24, 41, 0.88), rgba(27, 42, 74, 0.92)), url('${u}')`;
            b.style.backgroundSize = 'cover';
            b.style.backgroundPosition = 'center';
          });
        }
      })
      .catch(() => {});
  }

  /* ★ 事務所情報・ヘッダー・フッター完全同期 */
  function syncOfficeInfo() {
    const repoBase = getRepoBase();
    fetch(repoBase + 'content/office_info.json?v=' + Date.now())
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;

        // 事務所名・英語名
        if (data.office_name) {
          document.querySelectorAll('.brand-name, .footer-brand-name').forEach((el) => {
            el.textContent = data.office_name;
          });
        }
        if (data.office_en) {
          document.querySelectorAll('.brand-en, .footer-brand-en').forEach((el) => {
            el.textContent = data.office_en;
          });
        }

        // 電話番号
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

        // 概要テーブル（所在地、営業時間、対応エリア、提携士業）
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
          } else if (thText.includes('提携士業')) {
            if (data.alliance_desc || data.alliance_url) {
              td.innerHTML = `<strong>${data.alliance_desc || 'ザワテラス社労士'}</strong><br><a href="${data.alliance_url || 'https://terazawa-sr.jbcsite.com/'}" target="_blank" rel="noopener noreferrer" style="color: var(--color-accent); font-size: 0.88rem;">${data.alliance_url || 'https://terazawa-sr.jbcsite.com/'} &rarr;</a>`;
            }
          }
        });

        // コピーライト
        if (data.copyright_year) {
          document.querySelectorAll('.footer-bottom p').forEach((p) => {
            p.textContent = data.copyright_year;
          });
        }
      })
      .catch(() => {});
  }

  /* ★ トップページ全見出し・全文章完全同期 */
  function syncHomeTexts() {
    if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && !window.location.pathname.endsWith('/terazawazeirishi/')) {
      return;
    }
    const repoBase = getRepoBase();
    fetch(repoBase + 'content/home_texts.json?v=' + Date.now())
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;

        // ヒーロー
        if (data.hero_sub_en) {
          const el = document.querySelector('.hero-sub-en');
          if (el) el.textContent = data.hero_sub_en;
        }
        if (data.hero_title) {
          const el = document.querySelector('.hero-main-title');
          if (el) el.innerHTML = data.hero_title.replace(/\n/g, '<br>');
        }
        if (data.hero_lead) {
          const el = document.querySelector('.hero-lead-text');
          if (el) el.innerHTML = data.hero_lead.replace(/\n/g, '<br>');
        }
        const badgeEls = document.querySelectorAll('.hero-badge-item span');
        if (badgeEls.length >= 3) {
          if (data.badge_1) badgeEls[0].textContent = data.badge_1;
          if (data.badge_2) badgeEls[1].textContent = data.badge_2;
          if (data.badge_3) badgeEls[2].textContent = data.badge_3;
        }
        if (data.hero_cta_btn) {
          const el = document.querySelector('.hero-cta-group .floating-cta-btn span');
          if (el) el.textContent = data.hero_cta_btn;
        }
        if (data.hero_service_link) {
          const el = document.querySelector('.hero-cta-group a:nth-of-type(2)');
          if (el) el.textContent = data.hero_service_link;
        }

        // About Us
        const aboutSec = document.getElementById('about');
        if (aboutSec) {
          if (data.about_sec_title) {
            const h2 = aboutSec.querySelector('.section-title');
            if (h2) h2.textContent = data.about_sec_title;
          }
          if (data.about_sec_lead) {
            const lead = aboutSec.querySelector('.section-lead');
            if (lead) lead.innerHTML = data.about_sec_lead.replace(/\n/g, '<br>');
          }
        }
        const zigzagItems = document.querySelectorAll('.athena-zigzag-item');
        zigzagItems.forEach((item, idx) => {
          const num = idx + 1;
          const tagKey = `about_0${num}_tag`;
          const titleKey = `about_0${num}_title`;
          const descKey = `about_0${num}_desc`;
          const tagEl = item.querySelector('.zigzag-tag');
          const headingEl = item.querySelector('.zigzag-heading');
          const textEl = item.querySelector('.zigzag-text');
          if (tagEl && data[tagKey]) tagEl.textContent = data[tagKey];
          if (headingEl && data[titleKey]) headingEl.innerHTML = data[titleKey].replace(/\n/g, '<br>');
          if (textEl && data[descKey]) textEl.innerHTML = data[descKey].replace(/\n/g, '<br>');
          if (num === 4 && data.about_04_btn) {
            const btn = item.querySelector('.service-card-link span');
            if (btn) btn.textContent = data.about_04_btn;
          }
        });

        // サービス
        const servicesSec = document.getElementById('services');
        if (servicesSec) {
          if (data.services_sec_title) {
            const h2 = servicesSec.querySelector('.section-title');
            if (h2) h2.textContent = data.services_sec_title;
          }
          if (data.services_sec_lead) {
            const lead = servicesSec.querySelector('.service-sticky-text');
            if (lead) lead.innerHTML = data.services_sec_lead.replace(/\n/g, '<br>');
          }
          if (data.services_sec_btn) {
            const btn = servicesSec.querySelector('.header-cta-btn span');
            if (btn) btn.textContent = data.services_sec_btn;
          }
        }

        // FLOW
        const flowSec = document.getElementById('flow');
        if (flowSec) {
          if (data.flow_sec_title) {
            const h2 = flowSec.querySelector('.section-title');
            if (h2) h2.textContent = data.flow_sec_title;
          }
          if (data.flow_sec_lead) {
            const lead = flowSec.querySelector('.section-lead');
            if (lead) lead.innerHTML = data.flow_sec_lead.replace(/\n/g, '<br>');
          }
        }
        const flowSteps = document.querySelectorAll('#flow > div > div:last-child > div');
        flowSteps.forEach((step, idx) => {
          const num = idx + 1;
          const titleEl = step.querySelector('h4');
          const descEl = step.querySelector('p');
          if (titleEl && data[`flow_0${num}_title`]) titleEl.textContent = data[`flow_0${num}_title`];
          if (descEl && data[`flow_0${num}_desc`]) descEl.textContent = data[`flow_0${num}_desc`];
        });

        // TEAM & COMPANY 見出し
        const teamSec = document.getElementById('team');
        if (teamSec) {
          if (data.team_sec_title) {
            const h2 = teamSec.querySelector('.section-title');
            if (h2) h2.textContent = data.team_sec_title;
          }
          if (data.team_sec_lead) {
            const lead = teamSec.querySelector('.section-lead');
            if (lead) lead.innerHTML = data.team_sec_lead.replace(/\n/g, '<br>');
          }
        }
        const companySec = document.getElementById('company');
        if (companySec) {
          if (data.company_sec_title) {
            const h2 = companySec.querySelector('.section-title');
            if (h2) h2.textContent = data.company_sec_title;
          }
          if (data.company_sec_lead) {
            const lead = companySec.querySelector('.section-lead');
            if (lead) lead.innerHTML = data.company_sec_lead.replace(/\n/g, '<br>');
          }
        }

        // CTAバナー
        const banner = document.querySelector('section[style*="linear-gradient(135deg"]');
        if (banner) {
          if (data.cta_banner_title) {
            const h2 = banner.querySelector('h2');
            if (h2) h2.textContent = data.cta_banner_title;
          }
          if (data.cta_banner_desc) {
            const p = banner.querySelector('p:nth-of-type(2)');
            if (p) p.innerHTML = data.cta_banner_desc.replace(/\n/g, '<br>');
          }
          if (data.cta_banner_btn) {
            const span = banner.querySelector('.floating-cta-btn span');
            if (span) span.textContent = data.cta_banner_btn;
          }
        }
      })
      .catch(() => {});
  }

  /* ★【最重要新設】サービス案内テキストを「トップページ」と「詳細ページ」の両方に完全連動 */
  function syncServicesTexts() {
    const repoBase = getRepoBase();
    fetch(repoBase + 'content/services.json?v=' + Date.now())
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;

        // services.html ヒーロー見出し
        if (window.location.pathname.includes('services.html')) {
          if (data.page_title) {
            const h1 = document.querySelector('.hero-main-title');
            if (h1) h1.textContent = data.page_title;
          }
          if (data.page_lead) {
            const lead = document.querySelector('.hero-lead-text');
            if (lead) lead.innerHTML = data.page_lead.replace(/\n/g, '<br>');
          }
        }

        // トップページのサービスカード（タイトル・説明文）を自動連動！
        if (data.service_items && data.service_items.length > 0) {
          const topCards = document.querySelectorAll('.service-card-item');
          topCards.forEach((card, idx) => {
            const item = data.service_items[idx];
            if (item) {
              const titleEl = card.querySelector('.service-card-title');
              const descEl = card.querySelector('.service-card-desc');
              if (titleEl && item.title) titleEl.textContent = item.title;
              if (descEl && item.lead) descEl.textContent = item.lead;
            }
          });
        }
      })
      .catch(() => {});
  }

  /* ★ 料金ページ見出し同期 */
  function syncPricingTexts() {
    if (!window.location.pathname.includes('pricing.html')) return;
    const repoBase = getRepoBase();
    fetch(repoBase + 'content/pricing.json?v=' + Date.now())
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.page_title) {
          const h1 = document.querySelector('.hero-main-title');
          if (h1) h1.textContent = data.page_title;
        }
        if (data.page_lead) {
          const lead = document.querySelector('.hero-lead-text');
          if (lead) lead.innerHTML = data.page_lead.replace(/\n/g, '<br>');
        }
        if (data.plans_sec_title) {
          const h2 = document.querySelector('#plans .section-header:first-of-type .section-title');
          if (h2) h2.textContent = data.plans_sec_title;
        }
        if (data.plans_sec_lead) {
          const lead = document.querySelector('#plans .section-header:first-of-type .section-lead');
          if (lead) lead.textContent = data.plans_sec_lead;
        }
        if (data.spot_sec_title) {
          const h2 = document.querySelector('#plans .section-header:last-of-type .section-title');
          if (h2) h2.textContent = data.spot_sec_title;
        }
        if (data.spot_sec_lead) {
          const lead = document.querySelector('#plans .section-header:last-of-type .section-lead');
          if (lead) lead.textContent = data.spot_sec_lead;
        }
      })
      .catch(() => {});
  }

  /* ★ FAQページ見出し同期 */
  function syncFaqTexts() {
    if (!window.location.pathname.includes('faq.html')) return;
    const repoBase = getRepoBase();
    fetch(repoBase + 'content/faq.json?v=' + Date.now())
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.page_title) {
          const h1 = document.querySelector('.hero-main-title');
          if (h1) h1.textContent = data.page_title;
        }
        if (data.page_lead) {
          const lead = document.querySelector('.hero-lead-text');
          if (lead) lead.innerHTML = data.page_lead.replace(/\n/g, '<br>');
        }
      })
      .catch(() => {});
  }

  /* 税理士紹介同期 */
  function syncProfileTexts() {
    const isProfile = window.location.pathname.includes('profile.html');
    const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/terazawazeirishi/');
    if (!isProfile && !isHome) return;

    const repoBase = getRepoBase();
    fetch(repoBase + 'content/profile_texts.json?v=' + Date.now())
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;

        if (isHome) {
          const teamSection = document.getElementById('team');
          if (teamSection) {
            const memberCards = teamSection.querySelectorAll('.representative-photo-frame');
            if (memberCards.length >= 1) {
              const card1 = memberCards[0].closest('div');
              if (card1) {
                if (data.rep_keiko_name) { const el = card1.querySelector('h3'); if (el) el.textContent = data.rep_keiko_name; }
                if (data.rep_keiko_sub) { const el = card1.querySelector('p:nth-of-type(1)'); if (el) el.innerHTML = data.rep_keiko_sub.replace(/\n/g, '<br>'); }
                if (data.rep_keiko_desc) { const el = card1.querySelector('p:nth-of-type(2)'); if (el) el.innerHTML = data.rep_keiko_desc.replace(/\n/g, '<br>'); }
              }
            }
            if (memberCards.length >= 2) {
              const card2 = memberCards[1].closest('div');
              if (card2) {
                if (data.rep_senior_name) { const el = card2.querySelector('h3'); if (el) el.textContent = data.rep_senior_name; }
                if (data.rep_senior_sub) { const el = card2.querySelector('p:nth-of-type(1)'); if (el) el.innerHTML = data.rep_senior_sub.replace(/\n/g, '<br>'); }
                if (data.rep_senior_desc) { const el = card2.querySelector('p:nth-of-type(2)'); if (el) el.innerHTML = data.rep_senior_desc.replace(/\n/g, '<br>'); }
              }
            }
          }
        }

        if (isProfile) {
          if (data.page_title) {
            const h1 = document.querySelector('.hero-main-title');
            if (h1) h1.textContent = data.page_title;
          }
          if (data.page_lead) {
            const leadEl = document.querySelector('.hero-lead-text');
            if (leadEl) leadEl.innerHTML = data.page_lead.replace(/\n/g, '<br>');
          }

          const members = document.querySelectorAll('.profile-member-grid');
          if (members.length >= 1) {
            const m1 = members[0];
            if (data.rep_keiko_name) { const h2 = m1.querySelector('h2'); if (h2) h2.textContent = data.rep_keiko_name; }
            if (data.rep_keiko_sub) { const sub = m1.querySelector('.profile-sub-title'); if (sub) sub.textContent = data.rep_keiko_sub; }
            if (data.rep_keiko_desc) {
              const desc = m1.querySelector('.profile-desc-col > div:nth-of-type(2)');
              if (desc) desc.innerHTML = data.rep_keiko_desc.split('\n\n').filter(p => p.trim()).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
            }
            if (data.rep_keiko_careers) {
              const ul = m1.querySelector('.profile-career-box ul');
              if (ul) ul.innerHTML = data.rep_keiko_careers.split('\n').filter(l => l.trim()).map(l => `<li>${l}</li>`).join('');
            }
          }
          if (members.length >= 2) {
            const m2 = members[1];
            if (data.rep_senior_name) { const h2 = m2.querySelector('h2'); if (h2) h2.textContent = data.rep_senior_name; }
            if (data.rep_senior_sub) { const sub = m2.querySelector('.profile-sub-title'); if (sub) sub.textContent = data.rep_senior_sub; }
            if (data.rep_senior_desc) {
              const desc = m2.querySelector('.profile-desc-col > div:nth-of-type(2)');
              if (desc) desc.innerHTML = data.rep_senior_desc.split('\n\n').filter(p => p.trim()).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
            }
            if (data.rep_senior_careers) {
              const ul = m2.querySelector('.profile-career-box ul');
              if (ul) ul.innerHTML = data.rep_senior_careers.split('\n').filter(l => l.trim()).map(l => `<li>${l}</li>`).join('');
            }
          }
        }
      })
      .catch(() => {});
  }

  /* お問い合わせ・規約同期 */
  function syncLegalTexts() {
    const isContact = window.location.pathname.includes('contact.html');
    const isPrivacy = window.location.pathname.includes('privacy.html');
    if (!isContact && !isPrivacy) return;

    const repoBase = getRepoBase();
    fetch(repoBase + 'content/legal_texts.json?v=' + Date.now())
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;

        if (isContact) {
          if (data.contact_lead) {
            const lead = document.querySelector('.hero-lead-text');
            if (lead) lead.innerHTML = data.contact_lead.replace(/\n/g, '<br>');
          }
          if (data.contact_phone_note) {
            const p = document.querySelector('div[style*="border-radius: var(--radius-lg)"] p:first-child');
            if (p) p.textContent = data.contact_phone_note;
          }
          if (data.contact_hours_note) {
            const p = document.querySelector('div[style*="border-radius: var(--radius-lg)"] p:last-child');
            if (p) p.textContent = data.contact_hours_note;
          }
          if (data.contact_notice) {
            const noticeP = document.querySelector('div[style*="background: #FFF8E7"] p, div[style*="background:#FFF8E7"] p');
            if (noticeP) noticeP.innerHTML = data.contact_notice.replace(/\n/g, '<br>');
          }
          if (data.contact_form_lead) {
            const p = document.querySelector('main div[style*="padding: 3rem 2.5rem"] p:first-of-type');
            if (p) p.innerHTML = data.contact_form_lead.replace(/\n/g, '<br>');
          }
        }

        if (isPrivacy) {
          const sections = document.querySelectorAll('main section');
          if (sections.length >= 4) {
            if (data.privacy_sec1) { const p = sections[0].querySelector('p'); if (p) p.innerHTML = data.privacy_sec1.replace(/\n/g, '<br>'); }
            if (data.privacy_sec2) { const p = sections[1].querySelector('p'); if (p) p.innerHTML = data.privacy_sec2.replace(/\n/g, '<br>'); }
            if (data.privacy_sec3) { const p = sections[2].querySelector('p'); if (p) p.innerHTML = data.privacy_sec3.replace(/\n/g, '<br>'); }
            if (data.privacy_sec4) { const p = sections[3].querySelector('p'); if (p) p.innerHTML = data.privacy_sec4.replace(/\n/g, '<br>'); }
          }
        }
      })
      .catch(() => {});
  }
})();
