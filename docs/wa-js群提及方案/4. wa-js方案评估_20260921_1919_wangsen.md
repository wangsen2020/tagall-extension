# 通过 WPPConnect/wa-js 解决"选不完成员"的方案评估

最后更新：2026-09-21

本文档评估用 [WPPConnect/wa-js](https://github.com/wppconnect-team/wa-js)（注入后暴露全局 `WPP`）替代当前 DOM 候选菜单方案的可行性，并给出三条备选路线与推荐结论。

本文档只做方案评估，不代表已经决定采用。

## 一、要解决的问题

当前实现把"提及某人"等同于"在候选菜单里点中某一项"。浏览器实测（测试群 `WADesk外贸沟通群-3`，117 人）暴露三个结构性问题：

1. **候选菜单是虚拟列表。** `visibleMentionOptions()` 只能看到已渲染的 DOM 行。大群里输入 `@` 后绝大多数成员不在 DOM 中，不滚动就查不到。
2. **纯手机号成员不一定有候选项。** WhatsApp 的提及索引依赖通讯录名或 pushname。对方不在通讯录且未设昵称时，菜单可能不返回该成员，`mentionQueries()` 的四种号码变体全部落空。
3. **速度不可用。** 实测约 40 秒/成员，117 人约 80 分钟，全程按钮禁用。瓶颈在 `selectMention()` 每个查询变体最多 8×100ms 轮询乘以手机号的 4 种变体，不是 `delayMs`。

关键认知：**提及的真相在协议层，不在 DOM 层。** 一条消息的提及由 `mentionedJidList` 决定，正文存的是 `@8618565634082` 这样的裸号，显示名由客户端渲染。在编辑器里点候选项，本质是让 WhatsApp 替你填这个列表。只要能直接控制这个列表，"选人"这一步就不存在了。

## 二、方案 A：完整引入 wa-js，走发送 API

### 核心代码

```js
await WPP.loader.onReady();

const chat = await WPP.chat.getActiveChat();
const gid = chat.id;

// 权威成员名单，直接来自 WhatsApp 内部 store，无需匹配
const jids = (await WPP.group.getParticipants(gid)).map((p) => p.id.toString());

const text = jids.map((j) => '@' + j.split('@')[0]).join(' ');

await WPP.chat.sendTextMessage(gid, text, { mentionedList: jids });
```

`SendMessageOptions` 中与本场景相关的字段：

- `mentionedList` — 显式指定提及列表；
- `detectMentioned` — 自动识别正文里的 `@[number]` 并补进提及列表；
- `delay` — 发送前停顿并显示"正在输入"。

### 能力边界（已核对文档）

- 覆盖率 100%，耗时亚秒级。没有模糊匹配、没有轮询、没有虚拟列表问题。
- **wa-js 没有"带提及的草稿"。** `WPP.chat.setInputText(text, chatId)` 只接受纯字符串，签名里没有 `mentionedList`，内部走 `setComposeContents()` / `ComposeBoxActions.setTextContent()`，只能写纯文本。
- 带提及的路径只有 `sendTextMessage` / `sendRawMessage`，即**直接发出去**。`prepareRawMessage` 虽然只准备不发送，但它在文档中标记为 internal，且必须配 `sendRawMessage` 才有意义。

### 这对产品意味着什么

TagAll 当前的核心承诺是：**绝不自动发送，用户在 WhatsApp 原生输入框里检查后自己按发送。** 方案 A 无法保留这条承诺，最多退化成"TagAll 自己弹确认框，用户点确认后由扩展发送"。

这不是措辞差别。前者是输入辅助工具，后者是自动化群发客户端，在 Chrome Web Store 审核和 WhatsApp 风控上是两个完全不同的类别。

### 风险清单

| 风险 | 说明 |
| --- | --- |
| 产品定位 | 从"输入辅助"变为"自动发送"，README、隐私政策、商店文案全部需要重写 |
| CWS 审核 | 自动化第三方网站发消息的扩展审核风险显著更高；wa-js 压缩包体积大、代码经过混淆，容易被判定为可疑 |
| 远程代码 | wa-js 必须本地打包进扩展，绝不能运行时从 CDN 拉取（CWS 红线） |
| 账号封禁 | 对大群反复 `@all` 正是 WhatsApp 风控最敏感的模式，被封的是**最终用户自己**的号 |
| 版本脆弱 | wa-js hook 的是 WhatsApp webpack 内部模块，上游一变就是全量失效，而非局部降级 |
| 注入复杂度 | 需要 MV3 `world: "MAIN"` 注入（Chrome 111+），并配置 `web_accessible_resources` |

### 注入方式：必须遵守的时序

**这是最容易出错的地方。** 直接用 `content_scripts` + `world: "MAIN"` 把 wa-js 塞进页面会报错，因为 WhatsApp 的 webpack 运行时尚未就绪，wa-js 挂不上钩子。

参考实现：`E:\WebstormProjects\wd-export-contact\src`（该项目已在 CWS 上线，注入逻辑经过生产验证）。以下时序直接取自它的 `inject-script/initFrame.js` 与 `utils/inject-func.js`。

#### 三段式注入，而不是一次性注入

```
content-script.js  (ISOLATED, run_at: document_end)
      │
      │ ① 立刻注入探针（小文件，无副作用）
      ▼
initFrame.js  (MAIN world, 通过 <script src=chrome.runtime.getURL(...)> 注入)
      │
      │ ② 轮询检测，条件全部满足后 postMessage 请求注入
      ▼
content-script.js 收到 'to-inject-wa-js' → 注入 wa-js.js (MAIN world)
      │
      │ ③ 等 WPP.isReady 后才注入业务脚本
      ▼
业务脚本 (MAIN world)
```

注意脚本是用 `document.createElement('script')` + `chrome.runtime.getURL()` 动态注入的，不是 manifest 的 `world: "MAIN"`。manifest 里只需要声明 `web_accessible_resources`：

```json
{
  "content_scripts": [
    { "matches": ["https://web.whatsapp.com/*"], "js": ["content-script.js"], "run_at": "document_end" }
  ],
  "web_accessible_resources": [
    { "resources": ["inject-script/*.js", "inject/*.js"], "matches": ["https://web.whatsapp.com/*"] }
  ]
}
```

#### 注入 wa-js 前必须同时满足的四个条件

来自 `canStartInjection()`。**任何一条不满足就继续等，不要注入**：

1. `document.readyState === 'complete'`
2. WhatsApp 外壳已挂载 —— `div#app` / `div.two` / `div#pane-side` / `div[data-testid="link-device-qr-code"]` 任一存在
3. 模块运行时就绪 —— `typeof window.require === 'function' && typeof window.__d === 'function'`（meta 运行时），**或** `window.webpackChunkwhatsapp_web_client` 是非空数组且累计 `moduleCount > 0`
4. 上述条件**连续 2 次检查**都成立（`REQUIRED_STABLE_CHECKS = 2`，间隔 500ms）

第 4 条是防抖：WhatsApp 加载过程中 webpack chunk 数组会短暂出现又被重建，只看一次快照会误判。

#### 轮询节奏

```js
const CHECK_INTERVAL = 500        // 正常轮询
const SLOW_CHECK_INTERVAL = 2000  // 超过软超时后降频
const IDLE_CHECK_INTERVAL = 5000  // full_ready 且无 pending 时的空闲节奏
const SOFT_TIMEOUT = 30000        // 30s 后进入 slow 阶段，上报但不放弃
```

脚本标签加载本身另设 15s 超时，超时后 `script.remove()` 并 reject，区分 `script_load_timeout` 与 `script_load_failed` 两种 reason 上报。

#### ready 不等于可用

wa-js 脚本 `onload` 只代表文件加载完，**不代表能调 API**。还要分两级等待：

- `WPP.isReady` —— 基础能力可用，进入 `ready` 阶段；
- `WPP.isFullReady` —— 重活（历史消息、媒体下载）才可用，进入 `full_ready` 阶段。

参考实现用 pending → active 的提升模型：新加载的 runtime 先进 `registry.pending`，`isReady` 后才 `promotePendingWaJs()` 提升为 `active`。

#### 调 API 前先探测能力，不要直接调

```js
function getCapabilities(runtime) {
  return {
    groupParticipants: typeof runtime?.group?.getParticipants === 'function',
    chatList: typeof runtime?.chat?.list === 'function',
    sendText: typeof runtime?.chat?.sendTextMessage === 'function'
  }
}
```

上游改名或删函数时，这样会得到一个明确的 `missing_capability`，而不是运行时崩溃。

#### generation：防止拿到旧 runtime 的数据

每次 runtime 变化（重新注入、账号切换）`registry.generation += 1`。所有跨 `postMessage` 的请求都带上 generation，响应回来先比对：

```js
if (Number(response.generation) !== generation) {
  // runtime 已经换代，重试一次；再不一致就报 runtime_changed
}
```

参考实现还在 `assertRuntimeContext()` 里二次校验 `runtime.conn.getMyUserId()` 是否变化，防止用户中途切换 WhatsApp 账号后，把 A 账号的数据当成 B 账号的。**对 TagAll 尤其重要：切换账号后群成员名单必须作废重取。**

#### 单例与注入权抢占

页面可能有多个 content script 实例（扩展重载、多帧）。参考实现用一个不可写的全局注册表加租约机制：

```js
Object.defineProperty(window, '__WD_WAJS_RUNTIME__', {
  value: registry, enumerable: false, configurable: false, writable: false
})
```

- `ownerToken` + 10s 租约 + 2s 心跳续租，抢到才注入；
- 20s 拿不到就 `ownerDisabled`，放弃抢占改为搭便车；
- `adoptExistingWindowWpp()` 能接管页面上已存在的 `window.WPP`（比如别的扩展注入的），避免重复注入；
- 版本比较 `compareWaJsVersions()`，只有自带版本更高才覆盖已激活的 runtime。

TagAll 如果只用单一版本、不考虑与其他扩展共存，这套可以简化，但**"已存在就不重复注入"这条必须保留**——重复注入 wa-js 会导致 hook 冲突。

#### 状态机阶段（便于排错上报）

```
waiting_page → waiting_runtime → script_loading → waiting_ready
             → ready → waiting_full_ready → full_ready
失败分支：slow（软超时）/ failed（确定性失败，带 reason）
```

失败 reason 至少要区分：`init_frame_load_failed`、`script_load_timeout`、`script_load_failed`、`registry_protocol_mismatch`、`missing_capability`、`runtime_changed`、`not_authenticated`。

> 以上全部来自 `wd-export-contact` 的生产实现，不是推测。TagAll 若采用 wa-js，这段时序应当直接移植而非重写。

## 三、方案 B：只借读 store，不借写（推荐）

拆开看，当前真正缺的只是**权威的成员名单**，不是**发送能力**。这两件事的风险等级相差一个数量级。

### 做法

用 moduleRaid 那类技术 hook `webpackChunkwhatsapp_web_client`，**只做一件事**：读出当前群的参与者 WID 与 pushname。不引入整个 wa-js，不触碰任何发送 API。

拿到名单后仍然走原生输入框，但把匹配质量提上去：

- 用**精确的 pushname 或裸号数字**（无空格、无 `+`）作为查询，把候选菜单收敛到 1 条；
- 选中改用 `ArrowDown` + `Enter`，不要 `.click()`——虚拟列表的行点击经常被事件委托吞掉；
- 每次选中后仍用 `data-app-text-template` 数量增加来校验；
- 用名单预先判断某成员是否可能被索引，不可能的直接进 skip 列表，省掉 4 次查询 × 1.2 秒的空转。

### 收益与代价

- 覆盖率从"随缘"提升到接近名单上限；
- 速度从 40 秒/人降到 1–2 秒/人；
- **"用户自己按发送"这条产品底线完好**，README、隐私政策、商店文案都不用改；
- 仍然依赖 WhatsApp 内部结构，但只读不写，失效时可以安全降级回纯 DOM 方案；
- 剩下 WhatsApp 确实不给索引的成员，给一份可复制的跳过清单让用户手工处理。

## 四、方案 C：不做任何注入，只优化 DOM 策略

保持现有架构，只改 `mentions.js`：

- 候选查询前先滚动候选菜单容器，扩大 `visibleMentionOptions()` 的可见范围；
- 手机号优先用裸数字查询，减少无效变体；
- `.click()` 改为键盘选中；
- 失败快速退出，不跑满 8 次轮询。

这是唯一零新增风险的路线，但**解决不了根因**：WhatsApp 不索引的成员依然选不中，速度改善有限。适合作为方案 B 的降级兜底。

## 五、对比

| | A：完整 wa-js 直发 | B：只借读 store | C：纯 DOM 优化 |
| --- | --- | --- | --- |
| 覆盖率 | 100% | 接近名单上限 | 不变，略有改善 |
| 速度 | 亚秒级 | 1–2 秒/人 | 5–10 秒/人 |
| 保留"用户自己发送" | 否 | 是 | 是 |
| CWS 风险 | 高 | 中 | 低 |
| 封号风险 | 高 | 低 | 低 |
| 上游失效影响 | 全量失效 | 可降级到 C | 无 |
| 工作量 | 大 | 中 | 小 |

## 六、结论与建议

推荐 **方案 B**，以 **方案 C** 作为 hook 失效时的自动降级路径。不推荐方案 A。

理由：WhatsApp 现在已有原生 `@all`，并把它做成了权限门。一个能无视权限、稳定 @ 满 117 人的工具，正是这道门要挡的东西。追求 100% 覆盖的那条路（wa-js 直发）恰好是审核与封号风险最高的一条。TagAll 合理的定位天花板是**中小群 + 诚实的跳过清单**。

## 七、采用前必须回答的问题（已回答，2026-09-21）

1. hook `webpackChunkwhatsapp_web_client` 读取 `GroupMetadata` 的具体模块路径，在当前 WhatsApp Web 版本上是什么？需要实测。
   **回答：实测。** 不凭文档或旧版本经验推断路径，先在当前 WhatsApp Web 版本上跑一次最小可行验证，找到实际可用的模块引用方式。
2. 上游模块结构变化时，如何检测失效并自动降级回方案 C，而不是静默出错？
   **回答：不做自动降级检测，静默出错即可。** 不引入"检测失效 → 切换到方案 C"的自动化逻辑；hook 失效时直接安全失败（不崩溃、不弹错误），方案 C 作为用户可手动触发的兜底，不做自动切换。
3. 读取成员 WID 是否需要更新 `docs/PRIVACY.md`？名单只在本地内存使用、不落盘、不外传，这一点要在隐私文案中写清楚。
   **回答：是的，更新。** 在隐私文案中补充说明：成员名单仅在本地内存中使用，不写入磁盘、不上传、不外发。
4. CWS 的"单一用途"政策下，如何描述这项能力而不触发拒审？参考既往经验：用具体场景讲清问题，不要罗列关键词。
   **回答（场景化描述）：** 在 WhatsApp 群组管理员数量有限、无法逐一授权的情况下，群内多名销售人员也需要一种方式向全体成员统一发送通知——这是这项能力要解决的具体场景，而非泛化的"群发"能力。

## 参考

- [WPPConnect/wa-js 仓库](https://github.com/wppconnect-team/wa-js)
- [wa-js API 文档](https://wppconnect.io/wa-js/)
- [chat.SendMessageOptions](https://wppconnect.io/wa-js/interfaces/chat.SendMessageOptions.html)
- [whatsapp.functions.getParticipants](https://wppconnect.io/wa-js/functions/whatsapp.functions.getParticipants.html)
- [chat.setInputText](https://wppconnect.io/wa-js/functions/chat.setInputText.html)
