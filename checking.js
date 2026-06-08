(async () => {
  const params = new URLSearchParams(window.location.search);
  const targetUrl = params.get('url');

  if (!targetUrl) {
    window.location.replace('about:blank');
    return;
  }

  let domain;
  try {
    domain = new URL(targetUrl).hostname;
  } catch {
    window.location.replace(targetUrl);
    return;
  }

  document.getElementById('domain-label').textContent = domain;

  // Check cache first — skip API call if we already have a verdict.
  // Using replace() so this page is never added to browser history,
  // which keeps "Go back" on the blocked page working correctly.
  const cacheData = await chrome.storage.local.get('cache');
  const cached = (cacheData.cache || {})[domain];
  if (cached !== undefined) {
    if (cached.productive) {
      window.location.replace(targetUrl);
    } else {
      window.location.replace(
        chrome.runtime.getURL('blocked.html') + '?url=' + encodeURIComponent(targetUrl)
      );
    }
    return;
  }

  const data = await chrome.storage.local.get('apiKey');
  const apiKey = data.apiKey;

  if (!apiKey) {
    window.location.replace(targetUrl);
    return;
  }

  let productive = true;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5,
        system:
          'You are a strict productivity classifier for a website blocker. Answer with exactly one word — "yes" or "no" — with no punctuation or explanation.\n\nA site is productive ("yes") only if it is directly used for focused work or study: coding tools, documentation, developer references, search engines, cloud consoles, productivity suites (email, docs, calendar), online courses, or academic resources.\n\nA site is unproductive ("no") if it is a social network (including LinkedIn), video streaming, news, entertainment, forums, shopping, gaming, or anything primarily used for leisure or passive browsing. When in doubt, answer "no".',
        messages: [
          {
            role: 'user',
            content: `Is ${domain} a productive website?`,
          },
        ],
      }),
    });

    if (!response.ok) {
      window.location.replace(targetUrl);
      return;
    }

    const json = await response.json();
    const answer = json.content?.[0]?.text?.trim().toLowerCase() ?? 'yes';
    productive = answer.startsWith('yes');
  } catch {
    window.location.replace(targetUrl);
    return;
  }

  await chrome.runtime.sendMessage({ type: 'STORE_VERDICT', domain, productive });

  if (productive) {
    window.location.replace(targetUrl);
  } else {
    window.location.replace(
      chrome.runtime.getURL('blocked.html') + '?url=' + encodeURIComponent(targetUrl)
    );
  }
})();
