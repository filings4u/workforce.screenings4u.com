(()=>{'use strict';
const API='https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-house-lab-catalog';
const ORDER=['lab-account','lab-account-random-consortium','lab-account-random-consortium-docs'];
const root=document.getElementById('houseLabProducts'),status=document.getElementById('houseLabStatus'),matrix=document.getElementById('houseLabMatrix');
const price=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n));
function text(parent,value,tag='span',className=''){const node=document.createElement(tag);node.textContent=String(value);if(className)node.className=className;parent.append(node);return node}
function card(item,index){
 const article=document.createElement('article');article.className='lab-card';
 text(article,index===1?'POPULAR PACKAGE':'HOUSE LAB ACCOUNT','span','lab-eyebrow');
 text(article,item.name,'h3');
 text(article,item.description||'Laboratory account and setup services.','p');
 const amount=text(article,price(item.price),'div','lab-money');
 text(amount,' one-time setup','span');
 const plan=text(article,'','div','lab-sub-note');
 plan.textContent=(item.included_month?'First '+item.included_month+' days of ':'')+(item.subscription_plan||'Workforce C/TPA subscription')+' included as described in purchase terms. '+(item.continuation_monthly_price?'Continuation: '+price(item.continuation_monthly_price)+'/month until canceled.':'');
 text(article,'Package inclusions','h4');
 const ul=document.createElement('ul');
 for(const f of item.features||[])text(ul,f.title,'li');article.append(ul);
 const link=text(article,'Choose package','a','btn '+(index===1?'btn-gold':'btn-navy'));
 link.href='checkout.html?service='+encodeURIComponent(item.code);
 return article;
}
async function run(){
 if(!root||!status||!matrix)return;
 try{
 const r=await fetch(API,{method:'GET',cache:'no-store'}),body=await r.json().catch(()=>({}));
 if(!r.ok||!Array.isArray(body.items))throw Error(body.error||'Unable to load the current packages.');
 const items=ORDER.map(x=>body.items.find(item=>item.code===x)).filter(Boolean);
 if(items.length!==3)throw Error('Not all three House Lab Account packages are currently available. Please contact Workforce.');
 root.replaceChildren(...items.map(card));
 const features=new Map();
 for(const item of items)for(const f of item.comparison||[])if(!features.has(f.code))features.set(f.code,f);
 const rows=[];
 for(const feature of features.values()){
  const row=document.createElement('tr');
  text(row,feature.title,'th');
  for(const item of items){
   const f=(item.comparison||[]).find(z=>z.code===feature.code),cell=text(row,f?(f.status==='available'?'Included':'Planned'):'—','td');
   if(f)cell.className=f.status==='available'?'yes':'planned';
  }
  rows.push(row);
 }
 matrix.replaceChildren(...rows);
 status.textContent='3 verified House Lab Account packages available.';
 }catch(e){
 root.replaceChildren();matrix.replaceChildren();
 const row=document.createElement('tr'),cell=text(row,'Live package details are temporarily unavailable.','td');cell.colSpan=4;matrix.append(row);
 status.textContent=e.message||'Unable to load House Lab Account packages.';
 }
}
run();
})();