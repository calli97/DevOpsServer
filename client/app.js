// ── Persistence ──────────────────────────────────────────────
const LS_APIKEY  = 'devops_apikey';
const LS_BASEURL = 'devops_baseurl';

function getApiKey()  { return document.getElementById('apiKeyInput').value; }
function getBaseUrl() { return document.getElementById('baseUrlInput').value.replace(/\/$/, ''); }

function initTopBar() {
  const apiKeyInput  = document.getElementById('apiKeyInput');
  const baseUrlInput = document.getElementById('baseUrlInput');

  apiKeyInput.value  = localStorage.getItem(LS_APIKEY)  || '';
  baseUrlInput.value = localStorage.getItem(LS_BASEURL) || 'http://localhost:3040';

  apiKeyInput.addEventListener('input',  () => localStorage.setItem(LS_APIKEY,  apiKeyInput.value));
  baseUrlInput.addEventListener('input', () => localStorage.setItem(LS_BASEURL, baseUrlInput.value));

  document.getElementById('toggleApiKey').addEventListener('click', () => {
    const t = apiKeyInput.type === 'password' ? 'text' : 'password';
    apiKeyInput.type = t;
    document.getElementById('toggleApiKey').textContent = t === 'password' ? '👁' : '🙈';
  });
}

// ── API Client ────────────────────────────────────────────────
async function apiRequest(method, path, body = null) {
  const url = getBaseUrl() + path;
  const headers = { 'Content-Type': 'application/json', 'x-api-key': getApiKey() };
  const options = { method, headers };
  if (body !== null) options.body = JSON.stringify(body);

  const t0 = Date.now();
  try {
    const res  = await fetch(url, options);
    const data = await res.json().catch(() => ({ raw: 'Non-JSON response' }));
    return { status: res.status, data, ms: Date.now() - t0 };
  } catch (err) {
    return { status: 0, data: { error: err.message }, ms: Date.now() - t0 };
  }
}

// ── Response render ───────────────────────────────────────────
function highlightJson(obj) {
  const raw = JSON.stringify(obj, null, 2);
  return raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g, (m) => {
      if (/^"/.test(m)) return /:$/.test(m) ? `<span class="jk">${m}</span>` : `<span class="js">${m}</span>`;
      if (/true|false|null/.test(m)) return `<span class="jb">${m}</span>`;
      return `<span class="jn">${m}</span>`;
    });
}

function showResponse(wrap, status, data, ms) {
  wrap.classList.add('visible');
  const isOk = status >= 200 && status < 300;
  wrap.querySelector('.status-badge').textContent = status || 'ERR';
  wrap.querySelector('.status-badge').className   = `status-badge ${isOk ? 'ok' : 'fail'}`;
  wrap.querySelector('.response-time').textContent = `${ms}ms`;
  wrap.querySelector('.response-body').innerHTML   = highlightJson(data);
}

// ── Tab navigation ────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

// ── Card toggle ───────────────────────────────────────────────
function initCards() {
  document.querySelectorAll('.card-header').forEach(h => {
    h.addEventListener('click', () => h.closest('.card').classList.toggle('open'));
  });
}

// ── Form helpers ──────────────────────────────────────────────
function val(id) { return document.getElementById(id)?.value?.trim() || ''; }
function num(id) { const v = val(id); return v ? Number(v) : undefined; }
function chk(id) { return document.getElementById(id)?.checked; }

function parseJson(id) {
  const v = val(id);
  if (!v) return undefined;
  try { return JSON.parse(v); }
  catch { alert(`Invalid JSON in field: ${id}`); throw new Error('bad json'); }
}

function bodyOf(fields) {
  const body = {};
  for (const [k, id, type] of fields) {
    if (type === 'number')  { const v = num(id);       if (v !== undefined) body[k] = v; }
    else if (type === 'bool')   { body[k] = chk(id); }
    else if (type === 'json')   { const v = parseJson(id); if (v !== undefined) body[k] = v; }
    else                        { const v = val(id);   if (v !== '')        body[k] = v; }
  }
  return body;
}

function pathOf(tpl, fields) {
  let p = tpl;
  for (const [k, id] of fields) {
    if (p.includes(':' + k)) p = p.replace(':' + k, val(id));
  }
  return p;
}

// ── Send wrappers ─────────────────────────────────────────────
async function send(method, pathTpl, pathFields, bodyFields, wrapId) {
  const wrap = document.getElementById(wrapId);
  const btn  = wrap.previousElementSibling;
  btn.disabled = true;
  btn.textContent = 'Sending…';

  try {
    const path = pathOf(pathTpl, pathFields);
    const body = bodyFields ? bodyOf(bodyFields) : null;
    const { status, data, ms } = await apiRequest(method, path, body);
    showResponse(wrap, status, data, ms);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send';
  }
}

