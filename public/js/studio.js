import {
  request, pageParameters, positive, escapeHtml, money, card, notice, safeHttpsUrl,
} from './customer-common.js';

const status = document.querySelector('#status');
const profile = document.querySelector('#profile');
const sessions = document.querySelector('#sessions');
const retry = document.querySelector('#retry');

function sourceLink(value) {
  const url = safeHttpsUrl(value);
  return url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Published studio details ↗</a>`
    : '';
}

async function load() {
  retry.disabled = true;
  profile.replaceChildren();
  sessions.replaceChildren();
  notice(status, 'Loading studio reference…');

  try {
    const params = pageParameters(location.search, ['providerId']);
    const id = positive(params.get('providerId'));
    const studio = await request('/api/providers/' + id);
    document.title = studio.name + ' | SlotDrop';

    const activities = studio.activities.map(activity => `
      <article class="profile-activity">
        <h3>${escapeHtml(activity.activity)}</h3>
        <p>${money(activity.publishedPriceCentavos)} published reference price · ${activity.durationMinutes} minutes</p>
        <p>${escapeHtml(activity.publishedSchedule)}</p>
        <p>${sourceLink(activity.sourceUrl)}${activity.priceSourceUrl ? ' · ' + sourceLink(activity.priceSourceUrl) : ''} · checked ${escapeHtml(activity.checkedAt)}</p>
      </article>`).join('');

    profile.innerHTML = `
      <p class="eyebrow">${escapeHtml(studio.area)} · ${escapeHtml(studio.city)}</p>
      <h1>${escapeHtml(studio.name)}</h1>
      <p class="reference">
        <strong>Independent studio reference · Unclaimed</strong>
        <br>We researched this business from its public website.
        A SlotDrop partnership and live availability have not been confirmed.
      </p>
      <h2>Published activities</h2>
      ${activities}
      <p>Represent this studio? Apply for a page. We review representation and activity details before publication.</p>
      <a class="button secondary" href="/provider-apply.html?providerId=${studio.id}">Apply for a studio page ↗</a>`;

    sessions.innerHTML = studio.slots.length
      ? studio.slots.map(slot => card(slot)).join('')
      : '<p>No sample sessions are currently open. Published studio details above remain available.</p>';
    notice(status, 'Studio reference loaded.');
  } catch (error) {
    notice(status, error.message, true);
  } finally {
    retry.disabled = false;
  }
}

retry.addEventListener('click', load);
load();
