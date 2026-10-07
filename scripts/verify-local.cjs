// Optional integration acceptance against the real local task API.
// Requires Playwright on NODE_PATH and a running local server on port 8001.
// Create/cancel happens in Node; the page only ever receives an admin token.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..', '..');
const tokenPath = process.env.API_TOKENS_FILE || path.join(root, '.local', 'task-tokens.json');
const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8').replace(/^\uFEFF/, ''));
const api = process.env.TASK_API_URL || 'http://127.0.0.1:8010';
const ui = process.env.ADMIN_URL || 'http://127.0.0.1:8001';
const evidence = process.env.EVIDENCE_DIR || path.join(root, '.local');
async function request(method, route, role, body) {
  return fetch(api + route, { method, headers: { Authorization: `Bearer ${tokens[role]}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
(async () => {
  let browser;
  let run;
  try {
    const created = await request('POST', '/api/runs', 'owner', { prompt: 'Admin 接口联调：验证只读任务列表与事件（仅排队后取消，未调用模型）' });
    assert.equal(created.status, 201, 'A free task queue is required; stop workers before this test.');
    run = await created.json();
    const cancelled = await request('POST', `/api/runs/${run.id}/cancel`, 'owner', {});
    assert.equal(cancelled.status, 200);
    assert.equal((await cancelled.json()).status, 'cancelled');
    assert.equal((await request('POST', `/api/runs/${run.id}/approve`, 'admin', { approved: true })).status, 403);
    assert.equal((await fetch(ui + '/task-api/api/runs', { method: 'POST', body: '{}' })).status, 405);
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(ui + '/local-runs.html');
    await page.getByRole('button', { name: '连接设置' }).click();
    await page.getByLabel('API 地址', { exact: true }).fill('/task-api');
    await page.getByLabel('Admin 只读令牌', { exact: true }).fill(tokens.admin);
    await page.getByRole('button', { name: '保存并连接' }).click();
    await page.waitForFunction(() => document.querySelector('#connection-status').textContent.includes('已连接'));
    await page.getByLabel('搜索任务', { exact: true }).fill(run.id);
    await page.getByRole('button', { name: /Admin 接口联调/ }).click();
    await page.getByRole('tab', { name: /^事件/ }).click();
    await page.getByText('排队任务已取消', { exact: true }).waitFor();
    assert.equal(await page.locator('.event').count(), 2);
    await page.getByRole('tab', { name: '资源绑定' }).click();
    await page.getByText('当前任务尚未绑定资源。', { exact: true }).waitFor();
    await page.getByRole('tab', { name: '异常', exact: true }).click();
    await page.getByText('该任务尚未记录异常。', { exact: true }).waitFor();
    await page.getByRole('tab', { name: /^事件/ }).click();
    await page.getByLabel('搜索任务', { exact: true }).fill('');
    await page.screenshot({ path: path.join(evidence, 'admin-monitor-verified.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'Mobile view should not overflow horizontally');
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.equal(await page.getByRole('button', { name: /批准|同意|提交任务/ }).count(), 0);
    assert.deepEqual(pageErrors, []);
    const authPage = await context.newPage();
    await authPage.goto(ui + '/#/task-monitor');
    await authPage.waitForURL(/#\/login/);
    await page.getByRole('button', { name: '连接设置' }).click();
    await page.getByRole('button', { name: '清除连接' }).click();
    assert.equal(await page.evaluate(() => sessionStorage.getItem('raiot.admin.token')), null);
    fs.writeFileSync(path.join(evidence, 'admin-monitor-verification.json'), JSON.stringify({ ok: true, run_id: run.id, mode: 'real-api-queue-cancel-only-no-model', checks: ['admin-read-only', 'proxy-rejects-post', 'authenticated-list', 'detail-events', 'resource-empty-state', 'error-empty-state', 'mobile-layout', 'vue-route-login-guard', 'disconnect-clears-token'], screenshot: 'admin-monitor-verified.png' }, null, 2));
    console.log('PASS: admin monitor real API and browser acceptance. No cloud/model execution.');
  } finally {
    if (run) await request('POST', `/api/runs/${run.id}/cancel`, 'owner', {}).catch(() => {});
    if (browser) await browser.close();
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
