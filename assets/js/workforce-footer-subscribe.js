(()=>{'use strict';
const form=document.querySelector('.footer-subscribe-form');
if(!form)return;
const input=form.querySelector('input[name="email"]'),button=form.querySelector('button[type="submit"]'),message=form.querySelector('[role="status"]');
const endpoint='https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-newsletter-subscribe';
form.addEventListener('submit',async event=>{
 event.preventDefault();
 if(button.disabled||!form.reportValidity())return;
 button.disabled=true;message.textContent='Subscribing…';message.classList.remove('is-error');
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:input.value.trim(),consent:form.elements.consent.checked,website:form.elements.website.value})});
  const body=await response.json().catch(()=>({}));
  if(!response.ok||body.success!==true)throw Error(body.error||'Could not subscribe right now. Please try again.');
  message.textContent=body.message||"You're subscribed to Workforce updates.";
  form.reset();
 }catch(error){message.textContent=error.message||'Could not subscribe right now. Please try again.';message.classList.add('is-error');}
 finally{button.disabled=false;}
});
})();