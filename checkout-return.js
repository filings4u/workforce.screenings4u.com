(()=>{
'use strict';
const API='https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-checkout-status';
const params=new URLSearchParams(location.search);
const sessionId=(params.get('session_id')||'').trim();
const card=document.querySelector('.return-card');
const title=document.getElementById('returnTitle');
const message=document.getElementById('returnMessage');
const note=document.getElementById('returnNote');
const actions=document.getElementById('returnActions');
const continueLink=document.getElementById('returnContinue');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function status(){
  const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sessionId})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.error) throw new Error(data.error||'Unable to confirm your purchase.');
  return data;
}
function ready(url){
  card.classList.add('is-ready');
  title.textContent='Payment confirmed.';
  message.textContent='Your secure account setup is ready. Continue to enter your organization and administrator information.';
  note.textContent='You can continue now.';
  continueLink.href=url;
  actions.hidden=false;
  location.replace(url);
}
function completed(data={}){
  card.classList.add('is-ready');
  title.textContent='Your account is ready.';
  message.textContent='Your Workforce account has already been provisioned.';
  note.textContent='Use the secure sign-in page to access your portal.';
  continueLink.textContent='Go to sign in';
  continueLink.href='https://portal.screenings4u.com/';
  actions.hidden=false;
}
function fail(text){
  card.classList.add('is-error');
  title.textContent='We could not finish account setup.';
  message.textContent=text||'Your payment may still be processing. Please try again or contact support.';
  note.textContent='Your card will not be charged again by refreshing this page.';
  continueLink.textContent='Try account setup';
  continueLink.href=`account-creation.html?session_id=${encodeURIComponent(sessionId)}`;
  actions.hidden=false;
}
async function start(){
  if(!sessionId){fail('The checkout session reference is missing. Return to pricing and select your plan again.');return;}
  try{
    for(let i=0;i<40;i++){
      const data=await status();
      if(data.intake_url){ready(data.intake_url);return;}
      if(data.status==='provisioned'){completed(data);return;}
      if(['failed','cancelled','expired'].includes(String(data.status||'').toLowerCase())){fail('The checkout could not be completed. Please contact support if you believe payment was submitted.');return;}
      if(i===8) message.textContent='Payment is confirmed. We are finishing the account setup link now.';
      await sleep(1500);
    }
    fail('Payment was received, but account setup is taking longer than expected. Use the button below to continue checking your purchase.');
  }catch(error){fail(error?.message||'Unable to confirm your purchase.');}
}
start();
})();
