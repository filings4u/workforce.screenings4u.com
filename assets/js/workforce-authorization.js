(()=>{'use strict';
const API='https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-authorization';
const q=new URLSearchParams(location.search),token=q.get('token')||'',session_id=q.get('session_id')||'';
const $=id=>document.getElementById(id);let signed=null;
const legal='WORKFORCE LIMITED AUTHORIZATION. Selected powers only; no unrestricted authority. Agency-specific rules and forms continue to apply. Signer acknowledges an electronic signature has the same intended legal effect as a handwritten signature where law permits, and consents to electronic records. Government usernames, passwords and MFA codes are not shared or granted.';
const msg=(id,text,err=false)=>{const el=$(id);if(el){el.textContent=text;el.classList.toggle('error',err)}};
async function call(action,body={}){
 const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...(token?{token}:{session_id}),...body}),cache:'no-store'});
 const d=await r.json().catch(()=>({}));if(!r.ok||d.error)throw Error(d.error||'Unable to complete request');return d;
}
function collect(){
 const f=new FormData($('wfAuthForm'));const get=k=>String(f.get(k)||'').trim();
 return {decision:'granted',principal_legal_name:get('principal_legal_name'),principal_dba:get('principal_dba'),principal_address:get('principal_address'),principal_state:get('principal_state'),principal_usdot:get('principal_usdot'),authorized_parties:f.getAll('party'),ctpa_name:get('ctpa_name'),agent_scope:f.getAll('scope'),signer_name:get('signer_name'),signer_title:get('signer_title'),signer_email:get('signer_email'),signer_signature:get('signer_signature'),signer_capacity:get('signer_capacity'),expires_on:get('expires_on')||null,acknowledged_terms:f.has('acknowledged_terms'),acknowledged_privacy:f.has('acknowledged_privacy'),affirmed_authority:f.has('affirmed_authority'),electronic_signature_consent:f.has('electronic_signature_consent'),legal_text_snapshot:legal};
}
function complete(d){
 $('wfAuthForm').hidden=true;$('wfVerify').hidden=true;$('wfSuccess').hidden=false;
 $('wfProof').textContent=(d.decision==='granted'?'Electronically signed':'Authority declined')+(d.signed_at?' · Recorded '+new Date(d.signed_at).toLocaleString():'');
 if(d.account_setup_url)$('wfContinue').href=d.account_setup_url;else $('wfContinue').hidden=true;
 $('wfDownload').hidden=d.decision!=='granted';
 signed=d;
}
function pdf(){
 if(!signed)return;
 const C=window.jspdf?.jsPDF;if(!C){window.print();return}
 const d=signed,doc=new C({unit:'pt',format:'letter'});doc.setFillColor(1,18,47);doc.rect(0,0,612,100,'F');doc.setFillColor(253,193,2);doc.rect(0,98,612,3,'F');doc.setFont('helvetica','bold');doc.setTextColor(255);doc.setFontSize(21);doc.text('WORKFORCE',42,47);doc.setFontSize(10);doc.text('LIMITED POWER OF ATTORNEY & ELECTRONIC AUTHORIZATION',42,66);
 let y=125;const row=(label,value)=>{if(y>690){doc.addPage();y=65}doc.setTextColor(1,18,47);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text(label,42,y);doc.setFont('helvetica','normal');doc.setFontSize(10);const lines=doc.splitTextToSize(String(value||'Not provided'),520);doc.text(lines,42,y+15);y+=31+12*lines.length};
 row('Principal',d.principal_legal_name);row('Principal Address',d.principal_address);row('State / USDOT',[(d.principal_state||''),(d.principal_usdot||'')].join(' / '));row('Agents',(d.authorized_parties||[]).join(', '));row('Selected powers',(d.agent_scope||[]).map(x=>x.replaceAll('_',' ')).join('; '));row('Signer',d.signer_name);row('Title',d.signer_title);row('Email',d.signer_email);row('Signature method','Typed electronic signature with affirmative e-sign consent');row('Official timestamp (UTC)',d.signed_at?new Date(d.signed_at).toISOString():'');row('Document version',d.consent_legal_version||'2026-11-08-draft1');row('Authorization clause',d.legal_text_snapshot||legal);
 if(y>660){doc.addPage();y=70}doc.setTextColor(1,18,47);doc.setFont('times','italic');doc.setFontSize(28);doc.text(String(d.signer_signature||d.signer_name||''),42,y+18);doc.setDrawColor(130,140,150);doc.line(42,y+29,450,y+29);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('Typed electronic signature · timestamp securely recorded',42,y+43);
 const pages=doc.getNumberOfPages();for(let n=1;n<=pages;n++){doc.setPage(n);doc.setDrawColor(212,211,212);doc.line(42,750,570,750);doc.setTextColor(100,110,125);doc.setFontSize(8);doc.text('Workforce by screenings4u · Limited authorization · Page '+n+'/'+pages,42,766)}
 doc.save('Workforce-Limited-Authorization-'+String(d.authorization_id||'signed').slice(0,8)+'.pdf');
}
async function start(){
 if(!token&&!session_id){msg('wfStatus','Open this page from your verified Workforce checkout link.',true);return}
 try{const d=await call('status');if(d.recorded){complete(d);$('wfDownload').hidden=true;msg('wfProof','Already recorded. Your signed authorization is available in your authenticated Workforce portal.');return}
 msg('wfStatus','Payment verified. Complete the authorization form below.');$('wfAuthForm').hidden=false
 }catch(err){msg('wfStatus',err.message,true)}
}
$('wfSignedName').addEventListener('input',e=>$('wfCursive').textContent=e.target.value||'Your signature appears here');
$('wfAuthForm').addEventListener('submit',async e=>{
 e.preventDefault();const d=collect();if(!d.agent_scope.length||!d.authorized_parties.length){msg('wfSignStatus','Select at least one agent and authorized task.',true);return}
 if(d.authorized_parties.includes('ctpa')&&!d.ctpa_name){msg('wfSignStatus','Enter the designated C/TPA legal name.',true);return}
 if(d.signer_signature.toLowerCase()!==d.signer_name.toLowerCase()){msg('wfSignStatus','Your typed signature must match your legal signer name.',true);return}
 const b=$('wfSignBtn');b.disabled=true;try{const r=await call('sign',d);complete({...d,...r,consent_legal_version:'2026-11-08-draft1'})}catch(err){msg('wfSignStatus',err.message,true)}finally{b.disabled=false}
});
$('wfDecline').onclick=async()=>{
 if(!confirm('Continue without granting limited authority? Services requiring this authority cannot be performed until authorization is granted.'))return;
 const f=new FormData($('wfAuthForm'));try{const d=await call('sign',{decision:'declined',acknowledged_terms:f.has('acknowledged_terms'),acknowledged_privacy:f.has('acknowledged_privacy')});complete(d)}catch(e){msg('wfSignStatus',e.message,true)}
};
$('wfDownload').onclick=pdf;
start();
})();
