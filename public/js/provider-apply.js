// Group assignment: Fran. Applications stay pending until a separate review.
import {request,pageParameters,positive,notice} from './customer-common.js';
const form=document.querySelector('#provider-form'),status=document.querySelector('#status'),submit=document.querySelector('#submit');
const fields=[document.querySelector('#application-fields'),document.querySelector('#contact-fields')];
const storageKey='slotdrop-provider-application-v1';
let pending=null,busy=false,providerId=null,ready=false,conflict=false;
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
function lock(value){fields.forEach(field=>field.disabled=value);}
function remember(body){const text=JSON.stringify(body);sessionStorage.setItem(storageKey,text);if(sessionStorage.getItem(storageKey)!==text)throw new Error('Storage unavailable');}
function forget(){try{sessionStorage.removeItem(storageKey);}catch{/* The saved request remains safe to retry. */}}
function restore(){
 try {
  const raw=sessionStorage.getItem(storageKey);if(!raw)return;
  const saved=JSON.parse(raw);
  if(!saved||!uuid(saved.requestId)||typeof saved.businessName!=='string'||typeof saved.contactEmail!=='string'||!Array.isArray(saved.activityTypes))throw new Error('Invalid saved request');
  pending=saved;providerId=saved.providerId;
  for(const [key,value] of Object.entries(saved)){
   if(['requestId','providerId','activityTypes'].includes(key))continue;
   const control=form.elements.namedItem(key);if(!control)continue;
   if(control.type==='checkbox')control.checked=value===true;else control.value=value;
  }
  form.querySelectorAll('[name=activityTypes]').forEach(box=>box.checked=saved.activityTypes.includes(box.value));
  lock(true);submit.textContent='Retry application';
  notice(status,'A submission still needs confirmation. Retry the saved details so another application is not created.');
 }catch{forget();pending=null;notice(status,'The saved draft could not be restored. Check the fields before submitting.',true);}
}
async function start(){
 submit.disabled=true;lock(true);restore();
 if(pending){ready=true;submit.disabled=false;return;}
 try{
  const params=pageParameters(location.search,['providerId']);
  if(params.has('providerId')){
   providerId=positive(params.get('providerId'));
   notice(status,'Loading the studio reference…');
   const studio=await request('/api/providers/'+providerId);
   // An activity's source may be an individual product listing, not the business homepage.
   let website='';
   try {
    const source=new URL(studio.activities[0]?.sourceUrl);
    if(source.protocol==='https:')website=source.origin+'/';
   } catch { /* Leave the website blank for the applicant to confirm. */ }
   for(const [name,value] of Object.entries({businessName:studio.name,city:studio.city,area:studio.area,website}))form.elements.namedItem(name).value=value;
   form.querySelectorAll('[name=activityTypes]').forEach(box=>box.checked=studio.activities.some(a=>a.activityType===box.value));
   notice(status,'Studio details are prefilled from the public reference. Check them before applying. Representation has not been verified.');
  }
 }catch(error){providerId=null;notice(status,'The studio link could not be loaded. You can enter the studio details below to start a new application.',true);}
 ready=true;lock(false);submit.disabled=false;
}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!ready)return;
 if(!pending){
  const data=new FormData(form),activityTypes=data.getAll('activityTypes');
  if(!activityTypes.length){notice(status,'Choose at least one activity offered by your studio.',true);form.querySelector('[name=activityTypes]').focus();return;}
  const body={requestId:crypto.randomUUID(),providerId,activityTypes};
  for(const name of ['businessName','website','city','area','contactName','contactEmail','representativeRole'])body[name]=data.get(name);
  body.authorized=data.get('authorized')==='on';body.demoAcknowledged=data.get('demoAcknowledged')==='on';
  try{remember(body);}catch{notice(status,'This browser cannot save a retry reference. Enable session storage before submitting. Nothing was sent.',true);return;}
  pending=body;
 }
 busy=true;lock(true);submit.disabled=true;notice(status,'Saving your demo application…');
 try{
  const saved=await request('/api/provider-applications',{method:'POST',body:JSON.stringify(pending)});
  if(!uuid(saved?.id))throw Object.assign(new Error('Invalid application response'),{uncertain:true});
  forget();location.assign('/provider-application.html?id='+encodeURIComponent(saved.id));
 }catch(error){
  if(error.status===409){
   conflict=true;submit.textContent="Application reference conflict";notice(status,"These details differ from an application already saved with this reference. Keep this page and check with the project owner before submitting again.",true);
  }else if(error.status>=400&&error.status<500){
   forget();pending=null;lock(false);submit.textContent='Submit demo application ↗';
   notice(status,error.message,true);
  }else{
   submit.textContent='Retry application';notice(status,'We could not confirm whether the application was saved. Retry these same details to check without creating another application.',true);
  }
 }finally{busy=false;submit.disabled=conflict;}
});
start();
