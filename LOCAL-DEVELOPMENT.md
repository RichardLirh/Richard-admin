# 本地任务监控

`local-runs.html` 是独立只读入口，不依赖 Java 管理端登录；所有任务数据仍需任务 API 的独立 Admin Bearer 令牌。它不提供审批、取消、人工接管或提交接口。原用户和设备管理继续使用原登录流程；新增 `/#/task-monitor` 受同一登录守卫保护。

## Windows

安装 Node 22 LTS 后在本目录执行：

```powershell
npm ci
npm run build
node scripts/serve-local.cjs
```

打开 `http://127.0.0.1:8001/local-runs.html`，点“连接设置”，API 地址保持 `/task-api`，填写主任务服务生成的 **Admin 只读令牌**。令牌仅存当前标签页的 `sessionStorage`，退出请点“清除连接”。不要使用 App owner 令牌，也不要把令牌写入源码或镜像。

脚本监听 `127.0.0.1`，默认反代 `http://127.0.0.1:8010`。可用 `PORT`、`TASK_API_UPSTREAM` 改端口/任务服务。脚本仅用于本地任务监控；要开发原 Java 页面，使用 `npm run dev`（已有 `/richard` 代理到 8002）。

页面支持状态/关键词筛选、任务详情、执行事件、资源绑定、异常详情以及可关闭的自动刷新。资源中的会话控制地址不作为管理端跳转链接。运行失败、鉴权失败、空列表都独立显示，不自动产生模拟任务。

## Docker

```powershell
docker build -t raiot-admin:local .
docker run --rm -p 127.0.0.1:8001:80 --add-host host.docker.internal:host-gateway -e TASK_API_UPSTREAM=host.docker.internal:8010 raiot-admin:local
```

跨容器推荐同一 Compose 网络并使用 `TASK_API_UPSTREAM=task-api:8010`、`JAVA_API_UPSTREAM=backend:8002`。宿主机只监听 127.0.0.1 的服务不一定能被容器访问，需通过根项目 Compose 运行任务 API。默认不把后台公开到局域网。nginx `/task-api/` 只允许 GET/HEAD，令牌由服务端校验。

## API 契约

- `GET /api/runs` → `{ "runs": [{ "id", "prompt", "status", "created_at", "updated_at" }] }`
- `GET /api/runs/{id}` → Run（或 `{ "run": Run }`），可带 `result`、`error`、`resources`、`approval`。
- `GET /api/runs/{id}/events` → `{ "events": [{ "id", "type", "message", "timestamp", "data" }] }`
- 每个请求携带 `Authorization: Bearer <admin-token>`。不把 token 放入 URL。

状态：`queued/running/waiting_approval/completed/cancelling/cancelled/failed`。后台未提供执行来源或执行模式时显示占位；需由任务 API 明确报告模拟/真实执行模式，避免将演示结果误判为真实模型执行。

## 已完成验证

2026-10-07：Node 22.23.3 / npm 10.9.9，`npm ci` 和 `npm run build` 成功。构建保留上游已有的大字体资源与包体积警告。真实本机 API + Chrome 自动化验证了列表、事件、空资源/异常状态、390px 适配、原路由登录保护、断开清除令牌；Admin 审批返回 403，本地静态代理 POST 返回 405。

可选验收脚本：在任务服务和本地监控启动、执行器停止时运行 `node scripts/verify-local.cjs`。需要 Playwright 可被 Node 解析，`API_TOKENS_FILE` 指向根目录 `.local/task-tokens.json`。脚本通过 Node 的 owner 凭据创建并立即取消一个明确标注的接口测试任务，只把 Admin token 传入浏览器，不执行云端或模型任务。报告和截图写入根目录 `.local/`（不提交）。
