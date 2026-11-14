/* Workforce subscription catalog: public prices and exact included features from Supabase.
 * This is presentation only; checkout and each portal authorize paid features server-side.
 * Full server-sourced feature lists also exist in HTML as SEO/offline fallback. */
(()=>{'use strict';
const ENDPOINT='https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-checkout';
const types=['employer','ctpa','owner_operator'];
const FEATURE_METADATA={"employee_management":["Employees / Drivers","Manage workforce and driver records.",10],"employer_management":["Employer Client Management","Manage employer client accounts.",20],"bulk_employee_import":["Bulk Employee / Driver Import","Import employee and driver rosters with validation and duplicate handling.",28],"team_users":["Staff / Account Users","Manage authorized account users and staff.",30],"locations":["Locations / Terminals","Manage employer locations, terminals, divisions and work sites.",40],"ders_supervisors":["DERs & Supervisors","Manage DER and supervisor roles.",50],"post_accident":["Post-Accident Management","Record DOT and Non-DOT accidents, evaluate testing requirements, and create required post-accident testing orders.",55],"action_center":["Compliance Action Center","Surface expiring credentials, missing items, testing deadlines, and open compliance work.",57],"policy_acknowledgments":["Policy Distribution & Acknowledgments","Distribute employer policies to workers and track acknowledgments.",58],"training_records":["Training Records","Track supervisor and workforce compliance training, certificates, and expirations.",59],"programs":["DOT / Non-DOT Programs","Manage testing and compliance programs.",60],"consortium_pools":["Consortium Pools","Create and administer consortium pools.",70],"random_pool":["Random Pool Participation","Participate in applicable random testing pools.",80],"random_selections":["Random Selections","Execute and manage random selections.",90],"testing_orders":["Testing Orders","Create and manage testing orders and outside-provider records.",100],"collection_sites":["Collection Site Finder","View and use collection sites that screenings4u has enabled for the Employer account.",110],"results_summary":["Result Summaries","View authorized testing result summaries.",120],"results_sensitive":["Sensitive Results","Access sensitive result detail when authorized.",130],"compliance":["Compliance Management","Manage compliance cases, deadlines and requirements.",140],"documents":["Documents & Certificates","Manage compliance documents and certificates.",160],"standard_reports":["Standard Reports","Generate standard operational and compliance reports.",170],"advanced_reports":["Advanced Reports / MIS","Generate advanced and regulatory reporting.",180],"billing_tools":["Billing Tools","Use client billing and billing-management tools.",190],"notifications":["Notifications & Reminders","Use compliance and testing notifications.",200],"customer_portal_delivery":["Customer Portal Delivery","Send selections, results and other approved records to linked Employer portals.",210],"integrations":["Integrations","Use enabled external integrations.",210],"scheduler":["Scheduler","Create work schedules, shifts, meetings, and manage employee/staff time off.",210],"branded_email":["Branded Customer Email","Send customer-facing email using the C/TPA logo and brand settings.",211],"policy_builder":["Employer Drug & Alcohol Policy Builder","Create and manage DOT and Non-DOT employer policy documents.",216],"employer_settings":["Employer Feature Controls","Configure employer-level workflow settings under a C/TPA.",217],"employer_import":["Employer Spreadsheet Import","Bulk import employer client accounts from CSV.",218],"enrollment_documents":["Enrollment Agreements & Certificates","Issue enrollment agreements, consortium agreements, and certificates.",219],"client_invoicing":["Client Invoicing","Create and send invoices to employer clients without platform payment collection.",220],"task_manager":["Task Manager","Create, assign, track, and complete workforce tasks for employees and staff.",220],"white_label":["White Label","Enterprise white-label capability for the C/TPA portal, sponsored Employer portal, customer-facing invoices, and branded transactional email.",220],"client_payments":["Integrated Client Payments","Optional payment processor add-on that lets a C/TPA accept payments from its Employer customers through a branded checkout experience.",221],"sso":["Single Sign-On","Use enterprise SSO capabilities.",230],"audit_history":["Audit History","View permitted account activity history.",240],"rtd_follow_up":["Return-to-Duty & Follow-Up Testing","Maintain SAP-directed Return-to-Duty and follow-up cases.",155],"clearinghouse_tools":["FMCSA Clearinghouse Tools","Requires approved Clearinghouse configuration and authorized user access.",150],"driver_qualification":["Driver Qualification Records","Maintain DOT-required driver qualification documents.",25]};
const SETUP_NOTES={
 sso:'Identity-provider configuration and admin approval required',
 integrations:'Admin approval and vendor setup required',
 client_payments:'Optional payment-processor setup required; processing fees may apply',
 white_label:'Branding handoff to customer portals requires configuration',
 branded_email:'Email domain and branding configuration required',
 customer_portal_delivery:'Requires linked customer portal configuration',
 clearinghouse_tools:'FMCSA Clearinghouse authorization and account connection required'
};
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:Number(n)%1?2:0,maximumFractionDigits:2}).format(n);
const cards=[...document.querySelectorAll('.wf-price-card,.wf-purchase-card,.emp-plan')];
if(!cards.length)return;
const links=cards.map(card=>{const anchor=card.querySelector('a[href*="checkout.html?plan="]');if(!anchor)return null;try{const url=new URL(anchor.href,location.href);return {card,code:url.searchParams.get('plan')};}catch{return null}}).filter(Boolean);
Promise.allSettled(types.map(async type=>{
 const response=await fetch(ENDPOINT+'?type='+encodeURIComponent(type),{method:'GET',mode:'cors',cache:'no-store'});
 if(!response.ok)throw Error('Public catalog unavailable');
 const payload=await response.json();
 if(!Array.isArray(payload.plans))throw Error('Invalid public catalog response');
 return payload.plans;
})).then(results=>{
 const allPlans=results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
 const byCode=new Map(allPlans.map(p=>[p.code,p]));
 // Keep shared benefits in identical order across each audience's tiers,
 // appending newly introduced benefits only after the lower-tier list.
 const featureOrders=new Map();
 const enabledFor=p=>Object.keys(p.feature_entitlements||{}).filter(k=>p.feature_entitlements[k]===true);
 const audienceTypes=new Set(allPlans.map(p=>p.audience).filter(Boolean));
 for(const audience of audienceTypes){
   const audiencePlans=allPlans.filter(p=>p.audience===audience&&p.active!==false&&p.feature_entitlements&&typeof p.feature_entitlements==='object')
     .sort((a,b)=>enabledFor(a).length-enabledFor(b).length||String(a.code).localeCompare(String(b.code)));
   const order=[];
   for(const plan of audiencePlans){
     const keys=enabledFor(plan).sort((a,b)=>(FEATURE_METADATA[a]?.[2]??999)-(FEATURE_METADATA[b]?.[2]??999)||a.localeCompare(b));
     for(const key of keys)if(!order.includes(key))order.push(key);
   }
   featureOrders.set(audience,order);
 }
 for(const {card,code} of links){
   const plan=byCode.get(code);
   if(!plan||plan.active===false)continue;
   const annual=plan.audience==='owner_operator';
   const amount=Number(annual?plan.annual_price:plan.monthly_price);
   if(Number.isFinite(amount)&&amount>0){
     const output=card.querySelector('.wf-price-money strong,.emp-plan-price strong');
     if(output)output.textContent=money(amount);
   }
   const entitlements=plan.feature_entitlements;
   if(!entitlements||typeof entitlements!=='object')continue;
   const tierOrder=featureOrders.get(plan.audience)||[];
   const enabled=Object.keys(entitlements).filter(key=>entitlements[key]===true)
    .sort((a,b)=>{
      const ai=tierOrder.indexOf(a),bi=tierOrder.indexOf(b);
      return (ai<0?999:ai)-(bi<0?999:bi)||a.localeCompare(b);
    });
   if(!enabled.length)continue;
   const ul=card.querySelector('ul.wf-plan-full-list');
   if(!ul)continue;
   const items=enabled.map(key=>{
     const li=document.createElement('li');
     li.dataset.feature=key;
     const content=document.createElement('span');
     content.className='wf-feature-text';
     const name=document.createElement('span');
     name.textContent=FEATURE_METADATA[key]?.[0]||key.split("_").map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" ");
     content.append(name);
     const note=SETUP_NOTES[key];
     if(note){
       const badge=document.createElement('small');
       badge.className='wf-plan-setup-note';badge.textContent=note;
       content.append(badge);
     }
     li.append(content);
     const description=FEATURE_METADATA[key]?.[1];
     if(description)li.title=description;
     return li;
   });
   ul.replaceChildren(...items);
   const count=card.querySelector('.wf-plan-count strong');
   if(count)count.textContent=String(enabled.length);
 }
}).catch(()=>{/* Full published feature lists remain visible as fallback. */});
})();