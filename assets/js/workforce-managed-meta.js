/* Workforce main-site management: apply published page metadata from the authenticated staff editor's public read API.
 * Static HTML remains authoritative for initial crawler response until a server-side publishing pipeline is configured. */
(()=>{"use strict";
const path=location.pathname==="/index.html"?"/":location.pathname;
if(path!=="/"&&!/^\/[a-z0-9-]+\.html$/.test(path))return;
const endpoint="https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-main-site-public?path="+encodeURIComponent(path);
function meta(selector,attr,value){if(!value)return;let el=document.head.querySelector(selector);if(!el){el=document.createElement("meta");if(attr==="name")el.name=selector.slice(11,-2);else el.setAttribute("property",selector.slice(15,-2));document.head.append(el)}el.setAttribute("content",value)}
fetch(endpoint,{method:"GET",cache:"no-store"}).then(async r=>{if(!r.ok)return null;return r.json()}).then(data=>{
 const p=data?.page;if(!p||p.status!=="published")return;
 if(p.page_title){document.title=p.page_title;const og=document.querySelector('meta[property="og:title"]');if(og)og.content=p.page_title}
 if(p.meta_description){let d=document.querySelector('meta[name="description"]');if(!d){d=document.createElement("meta");d.name="description";document.head.append(d)}d.content=p.meta_description;let og=document.querySelector('meta[property="og:description"]');if(og)og.content=p.meta_description}
 if(p.canonical_url){try{const u=new URL(p.canonical_url);if(u.origin==="https://workforce.screenings4u.com"&&!u.search&&!u.hash){let canonical=document.querySelector('link[rel="canonical"]');if(!canonical){canonical=document.createElement("link");canonical.rel="canonical";document.head.append(canonical)}canonical.href=u.href}}catch(_){}}
 if(p.robots_index===false){let robots=document.querySelector('meta[name="robots"]');if(!robots){robots=document.createElement("meta");robots.name="robots";document.head.append(robots)}robots.content="noindex,nofollow"}
}).catch(e=>console.warn("Managed Workforce metadata unavailable",e));
})();