/* Public pricing sync for the existing Workforce DOT subscription checkout catalog.
 * No private credentials are embedded. Catalog GET returns active public plans.
 * Purchase links continue to the established checkout service. */
(()=>{'use strict';
const ENDPOINT='https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-checkout';
const types=['employer','ctpa','owner_operator'];
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:Number(n)%1?2:0,maximumFractionDigits:2}).format(n);
const cards=[...document.querySelectorAll('.wf-price-card,.wf-purchase-card')];
if(!cards.length)return;
const links=cards.map(card=>{const anchor=card.querySelector('a[href*="checkout.html?plan="]');if(!anchor)return null;try{const url=new URL(anchor.href,location.href);return {card,code:url.searchParams.get('plan')};}catch{return null}}).filter(Boolean);
Promise.allSettled(types.map(async type=>{
 const response=await fetch(ENDPOINT+'?type='+encodeURIComponent(type),{method:'GET',mode:'cors',cache:'no-store'});
 if(!response.ok)throw Error('Catalog unavailable');
 const payload=await response.json();
 if(!Array.isArray(payload.plans))throw Error('Invalid catalog');
 return payload.plans;
})).then(results=>{
 const fulfilled=results.filter(r=>r.status==='fulfilled');
 if(!fulfilled.length)return;
 const byCode=new Map(fulfilled.flatMap(r=>r.value).map(p=>[p.code,p]));
 for(const {card,code} of links){
   const plan=byCode.get(code);
   if(!plan||plan.active===false)continue;
   const annual=plan.audience==='owner_operator';
   const amount=Number(annual?plan.annual_price:plan.monthly_price);
   if(!Number.isFinite(amount)||amount<=0)continue;
   const output=card.querySelector('.wf-price-money strong');
   if(output)output.textContent=money(amount);
   const inline=card.querySelector('h3');
   if(!output&&inline){
     const first=[...inline.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
     if(first)first.nodeValue=money(amount);
   }
 }
}).catch(()=>{/* Snapshot pricing is still displayed; checkout validates current plans. */});
})();