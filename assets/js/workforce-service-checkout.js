(()=>{'use strict';
const params=new URLSearchParams(location.search);
const service=params.get('service');
const valid=['fmcsa_new_entrant_audit_prep','fmcsa_new_entrant_audit_standard','fmcsa_new_entrant_audit_premium'];
if(!valid.includes(service))return;
const BASE='https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-new-entrant-public-checkout';
const HEADERS={'Content-Type':'application/json'};
const $=id=>document.getElementById(id);
const hide=(id,v)=>{const el=$(id);if(el)el.hidden=v};
let stripe=null,elements=null,orderId=null,submitting=false;
const prices={fmcsa_new_entrant_audit_prep:295.95,fmcsa_new_entrant_audit_standard:595.95,fmcsa_new_entrant_audit_premium:995.95};
async function request(action,body={}){
 const r=await fetch(BASE,{method:'POST',headers:HEADERS,body:JSON.stringify({action,...body}),cache:'no-store'});
 const d=await r.json().catch(()=>({}));
 if(!r.ok||d.error)throw Error(d.error||'Secure checkout request failed.');
 return d;
}
function setMessage(text,error=false){const s=$('checkout-status');s.textContent=text;s.classList.toggle('error',error);const e=$('stripe-errors');if(error){e.textContent=text;e.hidden=false}else{e.hidden=true}}
function formField(name,label,type='text',required=false){
 const wrap=document.createElement('label');wrap.className='wf-service-field';wrap.textContent=label;
 const input=document.createElement('input');input.type=type;input.name=name;input.required=required;input.autocomplete=({first_name:'given-name',last_name:'family-name',email:'email',phone:'tel',company_name:'organization'})[name]||'off';input.placeholder=label;
 wrap.append(input);return wrap;
}
function render(serviceData){
 const main=document.getElementById('main');main.className='wf-page wf-checkout wf-service-checkout';
 const services=serviceData||{};
 main.innerHTML='<section class="ck-hero"><div class="wf-container ck-top"><div><span class="wf-eyebrow">SECURE WORKFORCE SERVICE CHECKOUT</span><h1>FMCSA New Entrant Audit Preparation</h1><p>One-time professional preparation service. Confirm your contact details and complete payment securely with Stripe.</p></div><a class="ck-back" href="new-entrant-audit.html#packages">← Back to packages</a></div></section><section class="ck-section"><div class="wf-container ck-grid"><div class="ck-left"><section class="ck-panel ck-payment"><div class="ck-step"><span>01</span><div><h2>Contact information</h2><p>We will use these details for your payment confirmation and service follow-up.</p></div></div><form id="wf-service-form" class="wf-service-form" novalidate></form><div class="ck-rule"></div><div class="ck-step"><span>02</span><div><h2>Secure one-time payment</h2><p>No recurring subscription is created by this purchase.</p></div></div><div id="service-payment-element" class="ck-stripe"></div><div id="stripe-errors" class="ck-alert ck-alert-error" role="alert" hidden></div><div id="checkout-status" class="ck-status" role="status">Enter your information to load secure payment.</div><button id="service-pay" type="button" class="ck-pay" disabled>Continue to secure payment →</button><p class="ck-fine">Payment information is processed by Stripe.</p></section></div><aside class="ck-panel ck-summary"><span class="wf-eyebrow">ONE-TIME SERVICE</span><h2 id="service-title"></h2><p id="service-description"></p><div class="ck-summary-section"><strong class="ck-section-label">INCLUDED IN THIS PACKAGE</strong><ul id="service-features" class="ck-features"></ul></div><div class="ck-total"><span>Pay once</span><strong id="service-price"></strong></div><p class="ck-summary-note">Workforce provides preparation services; FMCSA conducts the official audit. Purchase does not guarantee an audit outcome.</p><p class="ck-summary-help"><a href="contact.html">Contact Sales</a> · <a href="support.html">Support</a></p></aside></div></section>';
 const form=$('wf-service-form');
 for(const [name,label,type,required] of [['first_name','First name','text',true],['last_name','Last name','text',true],['email','Email address','email',true],['phone','Phone number','tel',false],['company_name','Motor carrier / company name','text',false]])form.append(formField(name,label,type,required));
 $('service-title').textContent=services.name||'New Entrant Audit Preparation';
 $('service-description').textContent=services.description||'FMCSA New Entrant preparation for motor carriers.';
 $('service-price').textContent='$'+Number(services.price||prices[service]).toFixed(2);
 const list=$('service-features');for(const feature of (services.features||[])){const li=document.createElement('li');li.textContent=String(feature);list.append(li)}
 if(!list.children.length){const li=document.createElement('li');li.textContent='Professional preparation and guidance';list.append(li)}
 $('service-pay').disabled=false;
 $('service-pay').addEventListener('click',start);
 form.addEventListener('submit',e=>{e.preventDefault();start()});
}
async function start(){
 if(submitting)return;
 const form=$('wf-service-form'),data=new FormData(form);
 if(!form.reportValidity())return;
 const details=Object.fromEntries(['first_name','last_name','email','phone','company_name'].map(k=>[k,String(data.get(k)||'').trim()]));
 submitting=true;$('service-pay').disabled=true;
 try{
  if(!elements){
   setMessage('Preparing your secure payment form…');
   const d=await request('prepare',{service_code:service,...details});
   if(!d.client_secret||!d.publishable_key||typeof Stripe!=='function')throw Error('Stripe could not be initialized.');
   orderId=d.order_id;stripe=Stripe(d.publishable_key);
   elements=stripe.elements({clientSecret:d.client_secret,appearance:{theme:'stripe',variables:{colorPrimary:'#01122F',colorText:'#01122F',colorBackground:'#fff',colorDanger:'#b42318',borderRadius:'10px',fontFamily:'Inter,Arial,sans-serif'}}});
   elements.create('payment',{layout:'accordion'}).mount('#service-payment-element');
   $('service-pay').textContent='Pay $'+Number(d.amount).toFixed(2)+' securely →';
   $('service-pay').disabled=false;setMessage('Ready for secure payment.');return;
  }
  setMessage('Confirming your payment securely…');
  const result=await stripe.confirmPayment({elements,confirmParams:{return_url:location.origin+'/checkout.html?service='+encodeURIComponent(service)+'&order_id='+encodeURIComponent(orderId)},redirect:'if_required'});
  if(result.error)throw Error(result.error.message||'Payment was not completed.');
  await confirm(orderId);
 }catch(e){setMessage(e.message||'Payment could not be processed.',true)}
 finally{submitting=false;if($('service-pay'))$('service-pay').disabled=false}
}
async function confirm(id){
 setMessage('Verifying payment with Stripe…');
 const result=await request('confirm',{order_id:id});
 if(!result.paid)throw Error('Payment has not been confirmed.');
 history.replaceState(null,'',location.pathname+'?service='+encodeURIComponent(service));
 const main=$('main');main.innerHTML='<section class="ck-section"><div class="wf-container" style="max-width:860px"><article class="ck-panel" style="padding:35px"><span class="wf-eyebrow">PAYMENT CONFIRMED</span><h1>Thank you for choosing Workforce.</h1><p>Your FMCSA New Entrant Audit Preparation purchase has been verified. Keep the payment reference below for your records. Workforce will follow up using your purchase contact information.</p><p><strong>Order reference:</strong> <span id="wf-order-ref"></span></p><a class="wfne-button gold" href="new-entrant-audit.html">Back to New Entrant Services</a></article></div></section>';
 $('wf-order-ref').textContent=result.order_id;
}
(async()=>{try{
 const r=await fetch(BASE,{cache:'no-store'}),data=await r.json();
 const selected=(data.services||[]).find(x=>x.code===service);
 if(!selected)throw Error('This service package is not available.');
 render(selected);
 const order=params.get('order_id');
 if(order&&/^[0-9a-f-]{36}$/i.test(order)){
  $('service-pay').disabled=true;await confirm(order);
 }
 }catch(e){if($('main')){$('main').innerHTML='<section class="ck-section"><div class="wf-container"><div class="ck-alert ck-alert-error">'+String(e.message||'Unable to load this service')+'</div><p><a href="new-entrant-audit.html#packages">Return to service packages</a></p></div></section>'}}
})();
})();
