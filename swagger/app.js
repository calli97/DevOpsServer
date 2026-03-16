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

function bodyOf(fields) {
  const body = {};
  for (const [k, id, type] of fields) {
    if (type === 'number')  { const v = num(id);  if (v !== undefined) body[k] = v; }
    else if (type === 'bool')   { body[k] = chk(id); }
    else                        { const v = val(id); if (v !== '')        body[k] = v; }
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
// STATUS
// ════════════════════════════════════════════════════════════════
function statusHandlers() {
  document.getElementById('status-send').onclick = async () => {
    const { status, data, ms } = await apiRequest('GET', '/status');
    showResponse(document.getElementById('status-res'), status, data, ms);
  };
}

// ════════════════════════════════════════════════════════════════
// PROJECTS
// ════════════════════════════════════════════════════════════════
function projectsHandlers() {

  document.getElementById('p-list-send').onclick = async () => {
    const { status, data, ms } = await apiRequest('GET', '/projects');
    showResponse(document.getElementById('p-list-res'), status, data, ms);
  };

  document.getElementById('p-get-send').onclick = () =>
    send('GET', '/projects/:id', [['id','p-get-id']], null, 'p-get-res');

  document.getElementById('p-create-send').onclick = () =>
    send('POST', '/projects', [], [
      ['name',      'p-c-name'],
      ['repository','p-c-repo'],
      ['cloneLine', 'p-c-clone'],
    ], 'p-create-res');

  document.getElementById('p-update-send').onclick = () =>
    send('PUT', '/projects/:id', [['id','p-u-id']], [
      ['name',      'p-u-name'],
      ['repository','p-u-repo'],
      ['cloneLine', 'p-u-clone'],
    ], 'p-update-res');

  document.getElementById('p-delete-send').onclick = () =>
    send('DELETE', '/projects/:id', [['id','p-d-id']], null, 'p-delete-res');
}

// ════════════════════════════════════════════════════════════════
// PROJECT INSTANCES
// ════════════════════════════════════════════════════════════════
function projectInstancesHandlers() {

  document.getElementById('pi-list-send').onclick = async () => {
    const { status, data, ms } = await apiRequest('GET', '/project-instances');
    showResponse(document.getElementById('pi-list-res'), status, data, ms);
  };

  document.getElementById('pi-get-send').onclick = () =>
    send('GET', '/project-instances/:id', [['id','pi-get-id']], null, 'pi-get-res');

  document.getElementById('pi-create-send').onclick = () =>
    send('POST', '/project-instances', [], [
      ['name',                'pi-c-name'],
      ['projectId',           'pi-c-projectId',    'number'],
      ['branch',              'pi-c-branch'],
      ['path',                'pi-c-path'],
      ['slaveServerId',       'pi-c-slaveServerId','number'],
      ['afterDeployCommands', 'pi-c-after'],
      ['autoUpdate',          'pi-c-auto',         'bool'],
    ], 'pi-create-res');

  document.getElementById('pi-update-send').onclick = () =>
    send('PUT', '/project-instances/:id', [['id','pi-u-id']], [
      ['name',                'pi-u-name'],
      ['branch',              'pi-u-branch'],
      ['path',                'pi-u-path'],
      ['slaveServerId',       'pi-u-slaveServerId','number'],
      ['afterDeployCommands', 'pi-u-after'],
      ['autoUpdate',          'pi-u-auto',         'bool'],
    ], 'pi-update-res');

  document.getElementById('pi-delete-send').onclick = () =>
    send('DELETE', '/project-instances/:id', [['id','pi-d-id']], null, 'pi-delete-res');

  document.getElementById('pi-start-send').onclick = () =>
    send('POST', '/project-instances/:id/start', [['id','pi-start-id']], null, 'pi-start-res');

  document.getElementById('pi-restart-send').onclick = () =>
    send('POST', '/project-instances/:id/restart', [['id','pi-restart-id']], null, 'pi-restart-res');
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
      ['name',              'd-c-name'],
      ['projectInstanceId', 'd-c-instanceId', 'number'],
      ['startPath',         'd-c-startPath'],
      ['startCommands',     'd-c-start'],
      ['buildCommands',     'd-c-build'],
    ], 'd-create-res');

  document.getElementById('d-update-send').onclick = () =>
    send('PUT', '/deploys/:id', [['id','d-u-id']], [
      ['name',          'd-u-name'],
      ['startPath',     'd-u-startPath'],
      ['startCommands', 'd-u-start'],
      ['buildCommands', 'd-u-build'],
    ], 'd-update-res');

  document.getElementById('d-delete-send').onclick = () =>
    send('DELETE', '/deploys/:id', [['id','d-d-id']], null, 'd-delete-res');

  document.getElementById('d-start-send').onclick = () =>
    send('POST', '/deploys/:id/start', [['id','d-start-id']], null, 'd-start-res');

  document.getElementById('d-stop-send').onclick = () =>
    send('POST', '/deploys/:id/stop', [['id','d-stop-id']], null, 'd-stop-res');
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
      ['name',              'cf-c-name'],
      ['projectInstanceId', 'cf-c-instanceId', 'number'],
      ['relativePath',      'cf-c-path'],
      ['content',           'cf-c-content'],
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
  statusHandlers();
  projectsHandlers();
  projectInstancesHandlers();
  deploysHandlers();
  configFilesHandlers();
  slaveServersHandlers();
});
