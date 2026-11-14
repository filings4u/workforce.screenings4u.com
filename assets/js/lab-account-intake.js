(()=>{'use strict';
const API='https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-house-lab-intake';
const token=new URLSearchParams(location.search).get('token')||'';
const form=document.getElementById('labIntakeForm');
const status=document.getElementById('labIntakeStatus');
const submit=document.getElementById('submitBtn');
const PO=/\bP(?:OST)?\.?\s*O(?:FFICE)?\.?\s*BOX\b|\bP\.?\s*O\.?\s*BOX\b|\bPOBOX\b/i;
const valid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(token);
const set=(message,error=false)=>{status.textContent=message;status.classList.toggle('error',error)};
async function call(action,fields){
 const r=await fetch(API,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,token,fields})});
 const data=await r.json().catch(()=>({}));if(!r.ok||data.error)throw Error(data.error||'Unable to process business intake.');
 return data;
}
function copy(prefix){
 const fields=['address_line1','address_line2','city','state','postal_code'];
 for(const name of fields){
  const dest=form.elements[prefix+'_'+name],src=form.elements['physical_'+name];
  if(dest&&src)dest.value=src.value;
 }
}
for(const e of form.querySelectorAll('[data-copy-address]'))e.addEventListener('change',()=>{if(e.checked)copy(e.dataset.copyAddress)});
function lock(){for(const el of form.elements)el.disabled=true;submit.hidden=true}
async function init(){
 if(!valid){set('Your secure purchase intake link is missing or invalid. Use the link provided after checkout.',true);lock();return}
 try{
 const state=await call('status');
 if(state.submitted){lock();set('Your Lab Account business intake has already been submitted. Reference: '+state.order_number);return}
 set('Purchase verified: '+state.order_number+'. Complete your information below to continue account setup.');
 }catch(e){set(e.message,true);lock()}
}
form?.addEventListener('submit',async e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const data=new FormData(form),fields={};
 for(const [k,v] of data)if(typeof v==='string'&&k!=='websiteTrap')fields[k]=v.trim();
 for(const group of ['physical','billing','shipping','mailing']){
  const address=fields[group+'_address_line1']||'';
  if(PO.test(address)){set('P.O. Boxes are not accepted for '+group+' addresses.',true);form.elements[group+'_address_line1'].focus();return}
 }
 submit.disabled=true;set('Submitting your business intake securely…');
 try{const result=await call('submit',fields);lock();set('Your intake has been received. Reference: '+result.order_number+'. Workforce will review the information and contact you about setup.')}
 catch(err){set(err.message,true);submit.disabled=false}
});
init();
})();