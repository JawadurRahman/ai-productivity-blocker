async function hashPassword(password) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function load() {
  const data = await chrome.storage.local.get(['apiKey', 'cache', 'strictMode']);

  if (data.apiKey) {
    document.getElementById('api-key').value = data.apiKey;
    showStatus('key-status', 'Key saved.', 'ok');
  }

  renderCache(data.cache || {});
  applyStrictMode(!!data.strictMode);
}

function applyStrictMode(isStrict) {
  document.getElementById('strict-off').style.display = isStrict ? 'none' : 'block';
  document.getElementById('strict-on').style.display = isStrict ? 'block' : 'none';

  document.getElementById('api-key').disabled = isStrict;
  document.getElementById('btn-save-key').disabled = isStrict;
  document.getElementById('btn-clear-cache').disabled = isStrict;
}

function showStatus(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'status-msg ' + type;
}

function renderCache(cache) {
  const list = document.getElementById('cache-list');
  list.innerHTML = '';
  const domains = Object.keys(cache);
  if (domains.length === 0) {
    list.innerHTML = '<li class="empty">Cache is empty.</li>';
    return;
  }
  domains.forEach((domain) => {
    const entry = cache[domain];
    const li = document.createElement('li');
    const badge = document.createElement('span');
    badge.className = entry.productive ? 'badge badge-ok' : 'badge badge-blocked';
    badge.textContent = entry.productive ? 'productive' : 'blocked';
    li.textContent = domain + ' ';
    li.appendChild(badge);

    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.className = 'btn btn-danger btn-small';
    btn.addEventListener('click', async () => {
      const d = await chrome.storage.local.get(['cache', 'strictMode']);
      if (d.strictMode) return;
      const c = d.cache || {};
      delete c[domain];
      await chrome.storage.local.set({ cache: c });
      renderCache(c);
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

document.getElementById('btn-save-key').addEventListener('click', async () => {
  const key = document.getElementById('api-key').value.trim();
  if (!key) {
    showStatus('key-status', 'Enter a key first.', 'error');
    return;
  }
  await chrome.storage.local.set({ apiKey: key });
  showStatus('key-status', 'Saved!', 'ok');
});

document.getElementById('btn-clear-cache').addEventListener('click', async () => {
  await chrome.storage.local.set({ cache: {} });
  renderCache({});
});

document.getElementById('btn-enable-strict').addEventListener('click', async () => {
  const password = document.getElementById('strict-password').value;
  if (!password) {
    showStatus('strict-status', 'Enter a password first.', 'error');
    return;
  }
  const hash = await hashPassword(password);
  await chrome.storage.local.set({ strictMode: true, strictHash: hash });
  document.getElementById('strict-password').value = '';
  applyStrictMode(true);
});

document.getElementById('btn-disable-strict').addEventListener('click', async () => {
  const password = document.getElementById('strict-unlock-password').value;
  if (!password) {
    showStatus('strict-unlock-status', 'Enter your password.', 'error');
    return;
  }
  const data = await chrome.storage.local.get('strictHash');
  const hash = await hashPassword(password);
  if (hash !== data.strictHash) {
    showStatus('strict-unlock-status', 'Wrong password.', 'error');
    return;
  }
  await chrome.storage.local.remove(['strictMode', 'strictHash']);
  document.getElementById('strict-unlock-password').value = '';
  applyStrictMode(false);
  showStatus('strict-status', '', '');
});

load();
