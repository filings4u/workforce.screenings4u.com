(()=>{'use strict';
const endpoint='https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-new-entrant-public-checkout';
async function load(){
 try{
  const response=await fetch(endpoint,{cache:'no-store'});
  if(!response.ok)return;
  const data=await response.json();
  for(const service of (data.services||[])){
   if(!['fmcsa_new_entrant_audit_prep','fmcsa_new_entrant_audit_standard','fmcsa_new_entrant_audit_premium'].includes(service.code))continue;
   const card=document.querySelector('[data-package="'+service.code+'"]');
   if(!card)continue;
   const price=Number(service.price);
   if(Number.isFinite(price)&&price>0)card.querySelector('[data-price]').textContent=price.toLocaleString('en-US',{style:'currency',currency:'USD'});
   const features=Array.isArray(service.features)?service.features.filter(x=>typeof x==='string'&&x.trim()):[];
   if(features.length){
    const ul=card.querySelector('ul');ul.replaceChildren();
    for(const feature of features){const li=document.createElement('li');li.textContent=feature;ul.append(li)}
   }
  }
 }catch(e){console.warn('New Entrant catalog temporarily unavailable',e)}
}
load();
})();
