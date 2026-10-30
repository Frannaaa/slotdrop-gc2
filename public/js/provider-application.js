import {request,pageParameters,date,escapeHtml,notice} from './customer-common.js';
const status=document.querySelector('#status'),content=document.querySelector('#application'),retry=document.querySelector('#retry');
async function load(){
 retry.disabled=true;content.replaceChildren();notice(status,'Loading application status…');
 try{
  const id=pageParameters(location.search,['id']).get('id');
  if(!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id||''))throw new Error('Open the application link returned after submitting.');
  const application=await request('/api/provider-applications/'+id);
  const copy={pending:['Application received.','Review is pending. Your studio page has not been published. This demo does not verify representation or send an email confirmation.'],approved:['Application approved for setup.','Approval is recorded. A studio page and its offers still need to be prepared and checked before publication.'],declined:['Application not approved.','This application has not created a studio page. Check your details with the project owner before applying again.']}[application.status];
  if(!copy)throw new Error('The application status could not be read. Please retry.');
  content.innerHTML=`<p class="eyebrow">For studios · ${escapeHtml(application.status)}</p><h1>${copy[0]}</h1><p class="intro">${copy[1]}</p><dl><dt>Application reference</dt><dd class="reference">${escapeHtml(application.id)}</dd><dt>Received</dt><dd>${date(application.createdAt)}</dd></dl><p>Keep this link to check the status. Contact details are not displayed on this page.</p><a class="button secondary" href="/browse.html">Explore sample sessions ↗</a>`;
  notice(status,'Application status loaded.');
 }catch(error){notice(status,error.message,true);}finally{retry.disabled=false;}
}
retry.addEventListener('click',load);load();
