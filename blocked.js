const params = new URLSearchParams(window.location.search);
const targetUrl = params.get('url');

let domain = '';
try {
  domain = new URL(targetUrl).hostname;
} catch {
  // ignore
}

document.getElementById('domain-label').textContent = domain || targetUrl;

document.getElementById('btn-go-back').addEventListener('click', () => {
  history.back();
});
