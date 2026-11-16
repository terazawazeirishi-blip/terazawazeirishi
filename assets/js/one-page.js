/* TERAZAWA one-page: JSON-powered pricing/FAQ + accessible mobile navigation */
(function(){
  'use strict';
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[char]));
  async function loadJson(path){
    const response=await fetch('./'+path+'?v='+Date.now(),{cache:'no-store'});
    if(!response.ok) throw new Error(path+' returned '+response.status);
    return response.json();
  }
  function renderPricing(data){
    const plansRoot=document.getElementById('pricingPlans');
    if(plansRoot && Array.isArray(data.plans) && data.plans.length){
      plansRoot.innerHTML=data.plans.map(plan=>{
        const features=Array.isArray(plan.features)?plan.features:[];
        const classes=['plan-card',plan.is_recommended?'plan-card-featured':''].filter(Boolean).join(' ');
        return `<article class="${classes}">
          ${plan.is_recommended?'<span class="plan-badge">おすすめ</span>':''}
          <span class="plan-eyebrow">${escapeHtml(plan.name||'ADVISORY PLAN')}</span>
          <h3>${escapeHtml(plan.name||'')}</h3>
          <p class="plan-target">${escapeHtml(plan.target||'')}</p>
          <div class="plan-price"><small>月額顧問料（税込）</small><strong>${escapeHtml(plan.monthly_fee||'個別お見積もり')}</strong><span>決算申告料 ${escapeHtml(plan.settlement_fee||'別途お見積もり')}</span></div>
          <ul>${features.map(feature=>'<li>'+escapeHtml(feature)+'</li>').join('')}</ul>
          <a class="button ${plan.is_recommended?'button-primary':'button-outline'}" href="#contact">無料で相談する →</a>
        </article>`;
      }).join('');
    }
    const feesRoot=document.getElementById('spotFeesList');
    if(feesRoot && Array.isArray(data.spot_fees)){
      feesRoot.innerHTML=data.spot_fees.map(fee=>`<div class="spot-fee-row"><strong>${escapeHtml(fee.service_name||'')}</strong><b>${escapeHtml(fee.price||'')}</b><span>${escapeHtml(fee.notes||'')}</span></div>`).join('');
    }
  }
  function renderFaq(data){
    const root=document.getElementById('faqContainer');
    if(!root || !Array.isArray(data.faq_list) || !data.faq_list.length) return;
    root.innerHTML=data.faq_list.map(item=>`<details class="faq-item"><summary>${escapeHtml(item.question||'')}</summary><div class="faq-answer">${escapeHtml(item.answer||'')}</div></details>`).join('');
  }
  function initNavigation(){
    const toggle=document.getElementById('hamburgerBtn');
    const nav=document.getElementById('headerNav');
    if(!toggle || !nav) return;
    const close=()=>{
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','メニューを開く');
    };
    toggle.addEventListener('click',()=>{
      const open=nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded',String(open));
      toggle.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');
    });
    nav.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',close));
    document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
  }
  async function init(){
    initNavigation();

    // 価格表・FAQを表示するページでのみ、それぞれのJSONを読み込みます。
    // プライバシーページなどでは不要な通信を発生させません。
    const tasks=[];
    if(document.getElementById('pricingPlans')){
      tasks.push({key:'pricing',promise:loadJson('content/pricing.json')});
    }
    if(document.getElementById('faqContainer')){
      tasks.push({key:'faq',promise:loadJson('content/faq.json')});
    }

    const results=await Promise.allSettled(tasks.map(task=>task.promise));
    results.forEach((result,index)=>{
      const key=tasks[index].key;
      if(result.status==='fulfilled'){
        if(key==='pricing') renderPricing(result.value);
        if(key==='faq') renderFaq(result.value);
      }else{
        console.warn('[TERAZAWA] '+key+' data could not be loaded; static fallback retained.',result.reason);
      }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
