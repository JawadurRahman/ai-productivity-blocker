
const ALWAYS_ALLOW_PATTERNS = [
  /^chrome(-extension)?:\/\//,
  /^about:/,
  /^data:/,
  /^file:/,
  /^blob:/,
  /^newtab/,
  /localhost/,
  /127\.0\.0\.1/,
];

function isInternalUrl(url) {
  return ALWAYS_ALLOW_PATTERNS.some((p) => p.test(url));
}

async function getCachedVerdict(domain) {
  const data = await chrome.storage.local.get('cache');
  const cache = data.cache || {};
  const entry = cache[domain];
  if (!entry) return null;
  return entry.productive;
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only intercept main frame navigations
  if (details.frameId !== 0) return;

  const url = details.url;

  if (isInternalUrl(url)) return;

  // Never intercept our own extension pages
  const extBase = chrome.runtime.getURL('');
  if (url.startsWith(extBase)) return;

  let domain;
  try {
    domain = new URL(url).hostname;
  } catch {
    return;
  }

  if (!domain) return;

  // Check API key — if not set, allow all
  const keyData = await chrome.storage.local.get('apiKey');
  if (!keyData.apiKey) return;

  const cached = await getCachedVerdict(domain);

  if (cached === true) return; // known productive — allow

  // Unknown or known-blocked: always route through checking.html.
  // checking.js uses location.replace() so checking.html never lands in
  // the browser history, keeping "Go back" on the blocked page working.
  const checkingUrl =
    chrome.runtime.getURL('checking.html') +
    '?url=' +
    encodeURIComponent(url);
  chrome.tabs.update(details.tabId, { url: checkingUrl });
});

// Listen for messages from checking.js to store cache results
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'STORE_VERDICT') {
    chrome.storage.local.get('cache', (data) => {
      const cache = data.cache || {};
      cache[message.domain] = {
        productive: message.productive,
        timestamp: Date.now(),
      };
      chrome.storage.local.set({ cache }, () => sendResponse({ ok: true }));
    });
    return true; // keep channel open for async sendResponse
  }
});
