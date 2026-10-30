import {request,pageParameters,positive,escapeHtml,money,card,notice} from './customer-common.js';
const status=document.querySelector('#status'),profile=document.querySelector('#profile'),sessions=document.querySelector('#sessions'),retry=document.querySelector('#retry');
function sourceLink(url){try{const source=new URL(url);return source.protocol==='https:'?`<a href="${escapeHtml(source.href)}" target="_blank" rel="noopener noreferrer">Published studio details ↗</a>`:'';}catch{return '';}}
async function load(){
 retry.disabled=true;profile.replaceChildren();sessions.replaceChildren();notice(status,'Loading studio reference…');
 try{
  const id=positive(pageParameters(location.search,['providerId']).get('providerId'));
  const studio=await request('/api/providers/'+id);
  document.title=studio.name+' | SlotDrop';
  profile.innerHTML=`<p class="eyebrow">${escapeHtml(studio.area)} · ${escapeHtml(studio.city)}</p><h1>${escapeHtml(studio.name)}</h1><p class="reference"><strong>Independent studio reference · Unclaimed</strong><br>We researched this business from its public website. A SlotDrop partnership and live availability have not been confirmed.</p><h2>Published activities</h2>${studio.activities.map(activity=>`<article class="profile-activity"><h3>${escapeHtml(activity.activity)}</h3><p>${money(activity.publishedPriceCentavos)} published reference price · ${activity.durationMinutes} minutes</p><p>${escapeHtml(activity.publishedSchedule)}</p><p>${sourceLink(activity.sourceUrl)}${activity.priceSourceUrl?` · ${sourceLink(activity.priceSourceUrl)}`:''} · checked ${escapeHtml(activity.checkedAt)}</p></article>`).join('')}<p>Represent this studio? Apply for a page. We review representation and activity details before publication.</p><a class="button secondary" href="/provider-apply.html?providerId=${studio.id}">Apply for a studio page ↗</a>`;
  sessions.innerHTML=studio.slots.length?studio.slots.map(slot=>card(slot)).join(''):'<p>No sample sessions are currently open. Published studio details above remain available.</p>';
  notice(status,'Studio reference loaded.');
 }catch(error){notice(status,error.message,true);}finally{retry.disabled=false;}
}
retry.addEventListener('click',load);load();
