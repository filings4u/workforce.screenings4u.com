/* Workforce marketing forms — public Supabase function; no secret credentials. */
(()=>{'use strict';
const API='https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-checkout-status';
const PUBLISHABLE_KEY='sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC';
const clean=(x,max=10000)=>String(x??'').trim().slice(0,max);
document.querySelectorAll('form[data-workforce-inquiry]').forEach(form=>{
  const kind=form.dataset.workforceInquiry;
  const status=form.querySelector('[data-inquiry-status]'),button=form.querySelector('button[type="submit"]');
  const start=Date.now();
  const update=(message,state)=>{status.textContent=message;status.dataset.state=state||'';};
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!form.reportValidity())return;
    const fd=new FormData(form);
    if(clean(fd.get('company_website'))){update('Thank you.','success');form.reset();return;}
    if(Date.now()-start<1800){update('Please review the form and submit again.','error');return;}
    const sourceSupport=kind==='support';
    const topic=sourceSupport?clean(fd.get('support_topic'),120):clean(fd.get('topic'),120);
    const priority=clean(fd.get('priority'),40),affected=clean(fd.get('affected_page'),250);
    let message=clean(fd.get('message'),9500);
    if(sourceSupport){message=['Workforce website support inquiry',priority?'Priority: '+priority:'',affected?'Affected page or portal: '+affected:'',message].filter(Boolean).join('\n\n');}
    const existing=clean(fd.get('existing_customer')).toLowerCase();
    const toCount=v=>{const x=clean(v);return x!==''?Number(x):null;};
    const payload={
      action:'marketing_inquiry',
      inquiry_type:kind==='demo'?'demo':'contact',
      first_name:clean(fd.get('first_name'),100),
      last_name:clean(fd.get('last_name'),100),
      email:clean(fd.get('email'),320).toLowerCase(),
      phone:clean(fd.get('phone'),50)||null,
      company:clean(fd.get('company'),220)||null,
      account_type:clean(fd.get('account_type'),80)||null,
      dot_agency:clean(fd.get('dot_agency'),80)||null,
      existing_customer:existing==='yes'?true:existing==='no'?false:null,
      topic:topic||null,
      employee_count:toCount(fd.get('employee_count')),
      employer_client_count:toCount(fd.get('employer_client_count')),
      timeline:clean(fd.get('timeline'),120)||null,
      message:message||null,
      page_url:location.href.slice(0,2000),
      source:'workforce.screenings4u.com'
    };
    button.disabled=true;button.setAttribute('aria-busy','true');
    update('Sending your request…','sending');
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),18000);
    try{
      const response=await fetch(API,{method:'POST',mode:'cors',headers:{'Content-Type':'application/json','apikey':PUBLISHABLE_KEY},body:JSON.stringify(payload),signal:controller.signal});
      const result=await response.json().catch(()=>({}));
      if(!response.ok||result.error||!result.ok)throw new Error(result.error||'The request could not be submitted. Please try again.');
      form.reset();
      update(kind==='demo'?'Your demo request was received. Our team will follow up.':kind==='support'?'Your support request was received. Our team will follow up.':'Your sales inquiry was received. Our team will follow up.','success');
      status.focus?.();
    }catch(error){
      update(error.name==='AbortError'?'The request timed out. Please try again or contact support@screenings4u.com.':clean(error.message,280)||'Submission failed. Please try again or contact support@screenings4u.com.','error');
    }finally{clearTimeout(timeout);button.disabled=false;button.removeAttribute('aria-busy');}
  });
});
})();