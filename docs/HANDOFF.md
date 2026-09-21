# TagAll 研发交接

最后更新：2026-09-21

## 项目目的

TagAll 是一个 WhatsApp Web Chrome 扩展。它的目标不是绕过 WhatsApp 的权限，而是在用户不能使用或没有获得原生 `@all` 权限时，协助用户将当前群成员逐个加入消息输入框的真实提及。

扩展绝不自动发送消息。用户必须自行检查草稿并主动发送。

仓库：<https://github.com/wangsen2020/tagall-extension>

本地目录：`E:\WebstormProject\tagall-extension`

## 已确认的产品事实

- WhatsApp 已提供原生 `@all` 功能，但功能覆盖、群组条件和用户权限存在差异。
- 非管理员的推广人员、社群运营者和组织者，仍有逐个提及群成员的实际需求。
- TagAll 应优先尝试原生 `@all`，只有无法使用时才降级为逐个真实成员提及。
- 不应宣传“解锁 @all”“绕过管理员权限”或自动发送消息。

## 当前代码结构

```text
manifest.json              Chrome Manifest V3 配置
src/content.js             内容脚本入口、消息处理、界面刷新
src/core/config.js         常量和默认设置
src/core/dom.js            WhatsApp Web DOM 定位
src/core/participants.js   群成员文本解析、号码查询变体
src/core/mentions.js       输入、候选选择、提及写入与跳过逻辑
src/core/tag-controller.js 流程状态、取消和 native/individual 分支
src/ui/inline-button.js    WhatsApp 页面内的 @ All 与红色停止按钮
src/popup/                 扩展弹窗
tests/participants.test.js 纯成员解析单元测试
```

## 浏览器实测证据

测试群：`WADesk外贸沟通群-3`。

在 WhatsApp Web 编辑器中：

- 成功的成员提及，例如 `@cody`、`@Echo`，其 DOM 元素含有 `data-app-text-template`。这是判断“真实提及”的可靠信号。
- 失败的号码提及，例如 `@+86 185 6563 4082`，只是普通文本节点，没有 `data-app-text-template`，不会真正通知该成员。
- 草稿中的 `@all` 同样显示为普通文本节点。仅凭它出现在输入框中，不能证明原生 `@all` 已经真实生效；在不发送消息的前提下，尚未找到稳定的前端确认标记。
- 原实现会在第一个未匹配成员处抛错，因此表现为“中途停止”。这是已修复的流程问题。

注意：测试时不应发送消息。只检查编辑器的 DOM 标记、进度状态和失败清理结果。

## 已完成修改

### 真实提及校验

成员不能只靠写入 `@姓名` 或 `@手机号` 文本来认定成功。现在的逻辑优先查找 WhatsApp 的可见候选项；找不到时会回退到当前界面可用的 Tab 选择方式，并通过 `data-app-text-template` 数量增加来校验普通成员提及是否真实生成。

### 号码查询

对电话号码产生四种查询形式：

1. 原始显示格式，例如 `+86 185 6563 4082`
2. E.164 连续格式，例如 `+8618565634082`
3. 去掉 `+` 的连续号码
4. 最后八位号码

这只是候选查询策略，不保证 WhatsApp 一定为每个号码返回候选项。

### 失败跳过，而不是整体停止

自提交 `57592b6` 起：

- 未匹配成员会被记录到 `skipped`；
- 当前失败查询会被移除；
- 任务继续尝试后续成员；
- 弹窗显示成功数和跳过数；
- 内嵌按钮显示 `当前/总数 (跳过数)`。

### 停止按钮

逐人处理时，WhatsApp 输入框附近会显示红色 `■` 停止按钮。

- 点击后不再进入下一个成员；
- 允许当前成员的清理流程完成；
- 已成功加入的真实提及保留在草稿中；
- 不会发送消息。

### 扩展重载错误

重载已解压扩展后，旧内容脚本仍可能短暂存在。之前它访问 `chrome.storage` 会报：

```text
Extension context invalidated
```

`src/content.js` 现已在访问 Chrome API 前检查上下文有效性，并吞掉该预期的重载期异常。

## 当前最大风险与待解决问题

### 1. 原生 @all 的无发送检测不可靠

当前 `tryAppendNativeAll()` 尝试在编辑器中输入 `@all` 并寻找完全匹配的 WhatsApp 候选项。若找不到，它会清理测试文本并降级到逐人提及。

实际测试发现，`@all` 在草稿中可表现为普通文本，即使历史消息中也存在 `@all`。因此不能仅从普通文本判断其是否为原生功能。

下一位开发者应在不发送消息的限制下，探索以下方向：

- 对比原生 `@all` 可用群与不可用群，在输入 `@`、`@a`、`@all` 后的 DOM、ARIA 树和网络请求差异；
- 观察 WhatsApp 的候选菜单是否使用稳定的 `role`、`data-testid` 或可访问名称；
- 如果无法得到可靠的无发送判断，产品界面应明确让用户选择“使用原生 @all”或“逐个提及”，不要伪造自动检测成功。

### 2. 候选菜单 DOM 仍需要浏览器验证

目前候选项选择器依赖 `[role="listbox"]`、`[data-testid*="mention"]` 及通用 option/listitem/button。实际 WhatsApp 版本可能更换 DOM 结构。

推荐做法：

- 用 Browser Skill 打开测试群，但不发送消息；
- 输入一个已知昵称和一个仅显示手机号的成员；
- 记录候选列表的 HTML、ARIA 角色和相关 `data-testid`；
- 将 `visibleMentionOptions()` 缩小为实际稳定选择器，避免误点击页面无关按钮；
- 在每次点击候选后验证 `data-app-text-template` 增加。

### 3. 失败清理需要回归测试

`removeFailedQuery()` 优先选择并删除输入框末尾的失败查询，失败后才使用 `document.execCommand("undo")`。

应验证：

- 未匹配号码后，草稿里没有残留普通 `@手机号`；
- 未匹配中文昵称后，草稿里没有残留普通 `@昵称`；
- 前面已成功生成的真实提及不会被误撤销；
- 连续多个失败成员后，后面的有效成员仍能被提及。

## 推荐的下一步开发顺序

1. 在 Chrome 扩展管理页重新加载本地扩展。
2. 用一个 3–5 人测试群验证：原生 `@all`、英文昵称、中文昵称、仅显示手机号成员。
3. 为真实提及、未匹配跳过、红色停止按钮分别录制短视频或截图，作为发布前证据。
4. 根据实测候选菜单 DOM，收紧 `visibleMentionOptions()` 的选择器。
5. 给跳过成员增加可复制的结果列表，方便用户手工处理。
6. 只有在完成这些验证后，再准备 Chrome Web Store 的截图、隐私政策网址和发布文案。

## 已完成的验证

```powershell
node tests/participants.test.js
node --check src/**/*.js
```

目前纯成员解析测试、所有脚本语法检查和 `manifest.json` JSON 解析均通过。浏览器实测已经确认真实成员提及的 DOM 标记和“首个未匹配成员导致任务中断”的问题；最新“跳过后继续”版本仍需在重新加载扩展后做最终真实回归。
