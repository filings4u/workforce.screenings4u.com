(()=>{'use strict';
const API='https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-checkout-status';
const params=new URLSearchParams(location.search),token=params.get('token')||'';
const $=id=>document.getElementById(id);const form=$('wfAccountForm'),status=$('wfAccountStatus'),error=$('wfAccountError');
function report(text,bad=false){status.textContent=text;status.classList.toggle('error',bad)}
async function call(action,data={}){
 const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,token,...data}),cache:'no-store'});
 const o=await r.json().catch(()=>({}));
 if(!r.ok||o.error){if(o.authorization_url&&new URL(o.authorization_url).hostname==='workforce.screenings4u.com'){location.replace(o.authorization_url);return new Promise(()=>{})}throw Error(o.error||'Unable to complete account setup')}
 return o
}
async function init(){
 if(!token){report('Please open the secure account creation link from your completed Workforce authorization.',true);return}
 try{
 const data=await call('intake_status');
 if(data.completed){location.replace('order-summary.html?token='+encodeURIComponent(token));return}
 $('wfPurchaseEmail').value=data.email||'';
 $('wfAgencyField').hidden=!data.requirements?.agency_select;
 $('wfDotField').hidden=!data.requirements?.dot_number_required;
 if(data.requirements?.dot_number_required)$('wfDotField').querySelector('input').required=true;
 form.hidden=false;report('Your payment and authorization are recorded. Complete the company and billing fields below.')
 }catch(e){report(e.message||'Unable to load account setup',true)}
}
form.addEventListener('submit',async e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const btn=$('wfAccountSubmit');btn.disabled=true;error.textContent='Creating your account and sending the secure invitation…';
 try{
  const intake=Object.fromEntries(new FormData(form));
  intake.billing_same_as_company=true;
  const result=await call('complete_intake',{intake});
  if(!result.completed)throw Error('Account creation has not yet completed');
  location.replace('order-summary.html?token='+encodeURIComponent(token));
 }catch(e){error.textContent=e.message||'Account creation failed. Your data has not been lost.';error.classList.add('error');btn.disabled=false}
});
init();
})();