// Group assignment: Kirsten (discovery UI); Fran (research contract).
const form = document.querySelector('#studio-filters');
const results = document.querySelector('#studio-results');
const status = document.querySelector('#studio-status');
const types = ['', 'pottery', 'painting', 'pilates'];
const tags = ['', 'handbuilding', 'wheel-throwing', 'painting-included', 'group-class'];
const areaOptions = ['', 'Quezon City', 'Makati'];
const labels = {pottery:'Pottery',painting:'Painting',pilates:'Pilates',beginner:'Beginner friendly',handbuilding:'Handbuilding','wheel-throwing':'Wheel-throwing','painting-included':'Painting included','group-class':'Group class'};
let generation = 0;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(value);
function safeUrl(value) { const url = new URL(value); if (url.protocol !== 'https:') throw new Error('Invalid studio source.'); return escape(url.href); }
function filters() { return Object.fromEntries(['q','type','area','tag'].map(key => [key, String(form.elements.namedItem(key).value).trim()])); }
function pressed() { form.querySelectorAll('[data-type]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.type === form.elements.namedItem('type').value))); }
function restore() {
 const params = new URLSearchParams(location.search);
 form.reset();
 for (const key of ['q','type','area','tag']) {
  const value = params.get(key) || '';
  if ((key === 'type' && !types.includes(value)) || (key === 'tag' && !tags.includes(value)) || (key === 'area' && !areaOptions.includes(value))) continue;
  form.elements.namedItem(key).value = key === 'q' ? value.slice(0,100) : value;
 }
 pressed();
}
function matches(item, f) {
 const text = [item.business,item.activity,item.branch].join(' ').toLocaleLowerCase('en');
 return (!f.q || text.includes(f.q.toLocaleLowerCase('en'))) && (!f.type || item.activityType === f.type) && (!f.area || item.branch.includes(f.area)) && (!f.tag || item.tags.includes(f.tag));
}
function card(item) {
 const source = safeUrl(item.sourceUrl), scheduleSource = safeUrl(item.scheduleSourceUrl);
 const duration = item.durationMinutes === null ? 'Duration: confirm with studio.' : `Duration: ${item.durationMinutes} minutes.`;
 return `<article class="studio-card" data-type="${escape(item.activityType)}"><div class="studio-card-band"><span>${escape(labels[item.activityType])}</span><span>Studio reference</span></div><div class="studio-card-body"><h3>${escape(item.business)}</h3><p class="studio-branch">${escape(item.branch)}</p><p class="studio-activity">${escape(item.activity)}</p><p class="studio-price">${money(item.pricePhp)} <small>/ person</small></p><p class="studio-price-note">${escape(item.priceNote)}</p><div class="studio-tags">${item.tags.map(tag=>`<span class="studio-tag">${escape(labels[tag] || tag)}</span>`).join('')}</div><p class="studio-schedule"><strong>When to go</strong><br>${escape(item.schedule)}</p><details><summary>Location &amp; source details</summary><p>${escape(item.address)}</p><p>${escape(duration)}</p><p>Price and schedule checked ${escape(item.checkedAt)}. No SlotDrop seat allocation or booking cutoff verified.</p><a href="${scheduleSource}" target="_blank" rel="noopener noreferrer">Schedule source ↗</a></details><div class="studio-card-links"><a class="button" href="${source}" target="_blank" rel="noopener noreferrer">Check studio dates ↗</a></div></div></article>`;
}
async function load(updateUrl = false) {
 const current = ++generation, f = filters();
 if (updateUrl) {const params = new URLSearchParams(Object.entries(f).filter(([,value])=>value)); const next = location.pathname + (params.size ? '?' + params : ''); if (next !== location.pathname + location.search) history.pushState(null,'',next);}
 pressed(); results.replaceChildren(); status.textContent = 'Loading studio listings…'; status.dataset.error = 'false';
 const controller = new AbortController(), timeout = setTimeout(()=>controller.abort(),10000);
 try {
  const response = await fetch(document.body.dataset.catalogUrl,{signal:controller.signal});
  if (!response.ok) throw new Error('Studio listings could not load. Please try again.');
  const data = await response.json();
  if (!Array.isArray(data.offerings)) throw new Error('Studio listings could not load. Please try again.');
  if (current !== generation) return;
  const rows = data.offerings.filter(item => matches(item,f));
  results.innerHTML = rows.length ? rows.map(card).join('') : '<p class="studio-empty">No studio references match those filters. Try another activity or clear your filters.</p>';
  status.textContent = `${rows.length} researched ${rows.length === 1 ? 'activity' : 'activities'}`;
 } catch(error) { if (current === generation) { results.replaceChildren(); status.textContent = error.name === 'AbortError' ? 'The request timed out. Please try again.' : error.message; status.dataset.error = 'true'; } }
 finally {clearTimeout(timeout);}
}
form.addEventListener('submit',event=>{event.preventDefault();if(form.reportValidity())load(true);});
form.querySelectorAll('[data-type]').forEach(button=>button.addEventListener('click',()=>{form.elements.namedItem('type').value = button.dataset.type;load(true);}));
let restoring = false;
form.addEventListener('reset',event=>{if(!restoring){event.preventDefault();for(const key of ['q','type','area','tag'])form.elements.namedItem(key).value='';load(true);}});
window.addEventListener('popstate',()=>{restoring=true;restore();restoring=false;load();});
document.querySelector('#studio-retry').addEventListener('click',()=>load());
restoring=true;restore();restoring=false;load();
