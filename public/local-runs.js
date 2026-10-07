/* Local read-only operations console. No approval or mutation API is exposed. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const labels = { queued: '排队中', running: '执行中', waiting_approval: '等待确认', completed: '已完成', cancelling: '取消中', cancelled: '已取消', failed: '执行失败' };
  const state = { runs: [], selected: null, detail: null, events: [], tab: 'overview', loading: false, generation: 0, controllers: new Set() };
  const config = { base: localStorage.getItem('raiot.admin.base') || '/task-api', token: sessionStorage.getItem('raiot.admin.token') || '' };
  const element = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined && content !== null) node.textContent = String(content);
    return node;
  };
  const value = (input) => typeof input === 'object' ? JSON.stringify(input, null, 2) : String(input ?? '');
  const time = (input) => {
    if (!input) return '—';
    const date = new Date(input);
    return Number.isNaN(date.valueOf()) ? String(input) : date.toLocaleString('zh-CN', { hour12: false });
  };
  const badge = (status) => element('span', `badge ${Object.hasOwn(labels, status) ? status : ''}`, labels[status] || status || '未知状态');
  const empty = (title, text) => {
    const box = element('div', 'empty');
    box.append(element('span', '', '◎'), element('h3', '', title), element('p', '', text));
    return box;
  };
  function connection(text, status = '') { $('connection-status').textContent = text; $('connection-dot').className = status; }
  function errorMessage(error) { return error.message || '连接失败，请检查任务服务。'; }
  function cancelRequests() {
    state.generation += 1;
    state.controllers.forEach((controller) => controller.abort());
    state.controllers.clear();
    state.loading = false;
    $('refresh').disabled = false;
  }
  async function get(path) {
    const controller = new AbortController();
    state.controllers.add(controller);
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(config.base.replace(/\/$/, '') + path, {
        method: 'GET', headers: { Authorization: `Bearer ${config.token}`, Accept: 'application/json' },
        signal: controller.signal, cache: 'no-store', credentials: 'omit', redirect: 'error'
      });
      if (response.status === 401 || response.status === 403) throw new Error('只读令牌无效或权限不足。请在连接设置中更新 Admin 令牌。');
      if (response.status === 404) throw new Error('任务或接口不存在，请刷新列表并检查 API 地址。');
      if (!response.ok) throw new Error(`任务服务返回 HTTP ${response.status}。`);
      if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('服务返回了网页而非 JSON，请检查 API 地址或代理配置。');
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('请求超时或已取消，请检查任务服务后重试。');
      throw error;
    } finally { clearTimeout(timer); state.controllers.delete(controller); }
  }
  function renderStats() {
    $('stat-total').textContent = state.runs.length;
    $('stat-running').textContent = state.runs.filter((run) => ['queued', 'running', 'cancelling'].includes(run.status)).length;
    $('stat-waiting').textContent = state.runs.filter((run) => run.status === 'waiting_approval').length;
    $('stat-failed').textContent = state.runs.filter((run) => run.status === 'failed').length;
  }
  function renderList() {
    const search = $('search').value.trim().toLowerCase();
    const filter = $('status-filter').value;
    const runs = state.runs.filter((run) => (!filter || run.status === filter) && `${run.id} ${run.prompt || ''}`.toLowerCase().includes(search));
    $('visible-count').textContent = `${runs.length} 条`;
    const list = $('runs-list'); list.replaceChildren();
    if (!runs.length) { list.append(empty(state.runs.length ? '没有匹配的任务' : '暂无任务', state.runs.length ? '试试其他关键词或状态。' : '在 App 发起任务后，执行记录会出现在这里。')); return; }
    runs.forEach((run) => {
      const card = element('button', `run-card${state.selected === run.id ? ' selected' : ''}`);
      card.type = 'button'; card.setAttribute('aria-pressed', state.selected === run.id ? 'true' : 'false');
      const top = element('div', 'run-card-top'); top.append(badge(run.status), element('span', 'run-id', run.id));
      card.append(top, element('div', 'run-prompt', run.prompt || '未命名任务'), element('div', 'run-meta', time(run.created_at)));
      card.addEventListener('click', () => select(run.id)); list.append(card);
    });
  }
  function showJson(parent, content, label = '查看原始数据') {
    if (content === undefined || content === null) return;
    const details = element('details'); details.append(element('summary', '', label), element('pre', '', value(content))); parent.append(details);
  }
  function renderDetail() {
    const root = $('detail-panel'); root.replaceChildren();
    const run = state.detail;
    if (!run) { root.append(empty('选择一个任务', '查看执行过程、资源绑定及异常详情。')); return; }
    const heading = element('div', 'detail-title'); heading.append(element('h2', '', run.prompt || '未命名任务'), badge(run.status));
    root.append(heading, element('p', 'detail-id', run.id));
    const facts = element('dl', 'detail-facts');
    [['创建时间', time(run.created_at)], ['最近更新', time(run.updated_at)], ['任务来源', run.source || run.owner || '—'], ['执行模式', run.execution_mode || run.mode || '—']].forEach(([name, text]) => { const item = element('div'); item.append(element('dt', '', name), element('dd', '', text)); facts.append(item); });
    root.append(facts);
    const tabs = element('div', 'detail-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', '任务详情');
    [['overview', '概览'], ['events', `事件 ${state.events.length}`], ['resources', '资源绑定'], ['errors', '异常']].forEach(([id, title]) => {
      const button = element('button', state.tab === id ? 'active' : '', title); button.type = 'button'; button.setAttribute('role', 'tab'); button.setAttribute('aria-selected', state.tab === id ? 'true' : 'false');
      button.addEventListener('click', () => { state.tab = id; renderDetail(); }); tabs.append(button);
    });
    root.append(tabs);
    const content = element('div', 'tab-content'); content.setAttribute('role', 'tabpanel'); root.append(content);
    if (state.tab === 'overview') {
      if (run.status === 'waiting_approval') content.append(element('div', 'notice', '任务正在等待用户确认。请由任务发起人在 App 中查看并批准；管理端不代替用户授权。'));
      content.append(element('h3', '', '执行结果'), element('div', 'result-text', run.result ? value(run.result) : '暂未产生执行结果。'));
      if (run.approval) showJson(content, run.approval, '查看待确认信息（只读）');
    } else if (state.tab === 'events') {
      if (!state.events.length) content.append(element('p', 'muted', '暂无执行事件。'));
      state.events.forEach((event) => {
        const box = element('article', 'event'); const top = element('div'); top.append(element('span', 'event-type', event.type || 'event'), element('time', '', time(event.timestamp)));
        box.append(top, element('div', 'event-message', event.message || '')); if (event.data && Object.keys(event.data).length) showJson(box, event.data); content.append(box);
      });
    } else if (state.tab === 'resources') {
      const resources = Array.isArray(run.resources) ? run.resources : Object.entries(run.resources || {}).map(([type, resource]) => typeof resource === 'object' && resource ? { type, ...resource } : { type, id: resource });
      if (!resources.length) content.append(element('p', 'muted', '当前任务尚未绑定资源。'));
      resources.forEach((resource) => {
        const box = element('article', 'resource'); const top = element('div', 'resource-top'); top.append(element('strong', '', resource.name || resource.type || '资源'), element('span', 'muted', resource.status || ''));
        box.append(top, element('div', 'muted', resource.id || resource.resource_id || ''));
        // Session/takeover URLs can grant control; this observer does not open them.
        if (resource.url) box.append(element('p', 'muted', '该资源包含访问地址；请从任务发起端访问。'));
        content.append(box);
      });
    } else {
      if (run.error) { content.append(element('div', 'error-banner', typeof run.error === 'string' ? run.error : run.error.message || run.error.code || '任务执行异常')); showJson(content, run.error, '查看异常详情'); }
      else content.append(element('p', 'muted', '该任务尚未记录异常。'));
      const events = state.events.filter((event) => event.level === 'error' || /error|failed/i.test(event.type));
      events.forEach((event) => content.append(element('pre', '', `${time(event.timestamp)} ${event.type}\n${event.message || ''}`)));
    }
  }
  async function select(id, preserveTab = false) {
    state.selected = id; if (!preserveTab) state.tab = 'overview'; renderList();
    const generation = state.generation;
    const selected = id;
    try {
      const [run, events] = await Promise.all([get(`/api/runs/${encodeURIComponent(id)}`), get(`/api/runs/${encodeURIComponent(id)}/events`)]);
      if (generation !== state.generation || state.selected !== selected) return;
      const detail = run.run || run;
      if (!detail || String(detail.id) !== String(id) || !Array.isArray(events.events)) throw new Error('任务详情响应格式不正确。');
      state.detail = detail; state.events = events.events; renderDetail();
    } catch (error) {
      if (generation !== state.generation || state.selected !== selected) return;
      state.detail = null; state.events = [];
      $('detail-panel').replaceChildren(empty('无法加载任务详情', errorMessage(error)));
      const retry = element('button', 'secondary', '重试详情'); retry.addEventListener('click', () => select(id, true)); $('detail-panel').append(retry);
    }
  }
  async function refresh() {
    if (!config.token || state.loading) return;
    state.loading = true; $('refresh').disabled = true;
    const generation = state.generation;
    try {
      const payload = await get('/api/runs');
      if (generation !== state.generation) return;
      if (!Array.isArray(payload.runs)) throw new Error('任务列表响应格式不正确（缺少 runs 数组）。');
      state.runs = payload.runs;
      $('page-error').hidden = true; connection('任务服务已连接 · 只读访问', 'connected'); $('last-sync').textContent = `同步于 ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`;
      renderStats(); renderList();
      if (state.selected && state.runs.some((run) => run.id === state.selected)) await select(state.selected, true);
      else { state.selected = null; state.detail = null; state.events = []; renderDetail(); }
    } catch (error) {
      if (generation !== state.generation) return;
      connection('连接异常 · 显示上次同步结果', 'failed'); $('page-error').hidden = false; $('page-error').textContent = errorMessage(error);
    } finally { if (generation === state.generation) { state.loading = false; $('refresh').disabled = false; } }
  }
  function openSettings() { $('api-base').value = config.base; $('api-token').value = config.token; $('settings-error').textContent = ''; $('settings-dialog').showModal(); }
  $('settings-open').addEventListener('click', openSettings);
  $('settings-close').addEventListener('click', () => $('settings-dialog').close());
  $('settings-form').addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const input = $('api-base').value.trim().replace(/\/$/, ''); const parsed = new URL(input, location.href);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error('请填写 http(s) 地址或同源路径，不要包含用户名、查询参数或片段。');
      if (location.protocol === 'https:' && parsed.protocol === 'http:') throw new Error('HTTPS 页面无法连接 HTTP API，请使用同源代理或 HTTPS 服务。');
      const token = $('api-token').value.trim(); if (!token) throw new Error('请填写 Admin 只读令牌。');
      cancelRequests(); state.runs = []; state.selected = null; state.detail = null; state.events = [];
      config.base = input.startsWith('/') && !input.startsWith('//') ? input : parsed.href.replace(/\/$/, ''); config.token = token;
      localStorage.setItem('raiot.admin.base', config.base); sessionStorage.setItem('raiot.admin.token', token);
      renderStats(); renderList(); renderDetail(); $('settings-dialog').close(); refresh();
    } catch (error) { $('settings-error').textContent = errorMessage(error); }
  });
  $('disconnect').addEventListener('click', () => {
    cancelRequests(); sessionStorage.removeItem('raiot.admin.token'); localStorage.removeItem('raiot.admin.base'); config.token = ''; config.base = '/task-api';
    state.runs = []; state.selected = null; state.detail = null; state.events = []; renderStats(); renderDetail();
    $('runs-list').replaceChildren(empty('连接后查看任务', '在连接设置中填写任务服务地址与只读令牌。'));
    connection('未连接任务服务'); $('last-sync').textContent = '尚未同步'; $('page-error').hidden = true; $('settings-dialog').close();
  });
  $('search').addEventListener('input', renderList); $('status-filter').addEventListener('change', renderList); $('refresh').addEventListener('click', refresh);
  setInterval(() => { if ($('auto-refresh').checked && !document.hidden && !$('settings-dialog').open) refresh(); }, 10000);
  if (config.token) refresh();
})();