// ════════════════════════════════════════════════════════════════
// PROJECTS
// ════════════════════════════════════════════════════════════════
function projectsHandlers() {

  // LIST ALL
  document.getElementById('p-list-send').onclick = async () => {
    const { status, data, ms } = await apiRequest('GET', '/projects');
    showResponse(document.getElementById('p-list-res'), status, data, ms);
  };

  // GET BY ID
  document.getElementById('p-get-send').onclick = () =>
    send('GET', '/projects/:id', [['id','p-get-id']], null, 'p-get-res');

  // CREATE
  document.getElementById('p-create-send').onclick = () =>
    send('POST', '/projects', [], [
      ['name',                'p-c-name'],
      ['path',                'p-c-path'],
      ['repository',          'p-c-repo'],
      ['branch',              'p-c-branch'],
      ['cloneLine',           'p-c-clone'],
      ['afterDeployCommands', 'p-c-after'],
      ['active',              'p-c-active',  'bool'],
      ['autoUpdate',          'p-c-auto',    'bool'],
      ['slaveServer',         'p-c-slave',   'json'],
      ['configFiles',         'p-c-configs', 'json'],
      ['deploys',             'p-c-deploys', 'json'],
    ], 'p-create-res');

  // UPDATE
  document.getElementById('p-update-send').onclick = () =>
    send('PUT', '/projects/:id', [['id','p-u-id']], [
      ['name',                'p-u-name'],
      ['path',                'p-u-path'],
      ['repository',          'p-u-repo'],
      ['branch',              'p-u-branch'],
      ['cloneLine',           'p-u-clone'],
      ['afterDeployCommands', 'p-u-after'],
      ['active',              'p-u-active',  'bool'],
      ['autoUpdate',          'p-u-auto',    'bool'],
      ['slaveServer',         'p-u-slave',   'json'],
    ], 'p-update-res');

  // DELETE
  document.getElementById('p-delete-send').onclick = () =>
    send('DELETE', '/projects/:id', [['id','p-d-id']], null, 'p-delete-res');

  // START
  document.getElementById('p-start-send').onclick = () =>
    send('POST', '/projects/:id/start', [['id','p-start-id']], null, 'p-start-res');

  // RESTART
  document.getElementById('p-restart-send').onclick = () =>
    send('POST', '/projects/:id/restart', [['id','p-restart-id']], null, 'p-restart-res');
}

// ════════════════════════════════════════════════════════════════
// DEPLOYS
// ════════════════════════════════════════════════════════════════
function deploysHandlers() {

  document.getElementById('d-list-send').onclick = async () => {
    const { status, data, ms } = await apiRequest('GET', '/deploys');
    showResponse(document.getElementById('d-list-res'), status, data, ms);
  };

  document.getElementById('d-get-send').onclick = () =>
    send('GET', '/deploys/:id', [['id','d-get-id']], null, 'd-get-res');

  document.getElementById('d-create-send').onclick = () =>
    send('POST', '/deploys', [], [
      ['name',          'd-c-name'],
      ['startPath',     'd-c-startPath'],
      ['buildCommands', 'd-c-build'],
      ['startCommands', 'd-c-start'],
      ['projectId',     'd-c-projectId', 'number'],
    ], 'd-create-res');

  document.getElementById('d-update-send').onclick = () =>
    send('PUT', '/deploys/:id', [['id','d-u-id']], [
      ['name',          'd-u-name'],
      ['startPath',     'd-u-startPath'],
      ['buildCommands', 'd-u-build'],
      ['startCommands', 'd-u-start'],
    ], 'd-update-res');

  document.getElementById('d-delete-send').onclick = () =>
    send('DELETE', '/deploys/:id', [['id','d-d-id']], null, 'd-delete-res');
}

// ════════════════════════════════════════════════════════════════
// CONFIG FILES
// ════════════════════════════════════════════════════════════════
function configFilesHandlers() {

  document.getElementById('cf-list-send').onclick = async () => {
    const { status, data, ms } = await apiRequest('GET', '/config-files');
    showResponse(document.getElementById('cf-list-res'), status, data, ms);
  };

  document.getElementById('cf-get-send').onclick = () =>
    send('GET', '/config-files/:id', [['id','cf-get-id']], null, 'cf-get-res');

  document.getElementById('cf-create-send').onclick = () =>
    send('POST', '/config-files', [], [
      ['name',         'cf-c-name'],
      ['relativePath', 'cf-c-path'],
      ['content',      'cf-c-content'],
      ['projectId',    'cf-c-projectId', 'number'],
    ], 'cf-create-res');

  document.getElementById('cf-update-send').onclick = () =>
    send('PUT', '/config-files/:id', [['id','cf-u-id']], [
      ['name',         'cf-u-name'],
      ['relativePath', 'cf-u-path'],
      ['content',      'cf-u-content'],
    ], 'cf-update-res');

  document.getElementById('cf-delete-send').onclick = () =>
    send('DELETE', '/config-files/:id', [['id','cf-d-id']], null, 'cf-delete-res');
}

// ════════════════════════════════════════════════════════════════
// SLAVE SERVERS
// ════════════════════════════════════════════════════════════════
function slaveServersHandlers() {

  document.getElementById('ss-list-send').onclick = async () => {
    const { status, data, ms } = await apiRequest('GET', '/slave-servers');
    showResponse(document.getElementById('ss-list-res'), status, data, ms);
  };

  document.getElementById('ss-get-send').onclick = () =>
    send('GET', '/slave-servers/:id', [['id','ss-get-id']], null, 'ss-get-res');

  document.getElementById('ss-create-send').onclick = () =>
    send('POST', '/slave-servers', [], [
      ['nombre',      'ss-c-nombre'],
      ['direccionIp', 'ss-c-ip'],
      ['puerto',      'ss-c-puerto', 'number'],
      ['apiKey',      'ss-c-apikey'],
    ], 'ss-create-res');

  document.getElementById('ss-update-send').onclick = () =>
    send('PUT', '/slave-servers/:id', [['id','ss-u-id']], [
      ['nombre',      'ss-u-nombre'],
      ['direccionIp', 'ss-u-ip'],
      ['puerto',      'ss-u-puerto', 'number'],
      ['apiKey',      'ss-u-apikey'],
    ], 'ss-update-res');

  document.getElementById('ss-delete-send').onclick = () =>
    send('DELETE', '/slave-servers/:id', [['id','ss-d-id']], null, 'ss-delete-res');
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTopBar();
  initTabs();
  initCards();
  projectsHandlers();
  deploysHandlers();
  configFilesHandlers();
  slaveServersHandlers();
});
