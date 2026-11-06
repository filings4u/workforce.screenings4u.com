(()=>{
'use strict';
const API='https://elpbnytpciqnbexiaebp.supabase.co/functions/v1';
const FEATURE_LABELS={employee_management:'Employee / driver management',driver_qualification:'Driver qualification tools',bulk_employee_import:'Bulk employee import',team_users:'Team users',locations:'Locations',ders_supervisors:'DER / supervisor tools',post_accident:'Post-accident workflow',action_center:'Action Center',policy_acknowledgments:'Policy acknowledgments',training_records:'Training records',programs:'DOT programs',random_pool:'Random pool management',random_selections:'Random selections',testing_orders:'Testing orders & workflow',collection_sites:'Collection sites',results_summary:'Result summary visibility',results_sensitive:'Sensitive result visibility',compliance:'Compliance management',rtd_follow_up:'Return-to-duty / follow-up',documents:'Documents',standard_reports:'Standard reports',advanced_reports:'Advanced reports',notifications:'Notifications',integrations:'Integrations',branded_email:'Branded email',white_label:'White-label capability',audit_history:'Audit history',employer_management:'Employer management',consortium_pools:'Consortium pools',billing_tools:'Billing tools',client_invoicing:'Client invoicing',customer_portal_delivery:'Customer portal delivery',clearinghouse_tools:'Clearinghouse tools',policy_builder:'Policy builder',employer_settings:'Employer settings',employer_import:'Employer import',enrollment_documents:'Enrollment documents',client_payments:'Client payments',sso:'Single sign-on (SSO)'};

function renderNav(){
  const target=document.getElementById('__legacySiteHeaderDisabled'); if(!target)return;
  target.innerHTML=`<header class="site-header"><div class="container nav-wrap">
    <a class="brand" href="index.html"><img src="images/logo.png" alt="Workforce DOT by screenings4u"></a>
    <button class="nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false"><span></span></button>
    <nav class="primary-nav" aria-label="Primary navigation">
      <a href="platform.html">Platform</a>
      <details><summary>Solutions <i></i></summary><div class="dropdown"><a href="employers.html">Employers</a><a href="fmcsa-dot-random-consortium-49-cfr-part-382.html">FMCSA Owner-Operator Drivers</a><a href="ctpa.html">C/TPAs</a></div></details>
      <details><summary>DOT Agencies <i></i></summary><div class="dropdown agency-dropdown"><a href="fmcsa.html">FMCSA</a><a href="faa.html">FAA</a><a href="fra.html">FRA</a><a href="fta.html">FTA</a><a href="phmsa.html">PHMSA</a><a href="uscg.html">USCG</a></div></details>
      <details><summary>Resources <i></i></summary><div class="dropdown"><a href="resources.html">Resource Center</a><a href="blog.html">Blog</a><a href="contact.html">Contact</a></div></details>
      <a href="pricing.html">Pricing</a>
      <div class="mobile-actions"><a href="login.html">Sign In</a><a class="btn btn-secondary" href="demo.html">Request Demo</a><a class="btn btn-primary" href="pricing.html">View Plans</a></div>
    </nav>
    <div class="nav-actions"><a class="signin" href="login.html">Sign In</a><a class="btn btn-secondary" href="demo.html">Request Demo</a><a class="btn btn-primary" href="pricing.html">View Plans</a></div>
  </div></header>`;
  const toggle=target.querySelector('.nav-toggle'),nav=target.querySelector('.primary-nav');
  toggle?.addEventListener('click',()=>{const o=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!o));nav.classList.toggle('open',!o);document.body.classList.toggle('nav-open',!o)});
  document.addEventListener('click',e=>target.querySelectorAll('details[open]').forEach(d=>{if(!d.contains(e.target))d.removeAttribute('open')}));
  const state=()=>target.querySelector('.site-header')?.classList.toggle('is-scrolled',scrollY>18); addEventListener('scroll',state,{passive:true}); state();
}
renderNav();

const p=new URLSearchParams(location.search);
const rawPlan=(p.get('plan')||'essential').trim().toLowerCase();
const rawType=(p.get('type')||'').trim().toLowerCase();
const rawAgency=(p.get('agency')||'').trim().toUpperCase();
const FULL_PLAN_RE=/^(dot_(?:ctpa|employer|fmcsa|faa|fra|fta|phmsa|uscg)_(?:essential|professional|enterprise)|owner_operator_(?:essential|plus|complete))$/;

function planContext(){
  if(FULL_PLAN_RE.test(rawPlan)){
    if(rawPlan.startsWith('owner_operator_')) return {type:'owner_operator',agency:'FMCSA',code:rawPlan};
    if(rawPlan.startsWith('dot_ctpa_')) return {type:'ctpa',agency:'CTPA',code:rawPlan};
    const m=rawPlan.match(/^dot_([a-z]+)_(essential|professional|enterprise)$/);
    const prefix=m?.[1]||'employer';
    if(prefix==='employer') return {type:'employer',agency:'',code:rawPlan};
    return {type:'employer',agency:prefix.toUpperCase(),code:rawPlan};
  }

  let type=['owner','owner_operator','owner-operator'].includes(rawType)?'owner_operator':(rawType||'employer');
  let tier=rawPlan;
  let agency=rawAgency || (type==='owner_operator'?'FMCSA':type==='ctpa'?'CTPA':'');
  if(type==='owner_operator'&&tier==='professional') tier='plus';
  if(type==='owner_operator'&&tier==='enterprise') tier='complete';
  const code=type==='ctpa'?`dot_ctpa_${tier}`:
    type==='owner_operator'?`owner_operator_${tier}`:
    agency?`dot_${agency.toLowerCase()}_${tier}`:`dot_employer_${tier}`;
  return {type,agency,code};
}

