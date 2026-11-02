/**
 * ==============================================================================
 * 寺沢景子税理士事務所 公式Webサイト クライアントスクリプト（スマート非表示完全版）
 * ファイルパス: assets/js/main.js
 * 仕様: 空欄時の枠ごと完全自動非表示 / 項目自由増減 / 全データ完全同期
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
    syncHomeTexts();
    syncProfileTexts();
    syncServicesTexts();
    syncPricingTexts();
    syncFaqTexts();
    syncLegalTexts();
  }

  /* ★【共通ヘルパー】空欄なら要素ごと完全非表示、文字があれば表示するスマート関数 */
  function setOrHide(el, val, isHtml) {
    if (!el) return;
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
      if (isHtml) {
        el.innerHTML = typeof val === 'string' ? val.replace(/\n/g, '<br>') : val;
      } else {
        el.textContent = val;
      }
    }
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

  function syncOfficeInfo() {
    const repoBase = getRepoBase();
    fetch(repoBase + 'content/office_info.json?v=' + Date.now())
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;

        if (data.office_name) {
          document.querySelectorAll('.brand-name, .footer-brand-name').forEach((el) => { setOrHide(el, data.office_name); });
        }
        if (data.office_en) {
          document.querySelectorAll('.brand-en, .footer-brand-en').forEach((el) => { setOrHide(el, data.office_en); });
        }

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

          if (thText.includes('所在地')) {
            const addr = (data.postal_code ? '〒' + data.postal_code + ' ' : '') + (data.address || '');
            setOrHide(tr, addr ? true : false);
            td.textContent = addr;
          } else if (thText.includes('営業時間')) {
            setOrHide(tr, data.opening_hours);
            td.textContent = data.opening_hours || '';
          } else if (thText.includes('対応エリア')) {
            setOrHide(tr, data.areas);
            td.textContent = data.areas || '';
          } else if (thText.includes('FAX')) {
            setOrHide(tr, data.fax);
            td.textContent = data.fax || '';
          } else if (thText.includes('提携士業')) {
            setOrHide(tr, (data.alliance_desc || data.alliance_url));
            if (data.alliance_desc || data.alliance_url) {
              td.innerHTML = `<strong>${data.alliance_desc || 'ザワテラス社労士'}</strong><br><a href="${data.alliance_url || 'https://terazawa-sr.jbcsite.com/'}" target="_blank" rel="noopener noreferrer" style="color: var(--color-accent); font-size: 0.88rem;">${data.alliance_url || 'https://terazawa-sr.jbcsite.com/'} &rarr;</a>`;
            }
          }
        });

        if (data.copyright_year) {
          document.querySelectorAll('.footer-bottom p').forEach((p) => { setOrHide(p, data.copyright_year); });
        }
      })
      .catch(() => {});
  }

  /* ★【完全版】トップページ全要素スマート非表示 ＆ リスト完全動的増減 */
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
        setOrHide(document.querySelector('.hero-sub-en'), data.hero_sub_en);
        setOrHide(document.querySelector('.hero-main-title'), data.hero_title, true);
        setOrHide(document.querySelector('.hero-lead-text'), data.hero_lead, true);

        // ★ 月桂樹バッジ（0個ならコンテナごと完全消去、増減自由）
        const badgesContainer = document.querySelector('.hero-badges-row');
        if (badgesContainer) {
          if (Array.isArray(data.hero_badges) && data.hero_badges.length > 0) {
            badgesContainer.innerHTML = '';
            let validCount = 0;
            data.hero_badges.forEach((b) => {
              if (b && b.text && b.text.trim()) {
                validCount++;
                const item = document.createElement('div');
                item.className = 'hero-badge-item';
                item.innerHTML = `
                  <svg class="hero-badge-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L15 8L21 9L17 14L18 20L12 17L6 20L7 14L3 9L9 8L12 2Z"/></svg>
                  <span>${b.text.trim()}</span>
                `;
                badgesContainer.appendChild(item);
              }
            });
            badgesContainer.style.display = validCount > 0 ? '' : 'none';
          } else {
            badgesContainer.style.display = 'none';
          }
        }

        // ヒーローボタン（空欄でボタンごと非表示）
        const heroCtaBtn = document.querySelector('.hero-cta-group .floating-cta-btn');
        if (heroCtaBtn) setOrHide(heroCtaBtn, data.hero_cta_btn);
        const heroServiceLink = document.querySelector('.hero-cta-group a:nth-of-type(2)');
        if (heroServiceLink) setOrHide(heroServiceLink, data.hero_service_link);

        // About Us 大見出し＆案内文（空欄で非表示）
        const aboutSec = document.getElementById('about');
        if (aboutSec) {
          setOrHide(aboutSec.querySelector('.section-title'), data.about_sec_title);
          setOrHide(aboutSec.querySelector('.section-lead'), data.about_sec_lead, true);
        }

        // ★ About Us 項目一覧（空欄でカードごと非表示 ＆ リスト増減に対応！）
        const zigzagList = document.querySelector('.athena-zigzag-list');
        if (zigzagList && Array.isArray(data.about_items) && data.about_items.length > 0) {
          const items = zigzagList.querySelectorAll('.athena-zigzag-item');
          items.forEach((itemEl, idx) => {
            const itemData = data.about_items[idx];
            if (!itemData || (!itemData.title && !itemData.desc)) {
              itemEl.style.display = 'none'; // ★ データがない、またはタイトルも本文も空ならカード枠ごと完全非表示！
            } else {
              itemEl.style.display = '';
              const numEl = itemEl.querySelector('.athena-num-bg');
              if (numEl) numEl.textContent = itemData.num || `0${idx + 1}`;
              setOrHide(itemEl.querySelector('.zigzag-tag'), itemData.tag);
              setOrHide(itemEl.querySelector('.zigzag-heading'), itemData.title, true);
              setOrHide(itemEl.querySelector('.zigzag-text'), itemData.desc, true);

              // リンクボタン
              const btnContainer = itemEl.querySelector('.zigzag-content > div:last-child');
              const btn = itemEl.querySelector('.service-card-link');
              if (btn && btnContainer) {
                if (itemData.btn_text && itemData.btn_text.trim()) {
                  btnContainer.style.display = '';
                  btn.setAttribute('href', itemData.btn_url || '#');
                  const span = btn.querySelector('span');
                  if (span) span.textContent = itemData.btn_text;
                } else {
                  btnContainer.style.display = 'none';
                }
              }
            }
          });
        }

        // サービス大見出し＆ボタン
        const servicesSec = document.getElementById('services');
        if (servicesSec) {
          setOrHide(servicesSec.querySelector('.section-title'), data.services_sec_title);
          setOrHide(servicesSec.querySelector('.service-sticky-text'), data.services_sec_lead, true);
          setOrHide(servicesSec.querySelector('.header-cta-btn'), data.services_sec_btn);
        }

        // ご相談の流れ 大見出し
        const flowSec = document.getElementById('flow');
        if (flowSec) {
          setOrHide(flowSec.querySelector('.section-title'), data.flow_sec_title);
          setOrHide(flowSec.querySelector('.section-lead'), data.flow_sec_lead, true);
        }

        // ★ 相談の流れ STEP（空欄でボックスごと非表示 ＆ 増減に対応！）
        const flowSteps = document.querySelectorAll('#flow > div > div:last-child > div');
        if (flowSteps.length > 0 && Array.isArray(data.flow_steps)) {
          flowSteps.forEach((stepEl, idx) => {
            const stepData = data.flow_steps[idx];
            if (!stepData || (!stepData.title && !stepData.desc)) {
              stepEl.style.display = 'none'; // ★ 空欄ならSTEPボックスごと完全非表示！
            } else {
              stepEl.style.display = '';
              const stepLabelEl = stepEl.querySelector('span:first-child');
              if (stepLabelEl) stepLabelEl.textContent = stepData.step_label || `STEP 0${idx + 1}`;
              setOrHide(stepEl.querySelector('h4'), stepData.title);
              setOrHide(stepEl.querySelector('p'), stepData.desc, true);
            }
          });
        }

        // 税理士紹介 ＆ 会社概要 大見出し
        const teamSec = document.getElementById('team');
        if (teamSec) {
          setOrHide(teamSec.querySelector('.section-title'), data.team_sec_title);
          setOrHide(teamSec.querySelector('.section-lead'), data.team_sec_lead, true);
        }
        const companySec = document.getElementById('company');
        if (companySec) {
          setOrHide(companySec.querySelector('.section-title'), data.company_sec_title);
          setOrHide(companySec.querySelector('.section-lead'), data.company_sec_lead, true);
        }

        // 下部CTAバナー
        const banner = document.querySelector('section[style*="linear-gradient(135deg"]');
        if (banner) {
          setOrHide(banner.querySelector('h2'), data.cta_banner_title);
          setOrHide(banner.querySelector('p:nth-of-type(2)'), data.cta_banner_desc, true);
          setOrHide(banner.querySelector('.floating-cta-btn'), data.cta_banner_btn);
        }
      })
      .catch(() => {});
  }

  function syncServicesTexts() {
    const repoBase = getRepoBase();
    fetch(repoBase + 'content/services.json?v=' + Date.now())
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;

        if (window.location.pathname.includes('services.html')) {
          setOrHide(document.querySelector('.hero-main-title'), data.page_title);
          setOrHide(document.querySelector('.hero-lead-text'), data.page_lead, true);
        }

        if (data.service_items && data.service_items.length > 0) {
          const topCards = document.querySelectorAll('.service-card-item');
          topCards.forEach((card, idx) => {
            const item = data.service_items[idx];
            if (!item || (!item.title && !item.lead)) {
              card.style.display = 'none'; // ★ サービスが空ならカードごと非表示
            } else {
              card.style.display = '';
              setOrHide(card.querySelector('.service-card-title'), item.title);
              setOrHide(card.querySelector('.service-card-desc'), item.lead, true);
            }
          });
        }
      })
      .catch(() => {});
  }

  function syncPricingTexts() {
    if (!window.location.pathname.includes('pricing.html')) return;
    const repoBase = getRepoBase();
    fetch(repoBase + 'content/pricing.json?v=' + Date.now())
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        setOrHide(document.querySelector('.hero-main-title'), data.page_title);
        setOrHide(document.querySelector('.hero-lead-text'), data.page_lead, true);
        setOrHide(document.querySelector('#plans .section-header:first-of-type .section-title'), data.plans_sec_title);
        setOrHide(document.querySelector('#plans .section-header:first-of-type .section-lead'), data.plans_sec_lead);
        setOrHide(document.querySelector('#plans .section-header:last-of-type .section-title'), data.spot_sec_title);
        setOrHide(document.querySelector('#plans .section-header:last-of-type .section-lead'), data.spot_sec_lead);
      })
      .catch(() => {});
  }

  function syncFaqTexts() {
    if (!window.location.pathname.includes('faq.html')) return;
    const repoBase = getRepoBase();
    fetch(repoBase + 'content/faq.json?v=' + Date.now())
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        setOrHide(document.querySelector('.hero-main-title'), data.page_title);
        setOrHide(document.querySelector('.hero-lead-text'), data.page_lead, true);
      })
      .catch(() => {});
  }

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
                setOrHide(card1.querySelector('h3'), data.rep_keiko_name);
                setOrHide(card1.querySelector('p:nth-of-type(1)'), data.rep_keiko_sub, true);
                setOrHide(card1.querySelector('p:nth-of-type(2)'), data.rep_keiko_desc, true);
              }
            }
            if (memberCards.length >= 2) {
              const card2 = memberCards[1].closest('div');
              if (card2) {
                setOrHide(card2.querySelector('h3'), data.rep_senior_name);
                setOrHide(card2.querySelector('p:nth-of-type(1)'), data.rep_senior_sub, true);
                setOrHide(card2.querySelector('p:nth-of-type(2)'), data.rep_senior_desc, true);
              }
            }
          }
        }

        if (isProfile) {
          setOrHide(document.querySelector('.hero-main-title'), data.page_title);
          setOrHide(document.querySelector('.hero-lead-text'), data.page_lead, true);

          const members = document.querySelectorAll('.profile-member-grid');
          if (members.length >= 1) {
            const m1 = members[0];
            setOrHide(m1.querySelector('h2'), data.rep_keiko_name);
            setOrHide(m1.querySelector('.profile-sub-title'), data.rep_keiko_sub);
            const desc = m1.querySelector('.profile-desc-col > div:nth-of-type(2)');
            if (desc) {
              if (data.rep_keiko_desc && data.rep_keiko_desc.trim()) {
                desc.style.display = '';
                desc.innerHTML = data.rep_keiko_desc.split('\n\n').filter(p => p.trim()).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
              } else {
                desc.style.display = 'none';
              }
            }
            const careerBox = m1.querySelector('.profile-career-box');
            if (careerBox) {
              if (data.rep_keiko_careers && data.rep_keiko_careers.trim()) {
                careerBox.style.display = '';
                const ul = careerBox.querySelector('ul');
                if (ul) ul.innerHTML = data.rep_keiko_careers.split('\n').filter(l => l.trim()).map(l => `<li>${l}</li>`).join('');
              } else {
                careerBox.style.display = 'none'; // ★ 経歴が空なら枠ごと非表示
              }
            }
          }

          if (members.length >= 2) {
            const m2 = members[1];
            setOrHide(m2.querySelector('h2'), data.rep_senior_name);
            setOrHide(m2.querySelector('.profile-sub-title'), data.rep_senior_sub);
            const desc = m2.querySelector('.profile-desc-col > div:nth-of-type(2)');
            if (desc) {
              if (data.rep_senior_desc && data.rep_senior_desc.trim()) {
                desc.style.display = '';
                desc.innerHTML = data.rep_senior_desc.split('\n\n').filter(p => p.trim()).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
              } else {
                desc.style.display = 'none';
              }
            }
            const careerBox = m2.querySelector('.profile-career-box');
            if (careerBox) {
              if (data.rep_senior_careers && data.rep_senior_careers.trim()) {
                careerBox.style.display = '';
                const ul = careerBox.querySelector('ul');
                if (ul) ul.innerHTML = data.rep_senior_careers.split('\n').filter(l => l.trim()).map(l => `<li>${l}</li>`).join('');
              } else {
                careerBox.style.display = 'none'; // ★ 経歴が空なら枠ごと非表示
              }
            }
          }
        }
      })
      .catch(() => {});
  }

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
          setOrHide(document.querySelector('.hero-lead-text'), data.contact_lead, true);
          const p1 = document.querySelector('div[style*="border-radius: var(--radius-lg)"] p:first-child');
          if (p1) setOrHide(p1, data.contact_phone_note);
          const p2 = document.querySelector('div[style*="border-radius: var(--radius-lg)"] p:last-child');
          if (p2) setOrHide(p2, data.contact_hours_note);

          const noticeBox = document.querySelector('div[style*="background: #FFF8E7"], div[style*="background:#FFF8E7"]');
          if (noticeBox) setOrHide(noticeBox, data.contact_notice, true); // ★ 警告文が空なら枠ごと非表示

          const formLead = document.querySelector('main div[style*="padding: 3rem 2.5rem"] p:first-of-type');
          if (formLead) setOrHide(formLead, data.contact_form_lead, true);
        }

        if (isPrivacy) {
          const sections = document.querySelectorAll('main section');
          if (sections.length >= 4) {
            setOrHide(sections[0], data.privacy_sec1, true);
            setOrHide(sections[1], data.privacy_sec2, true);
            setOrHide(sections[2], data.privacy_sec3, true);
            setOrHide(sections[3], data.privacy_sec4, true);
          }
        }
      })
      .catch(() => {});
  }
})();