const ctx=planContext();
const type=ctx.type;
const agency=ctx.agency;
const code=ctx.code;
const status=document.getElementById('checkout-status');
const payButton=document.getElementById('stripe-pay-button');
const errorBox=document.getElementById('stripe-errors');
const accountLabel=type==='ctpa'?'C/TPA':type==='owner_operator'?'FMCSA Owner-Operator':'DOT Employer';
document.getElementById('order-account').textContent=accountLabel;
document.getElementById('order-agency').textContent=type==='ctpa'?'Multiple / managed programs':type==='owner_operator'?'FMCSA':(agency||'DOT');

async function api(path,opts={}){const r=await fetch(API+path,{...opts,headers:{'Content-Type':'application/json',...(opts.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok||d.error)throw Error(d.error||'Unable to continue checkout.');return d}
function showError(message){status.textContent='Checkout could not be loaded.';status.classList.add('error');errorBox.textContent=message||'Unable to load secure checkout.';errorBox.hidden=false}
function titleCaseCode(v){return String(v||'').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase())}
function planFeatureList(selected){const ordered=Array.isArray(selected.included_services)&&selected.included_services.length?selected.included_services:Object.entries(selected.feature_entitlements||{}).filter(([,enabled])=>enabled===true).map(([key])=>key);return [...new Set(ordered)].map(key=>FEATURE_LABELS[key]||titleCaseCode(key))}
function renderPlan(selected){
  const yearly=type==='owner_operator';
  const amount=yearly?Number(selected.annual_price??selected.billing_model?.amount??0):Number(selected.monthly_price??selected.billing_model?.amount??0);
  document.getElementById('order-plan').textContent=selected.name||'Selected plan';
  document.getElementById('order-price').textContent=`$${amount.toFixed(2)} / ${yearly?'year':'month'}`;
  document.getElementById('order-billing').textContent=yearly?'Annual (12 months)':'Monthly';
  document.getElementById('order-description').textContent=selected.description||'';
  const features=planFeatureList(selected); document.getElementById('order-plan-details').innerHTML=features.length?features.map(label=>`<li>${label}</li>`).join(''):'<li>Plan features are included according to your selected subscription.</li>';
  const notes=[]; const limit=selected.driver_limit??selected.employee_limit; if(limit!=null)notes.push(`Up to ${Number(limit).toLocaleString()} employees / drivers`); if(yearly){notes.push('Single-driver FMCSA workspace');notes.push('12-month annual plan')}else notes.push('Monthly subscription'); document.getElementById('order-plan-note').textContent=notes.join(' • ');
}
async function start(){
  try{
    if(typeof window.Stripe!=='function')throw Error('Stripe.js did not load. Refresh the page and try again.');
    const catalogParams=new URLSearchParams({type});
    if(agency) catalogParams.set('agency',agency);
    const cat=await api(`/workforce-checkout?${catalogParams.toString()}`,{method:'GET'});
    const selected=(cat.plans||[]).find(x=>x.code===code);
    if(!selected)throw Error('The selected plan is not currently available.');
    renderPlan(selected);
    status.textContent='Loading secure payment form…';
    const session=await api('/workforce-checkout',{method:'POST',body:JSON.stringify({surface:'dot_marketing',embedded:true,plan_code:code})});
    if(!session.stripe_publishable_key||!session.client_secret)throw Error('Stripe checkout configuration is unavailable.');
    const stripe=window.Stripe(session.stripe_publishable_key);
    if(typeof stripe.initCheckoutElementsSdk!=='function')throw Error('The loaded Stripe.js version does not support Checkout Elements.');
    const checkout=stripe.initCheckoutElementsSdk({clientSecret:session.client_secret,elementsOptions:{appearance:{theme:'stripe',variables:{colorPrimary:'#ff6b00',colorText:'#172033',colorBackground:'#ffffff',colorDanger:'#b42318',borderRadius:'10px',fontFamily:'Inter, system-ui, sans-serif'}}}});
    checkout.createContactDetailsElement().mount('#stripe-contact-element');
    checkout.createPaymentElement({layout:'accordion'}).mount('#stripe-payment-element');
    const loaded=await checkout.loadActions(); if(loaded.type!=='success')throw Error(loaded.error?.message||'Stripe checkout could not initialize.'); const actions=loaded.actions;
    checkout.on('change',sessionState=>{payButton.disabled=!sessionState.canConfirm;const amount=sessionState.total?.total?.amount;if(amount!==undefined&&amount!==null){const n=Number(amount);document.getElementById('order-price').textContent=`$${Number.isInteger(n)?n:n.toFixed(2)} / ${type==='owner_operator'?'year':'month'}`}});
    payButton.addEventListener('click',async()=>{payButton.disabled=true;errorBox.hidden=true;status.textContent='Confirming payment securely with Stripe…';try{const result=await actions.confirm();if(result.type==='error')throw Error(result.error?.message||'Payment could not be completed.')}catch(err){errorBox.textContent=err.message||'Payment could not be completed.';errorBox.hidden=false;payButton.disabled=false;status.textContent='Secure payment powered by Stripe.'}});
    status.textContent='Secure payment powered by Stripe.';payButton.hidden=false;
  }catch(e){showError(e.message);console.error('Workforce checkout mount failed',e)}
}
start();
})();
