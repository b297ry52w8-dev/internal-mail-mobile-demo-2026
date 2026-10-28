import { icon } from "./components/icons.js";
import { currentUser } from "./data/mock-mail-data.js";
import { mailService } from "./services/mail-service.js";

const app = document.querySelector("#app");
const toastRegion = document.querySelector("#toast-region");

const folderLabels = {
  inbox: "收件箱", unread: "未读邮件", starred: "星标邮件", sent: "已发送",
  draft: "草稿箱", scheduled: "待发送", trash: "回收站"
};

const state = {
  permissions: { canViewMail: false, canSendMail: false },
  stats: {},
  folders: [],
  recent: [],
  folderQuery: {},
  folderFilters: {},
  scrollPositions: new Map(),
  sheet: null,
  confirm: null,
  detailPeopleTab: "recipients",
  editor: null,
  pickerTarget: "recipients",
  pickerSelection: [],
  pickerSearch: "",
  pickerDepartment: "全部"
};

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

const nl2br = (value = "") => escapeHtml(value).replaceAll("\n", "<br>");
const uniquePeople = (items = []) => [...new Map(items.map((item) => [item.id, item])).values()];

function showToast(message) {
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  toastRegion.append(element);
  setTimeout(() => element.remove(), 2600);
}

function currentRoute() {
  return (location.hash.replace(/^#\/?/, "") || "workbench").split("?")[0].split("/").filter(Boolean);
}

function saveScroll() {
  state.scrollPositions.set(location.hash || "#/workbench", window.scrollY);
}

function navigate(path) {
  saveScroll();
  location.hash = path.startsWith("#") ? path : `#/${path}`;
}

function goBack(fallback = "mail") {
  if (history.length > 1) history.back(); else navigate(fallback);
}

function pageHeader(title, { back = true, actions = "" } = {}) {
  return `<header class="page-header">
    <div>${back ? `<button class="icon-btn" data-action="back" aria-label="返回">${icon("back")}</button>` : ""}</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="header-actions">${actions}</div>
  </header>`;
}

function bottomTabs() {
  return `<nav class="bottom-tabs" aria-label="主导航">
    ${[
      ["grid", "工作台", "workbench", true], ["message", "消息", "", false],
      ["users", "通讯录", "", false], ["user", "我的", "", false]
    ].map(([name, label, route, active]) => `<button class="bottom-tab ${active ? "active" : ""}" ${route ? `data-route="${route}"` : `data-action="placeholder"`}>
      ${icon(name, 22)}<span>${label}</span>
    </button>`).join("")}
  </nav>`;
}

function renderRecentList(mails, { showSummary = false } = {}) {
  if (!mails.length) return `<div class="empty-state">${icon("mail", 38)}<strong>暂无邮件</strong><span>新邮件到达后会显示在这里</span></div>`;
  return `<div class="recent-list">${mails.map((mail) => `
    <article class="mail-row" role="link" tabindex="0" data-mail-id="${mail.id}" data-folder="${mail.folder}" aria-label="${escapeHtml(mail.sender)}，${escapeHtml(mail.subject)}">
      <span class="state-dot ${mail.read ? "" : "unread"}"></span>
      <div class="mail-row-main">
        <div class="mail-row-top"><strong>${escapeHtml(mail.sender)}</strong>${mail.important ? `<span class="important-tag">重要</span>` : ""}</div>
        <div class="mail-subject">${escapeHtml(mail.subject || "（无主题）")}</div>
        ${showSummary ? `<div class="mail-summary">${escapeHtml(mail.summary || "")}</div>` : ""}
      </div>
      <div class="mail-row-meta"><time>${escapeHtml(mail.time)}</time><span class="mail-row-icons">${mail.starred ? icon("star", 16, "starred") : ""}${mail.hasAttachment ? icon("paperclip", 16) : ""}</span></div>
    </article>`).join("")}</div>`;
}

function renderWorkbenchSlice(active = "mail") {
  const tabs = state.permissions.canViewMail
    ? [["mail", "我的邮件"], ["notice", "公司公告"], ["news", "公司新闻"], ["honor", "公司荣誉"], ["culture", "公司风采"]]
    : [["notice", "公司公告"], ["news", "公司新闻"], ["honor", "公司荣誉"], ["culture", "公司风采"]];
  const companyContent = {
    notice: ["关于开展第四季度安全检查的通知", "年度信息安全培训安排"],
    news: ["公司重点项目阶段成果顺利通过验收", "智慧监理平台完成新版本发布"],
    honor: ["公司荣获年度数字化创新单位", "花湖项目获评优秀监理项目"],
    culture: ["项目一线摄影作品展", "员工健步走活动圆满结束"]
  };
  const content = active === "mail" && state.permissions.canViewMail
    ? `${renderRecentList(state.recent)}<button class="view-more" data-route="mail">查看更多（${state.stats.inbox ?? 0}）${icon("chevronRight", 18)}</button>`
    : `<div class="recent-list">${(companyContent[active] || companyContent.notice).map((title, index) => `<article class="mail-row"><span></span><div class="mail-row-main"><strong>${title}</strong><div class="mail-summary">${index ? "12-05" : "今天"}</div></div>${icon("chevronRight", 16)}</article>`).join("")}</div>`;
  return `<section class="card slice-card">
    <div class="slice-tabs">${tabs.map(([key, label]) => `<button class="slice-tab ${key === active ? "active" : ""}" data-slice="${key}">${label}</button>`).join("")}</div>
    <div id="slice-content">${content}</div>
  </section>`;
}

function renderWorkbench() {
  app.innerHTML = `<div class="page with-tabs workbench">
    <section class="workbench-hero">
      <div class="workbench-top"><h1>工作台</h1><div class="hero-actions"><button class="icon-btn" data-action="placeholder" aria-label="搜索">${icon("search", 23)}</button><button class="icon-btn" data-action="placeholder" aria-label="更多">${icon("more", 23)}</button></div></div>
      <div class="brand-banner"><strong>高效协同<br>创造更大的价值</strong></div>
    </section>
    <div class="workbench-content">
      <section class="card project-card"><div class="card-heading"><h2>我的项目</h2><button class="link-button" data-action="placeholder">全部项目${icon("chevronRight", 18)}</button></div><div class="project-name">鄂州花湖监理项目</div></section>
      ${renderWorkbenchSlice(state.permissions.canViewMail ? "mail" : "notice")}
    </div>
    ${bottomTabs()}
  </div>`;
  restoreScroll();
}

function renderMailHome() {
  if (!state.permissions.canViewMail) return renderNoPermission();
  app.innerHTML = `<div class="page">
    ${pageHeader("我的邮件")}
    <section class="card folder-card">${state.folders.map((folder) => `<div class="folder-row" role="button" tabindex="0" data-folder-route="${folder.key}" aria-label="${folder.label} ${state.stats[folder.key] ?? 0}">
      <span class="folder-icon ${folder.key === "starred" ? "star" : ""}">${icon(folder.icon, 19)}</span>
      <span>${folder.label}</span><span class="folder-count">${state.stats[folder.key] ?? 0}</span>${icon("chevronRight", 17)}
    </div>`).join("")}</section>
    <h2 class="list-title">最近5封邮件</h2>
    <section class="card" style="margin:0 14px">${renderRecentList(state.recent)}</section>
    ${state.permissions.canSendMail ? `<button class="fab" data-editor-mode="new" aria-label="新建邮件">${icon("plus", 27)}</button>` : ""}
  </div>`;
  restoreScroll();
}

function renderNoPermission() {
  app.innerHTML = `<div class="page">${pageHeader("内部邮件")}<div class="empty-state">${icon("shield", 42)}<strong>暂无查看权限</strong><span>请联系管理员开通内部邮件权限</span></div></div>`;
}

function getFolderFilter(folder) {
  if (!state.folderFilters[folder]) state.folderFilters[folder] = { read: "all", attachment: false, important: false, starred: false, timeRange: "all", sort: "desc" };
  return state.folderFilters[folder];
}

async function renderFolder(folder) {
  if (!folderLabels[folder]) return navigate("mail");
  const query = state.folderQuery[folder] || "";
  const filters = getFolderFilter(folder);
  const items = await mailService.getFolder(folder, { keyword: query, filters });
  const activeNames = [filters.read !== "all" ? (filters.read === "unread" ? "未读" : "已读") : "全部", filters.attachment ? "有附件" : "", filters.important ? "重要" : "", filters.starred ? "星标" : ""].filter(Boolean);
  app.innerHTML = `<div class="page">
    ${pageHeader(folderLabels[folder], { actions: `<button class="icon-btn" data-action="folder-more" aria-label="更多">${icon("more")}</button>` })}
    <section class="search-panel"><div class="search-line"><label class="search-box">${icon("search", 17)}<input type="search" value="${escapeHtml(query)}" data-folder-search="${folder}" placeholder="搜索主题、发件人或正文" aria-label="搜索邮件"></label><button class="filter-trigger" data-filter-folder="${folder}" aria-label="筛选和排序">${icon("filter", 19)}</button></div>
      <div class="active-filters">${activeNames.map((name, index) => `<button class="filter-chip ${index === 0 ? "active" : ""}" data-filter-folder="${folder}">${name}</button>`).join("")}</div>
    </section>
    <section class="mail-list">${renderFolderItems(items, folder)}</section>
  </div>`;
  restoreScroll();
}

function renderFolderItems(items, folder) {
  if (!items.length) return `<div class="empty-state">${icon("mail", 40)}<strong>没有找到邮件</strong><span>请调整搜索词或筛选条件</span></div>`;
  return items.map((mail) => {
    if (folder === "scheduled") return `<article class="mail-row" role="link" tabindex="0" data-editor-mode="scheduled" data-id="${mail.id}"><span></span><div class="mail-row-main"><div class="mail-row-top"><strong>${escapeHtml(mail.subject || "（无主题）")}</strong></div><div class="mail-subject">收件人：${recipientText(mail.recipients)}</div><div class="mail-summary">定时发送：${escapeHtml(mail.scheduledAt)}</div></div><div class="mail-row-meta">${icon("chevronRight", 17)}</div></article>`;
    if (folder === "draft") return `<article class="mail-row" role="link" tabindex="0" data-editor-mode="draft" data-id="${mail.id}"><span></span><div class="mail-row-main"><div class="mail-row-top"><strong>${escapeHtml(mail.subject || "（无主题）")}</strong></div><div class="mail-summary">${escapeHtml(mail.summary || "草稿")}</div></div><div class="mail-row-meta">${icon("chevronRight", 17)}</div></article>`;
    if (folder === "sent") return `<article class="mail-row" role="link" tabindex="0" data-mail-id="${mail.id}" data-folder="sent"><span></span><div class="mail-row-main"><div class="mail-row-top"><strong>${escapeHtml(mail.subject || "（无主题）")}</strong></div><div class="mail-subject">${escapeHtml(mail.summary)}</div></div><div class="mail-row-meta"><time>${escapeHtml(mail.time)}</time></div></article>`;
    return `<article class="mail-row" role="link" tabindex="0" data-mail-id="${mail.id}" data-folder="${folder}"><span class="state-dot ${mail.read ? "" : "unread"}"></span><div class="mail-row-main"><div class="mail-row-top"><strong>${escapeHtml(mail.sender)}</strong>${mail.important ? `<span class="important-tag">重要</span>` : ""}</div><div class="mail-subject">${escapeHtml(mail.subject || "（无主题）")}</div><div class="mail-summary">${escapeHtml(mail.summary)}</div></div><div class="mail-row-meta"><time>${escapeHtml(mail.time)}</time><span class="mail-row-icons">${mail.starred ? icon("star", 16, "starred") : ""}${mail.hasAttachment ? icon("paperclip", 16) : ""}</span></div></article>`;
  }).join("");
}

function recipientText(recipients = []) {
  if (!recipients.length) return "未选择";
  const names = recipients.slice(0, 2).map((item) => item.name).join("、");
  return recipients.length > 2 ? `${names}等${recipients.length}人` : names;
}

async function renderDetail(id, sourceFolder) {
  let mail;
  try {
    if (sourceFolder !== "trash" && sourceFolder !== "sent") await mailService.markRead(id, true);
    mail = await mailService.getMail(id);
  } catch (error) {
    showToast(error.message); return navigate("mail");
  }
  const isTrash = mail.folder === "trash" || sourceFolder === "trash";
  const isSent = mail.folder === "sent" || sourceFolder === "sent";
  state.currentMail = mail;
  const actions = `${!isTrash ? `<button class="icon-btn ${mail.starred ? "active" : ""}" data-action="toggle-star" data-id="${mail.id}" aria-label="${mail.starred ? "取消星标" : "星标"}">${icon("star", 20)}</button><button class="icon-btn" data-action="detail-more" data-id="${mail.id}" aria-label="更多">${icon("more", 21)}</button>` : ""}`;
  app.innerHTML = `<div class="page with-bottom-bar">
    ${pageHeader(isTrash ? "回收站邮件" : (isSent ? "已发送邮件" : "邮件详情"), { actions })}
    <article class="detail-content">
      <h2 class="detail-subject">${escapeHtml(mail.subject || "（无主题）")}</h2>
      <div class="sender-card"><span class="avatar">${icon("user", 23)}</span><div><div class="sender-name">${escapeHtml(mail.sender)}</div><div class="sender-dept">${escapeHtml(mail.senderDepartment || "")}</div></div><time class="sender-time">${escapeHtml(mail.fullTime)}</time></div>
      <div class="recipient-summary"><div class="recipient-line"><span>收件人：${escapeHtml(recipientText(mail.recipients))}</span><button data-recipient-detail="recipients" data-id="${mail.id}">查看详情${icon("chevronRight", 15)}</button></div>${mail.cc?.length ? `<div class="recipient-line"><span>抄送：${escapeHtml(recipientText(mail.cc))}</span><button data-recipient-detail="cc" data-id="${mail.id}">查看详情${icon("chevronRight", 15)}</button></div>` : ""}</div>
      <div class="mail-body">${nl2br(mail.body)}</div>
      ${mail.attachments?.length ? `<section><h3 class="section-heading">附件（${mail.attachments.length}）</h3>${renderAttachments(mail.attachments)}</section>` : ""}
      ${isSent ? renderReceipt(mail) : ""}
      ${mail.history ? `<section class="history"><button data-action="toggle-history">显示历史沟通记录${icon("chevronRight", 15)}</button><div class="history-content" hidden>${escapeHtml(mail.history)}</div></section>` : ""}
    </article>
    ${isTrash ? `<footer class="detail-actions trash-actions"><button class="secondary-btn" data-action="restore" data-id="${mail.id}">恢复</button><button class="danger-btn" data-action="hard-delete-confirm" data-id="${mail.id}">彻底删除</button></footer>` : renderDetailActions(mail, isSent)}
  </div>`;
  restoreScroll();
}

function renderAttachments(attachments = []) {
  return `<div class="attachment-list">${attachments.map((file) => `<button class="attachment-item" data-action="preview-attachment" data-attachment-id="${file.id}"><span class="file-badge">${escapeHtml(file.type)}</span><span><div class="attachment-name">${escapeHtml(file.name)}</div><div class="attachment-size">${escapeHtml(file.size)}</div></span>${icon("chevronRight", 17)}</button>`).join("")}</div>`;
}

function renderReceipt(mail) {
  return `<section class="receipt-panel"><h3 class="section-heading">已读情况（${mail.readCount || 0}/${(mail.readCount || 0) + (mail.unreadCount || 0)}）</h3><button class="sheet-option" data-receipt-detail="read" data-id="${mail.id}"><span>已读</span><strong style="margin-left:auto">${mail.readCount || 0}人 ${icon("chevronRight", 15)}</strong></button><button class="sheet-option" data-receipt-detail="unread" data-id="${mail.id}"><span>未读</span><strong style="margin-left:auto">${mail.unreadCount || 0}人 ${icon("chevronRight", 15)}</strong></button>${mail.failed?.length ? `<button class="sheet-option failed" data-receipt-detail="failed" data-id="${mail.id}"><span>发送失败</span><strong style="margin-left:auto">${mail.failed.length}人 ${icon("chevronRight", 15)}</strong></button>` : ""}</section>`;
}

function renderDetailActions(mail, isSent) {
  if (!state.permissions.canSendMail) return "";
  if (isSent) return `<footer class="detail-actions"><button class="detail-action" data-editor-mode="forward" data-id="${mail.id}">${icon("forward", 20)}<span>转发</span></button><button class="detail-action" data-action="recall" data-id="${mail.id}">${icon("restore", 20)}<span>撤回</span></button><button class="detail-action" data-action="detail-more" data-id="${mail.id}">${icon("more", 20)}<span>更多</span></button><span></span></footer>`;
  return `<footer class="detail-actions"><button class="detail-action" data-editor-mode="reply" data-id="${mail.id}">${icon("reply", 20)}<span>回复</span></button><button class="detail-action" data-editor-mode="replyAll" data-id="${mail.id}">${icon("replyAll", 20)}<span>回复全部</span></button><button class="detail-action" data-editor-mode="forward" data-id="${mail.id}">${icon("forward", 20)}<span>转发</span></button><button class="detail-action" data-action="detail-more" data-id="${mail.id}">${icon("more", 20)}<span>更多</span></button></footer>`;
}

async function renderRecipientDetail(id, tab = state.detailPeopleTab) {
  const mail = await mailService.getMail(id);
  state.detailPeopleTab = tab;
  const list = tab === "cc" ? (mail.cc || []) : (mail.recipients || []);
  app.innerHTML = `<div class="page">${pageHeader("收件人详情")}
    <div class="people-tabs"><button class="people-tab ${tab === "recipients" ? "active" : ""}" data-people-tab="recipients" data-id="${id}">收件人（${mail.recipients?.length || 0}）</button><button class="people-tab ${tab === "cc" ? "active" : ""}" data-people-tab="cc" data-id="${id}">抄送人（${mail.cc?.length || 0}）</button></div>
    <div class="people-search"><label class="search-box">${icon("search", 17)}<input type="search" placeholder="搜索姓名或部门" data-people-detail-search></label></div>
    <section class="person-list">${renderPeopleRows(list, false)}</section></div>`;
}

async function renderReceiptDetail(id, type) {
  const labels = { read: "已读人员", unread: "未读人员", failed: "发送失败人员" };
  const result = await mailService.getReceiptDetails(id, type);
  app.innerHTML = `<div class="page">${pageHeader(labels[type] || "发送明细")}<div class="list-title">共 ${result.total} 人</div><section class="person-list">${renderPeopleRows(result.items, false)}</section></div>`;
}

function renderPeopleRows(list, selectable, selected = []) {
  if (!list.length) return `<div class="empty-state"><strong>暂无人员</strong></div>`;
  return list.map((person) => {
    const isSelected = selected.includes(person.id);
    const disabled = person.status === "leaving";
    return `<div class="person-row ${isSelected ? "selected" : ""} ${disabled ? "disabled" : ""}" ${selectable && !disabled ? `tabindex="0" data-person-id="${person.id}"` : ""}><span class="avatar">${icon("user", 18)}</span><div><div class="person-name">${escapeHtml(person.name)}</div><div class="person-dept">${escapeHtml(person.department)}${disabled ? " · 离职办理中" : ""}</div></div>${selectable ? `<span class="check-circle">${isSelected ? icon("check", 14) : ""}</span>` : ""}</div>`;
  }).join("");
}

function prefixSubject(subject = "", mode) {
  const clean = subject.replace(/^(回复|转发)：\s*/u, "");
  if (mode === "reply" || mode === "replyAll") return `回复：${clean}`;
  if (mode === "forward") return `转发：${clean}`;
  return subject;
}

async function prepareEditor(mode, id) {
  const key = `${mode}:${id || "new"}`;
  if (state.editor?.key === key) return state.editor;
  let source = null;
  if (id) source = await mailService.getMail(id);
  let recipients = [];
  let cc = [];
  if (mode === "reply") recipients = source ? [{ id: source.senderId, name: source.sender, department: source.senderDepartment, status: "active" }] : [];
  if (mode === "replyAll" && source) {
    recipients = uniquePeople([{ id: source.senderId, name: source.sender, department: source.senderDepartment, status: "active" }, ...(source.recipients || [])]).filter((person) => person.id !== currentUser.id);
    cc = uniquePeople(source.cc || []).filter((person) => person.id !== currentUser.id && !recipients.some((recipient) => recipient.id === person.id));
  }
  if (["draft", "scheduled"].includes(mode) && source) { recipients = source.recipients || []; cc = source.cc || []; }
  state.editor = {
    key, id: ["draft", "scheduled"].includes(mode) ? source?.id : null, sourceId: source?.id || null, mode,
    recipients, cc, subject: source ? prefixSubject(source.subject, mode) : "",
    body: ["draft", "scheduled"].includes(mode) ? source?.body || "" : "",
    bodyHtml: ["draft", "scheduled"].includes(mode) ? nl2br(source?.body || "") : "",
    important: ["draft", "scheduled"].includes(mode) ? Boolean(source?.important) : false,
    attachments: ["draft", "scheduled"].includes(mode) ? cloneAttachments(source?.attachments) : [],
    scheduledAt: mode === "scheduled" ? source?.scheduledAt : null,
    originalQuote: ["reply", "replyAll", "forward"].includes(mode) && source ? {
      sender: source.sender, fullTime: source.fullTime, subject: source.subject, body: source.body
    } : null
  };
  return state.editor;
}

const cloneAttachments = (items = []) => items.map((item) => ({ ...item }));

async function renderEditor(mode, id) {
  if (!state.permissions.canSendMail) return renderNoPermission();
  const editor = await prepareEditor(mode, id);
  const isScheduled = mode === "scheduled";
  const editorTitle = mode === "new" ? "写邮件" : "编辑邮件";
  app.innerHTML = `<div class="page with-bottom-bar">${pageHeader(editorTitle, { actions: "" })}
    ${isScheduled ? `<div class="schedule-banner"><span>定时发送时间：${escapeHtml(editor.scheduledAt)}</span><button class="text-btn" data-action="edit-schedule">修改${icon("chevronRight", 15)}</button></div>` : ""}
    <section class="editor-form">
      <div class="editor-field" role="button" tabindex="0" data-picker-target="recipients" aria-label="选择收件人"><label>收件人<span class="failed">*</span></label><div class="recipient-value">${renderRecipientPills(editor.recipients, "请选择收件人")}</div>${icon("chevronRight", 17)}</div>
      <div class="editor-field" role="button" tabindex="0" data-picker-target="cc" aria-label="选择抄送人"><label>抄送</label><div class="recipient-value">${renderRecipientPills(editor.cc, "可选")}</div>${icon("chevronRight", 17)}</div>
      <div class="editor-field"><label for="subject">主题</label><input id="subject" value="${escapeHtml(editor.subject)}" data-editor-subject placeholder="请输入主题"><span></span></div>
      <div class="editor-field"><label>重要邮件</label><span></span><button class="important-toggle ${editor.important ? "active" : ""}" data-action="toggle-important" aria-label="重要邮件" aria-pressed="${editor.important}"></button></div>
      <div class="editor-body" contenteditable="true" role="textbox" aria-label="邮件正文" data-editor-body data-placeholder="请输入邮件正文…">${editor.bodyHtml}</div>
      <div class="editor-toolbar" aria-label="正文格式"><button class="icon-btn" data-format="bold" aria-label="加粗">${icon("bold", 19)}</button><button class="icon-btn" data-format="insertUnorderedList" aria-label="项目符号">${icon("list", 19)}</button><button class="icon-btn" data-action="insert-image" aria-label="插入图片">${icon("image", 19)}</button></div>
      ${editor.originalQuote ? `<details class="quoted-original"><summary>历史原文</summary><div class="quoted-original-body">发件人：${escapeHtml(editor.originalQuote.sender)}\n时间：${escapeHtml(editor.originalQuote.fullTime)}\n主题：${escapeHtml(editor.originalQuote.subject)}\n\n${escapeHtml(editor.originalQuote.body)}</div></details>` : ""}
    </section>
    <section class="attachment-editor"><div class="attachment-heading"><h2>附件</h2><button data-action="add-attachment">${icon("paperclip", 17)} 添加附件</button></div><div class="attachment-list">${renderEditorAttachments(editor.attachments)}</div></section>
    ${renderEditorActions(mode)}
  </div>`;
}

function renderRecipientPills(items, placeholder) {
  if (!items.length) return `<span>${placeholder}</span>`;
  return items.slice(0, 3).map((person) => `<span class="recipient-pill">${escapeHtml(person.name)}</span>`).join("") + (items.length > 3 ? `<span>等${items.length}人</span>` : "");
}

function renderEditorAttachments(items) {
  if (!items.length) return `<div class="mail-summary">暂无附件</div>`;
  return items.map((file, index) => `<div class="attachment-item editor-attachment"><span class="file-badge">${escapeHtml(file.type || "FILE")}</span><span><div class="attachment-name">${escapeHtml(file.name)}</div><div class="attachment-size">${escapeHtml(file.size)}</div></span><button class="icon-btn" data-remove-attachment="${index}" aria-label="删除附件">${icon("x", 18)}</button></div>`).join("");
}

function renderEditorActions(mode) {
  if (mode === "scheduled") return `<footer class="editor-actions"><button class="secondary-btn" data-action="cancel-schedule">取消定时</button><button class="secondary-btn" data-action="send-now">立即发送</button><button class="primary-btn" data-action="save-editor">保存修改</button></footer>`;
  return `<footer class="editor-actions two"><button class="secondary-btn" data-action="save-editor">保存草稿</button><button class="primary-btn" data-action="submit-editor">发送</button></footer>`;
}

async function renderPicker(target) {
  state.pickerTarget = target;
  if (!state.editor) return goBack("mail");
  const pickerKey = `${state.editor.key}:${target}`;
  if (state.pickerKey !== pickerKey) {
    state.pickerKey = pickerKey;
    state.pickerSelection = (state.editor[target] || []).map((person) => person.id);
    state.pickerSearch = "";
    state.pickerDepartment = "全部";
  }
  const all = await mailService.searchPeople(state.pickerSearch);
  const departments = ["全部", ...new Set(all.map((person) => person.department))];
  const visible = state.pickerDepartment === "全部" ? all : all.filter((person) => person.department === state.pickerDepartment);
  app.innerHTML = `<div class="page with-bottom-bar">${pageHeader(target === "cc" ? "选择抄送人" : "选择收件人")}
    <div class="people-search"><label class="search-box">${icon("search", 17)}<input type="search" value="${escapeHtml(state.pickerSearch)}" placeholder="搜索姓名或部门" data-picker-search></label><div class="active-filters">${departments.map((department) => `<button class="filter-chip ${department === state.pickerDepartment ? "active" : ""}" data-picker-department="${escapeHtml(department)}">${escapeHtml(department)}</button>`).join("")}</div></div>
    <section class="person-list">${renderPeopleRows(visible, true, state.pickerSelection)}</section>
    <footer class="picker-footer"><div class="selection-summary">已选择 ${state.pickerSelection.length} 人</div><button class="primary-btn" data-action="confirm-picker">确定</button></footer>
  </div>`;
}

function renderSheet() {
  document.querySelector(".sheet-backdrop")?.remove();
  if (!state.sheet) return;
  const wrapper = document.createElement("div");
  wrapper.className = "sheet-backdrop";
  wrapper.dataset.action = "close-sheet";
  if (state.sheet.type === "filter") wrapper.innerHTML = filterSheetHtml(state.sheet.folder);
  if (state.sheet.type === "detail") wrapper.innerHTML = detailSheetHtml(state.sheet.mail);
  if (state.sheet.type === "attachment") wrapper.innerHTML = attachmentSheetHtml(state.sheet.file);
  if (state.sheet.type === "confirm") wrapper.innerHTML = confirmHtml(state.sheet);
  app.append(wrapper);
}

function filterSheetHtml(folder) {
  const filters = getFolderFilter(folder);
  return `<section class="bottom-sheet" role="dialog" aria-modal="true" aria-label="筛选和排序" data-sheet-panel><div class="sheet-handle"></div><div class="sheet-title"><h2>筛选和排序</h2><button class="text-btn" data-action="clear-filters" data-folder="${folder}">重置</button></div>
    <div class="filter-group"><h3>阅读状态</h3><div class="filter-options">${[["all","全部"],["unread","未读"],["read","已读"]].map(([value,label]) => `<button class="filter-chip ${filters.read === value ? "active" : ""}" data-set-read="${value}" data-folder="${folder}">${label}</button>`).join("")}</div></div>
    <div class="filter-group"><h3>邮件属性</h3><div class="filter-options"><button class="filter-chip ${filters.attachment ? "active" : ""}" data-toggle-filter="attachment" data-folder="${folder}">有附件</button><button class="filter-chip ${filters.important ? "active" : ""}" data-toggle-filter="important" data-folder="${folder}">重要邮件</button><button class="filter-chip ${filters.starred ? "active" : ""}" data-toggle-filter="starred" data-folder="${folder}">星标</button></div></div>
    <div class="filter-group"><h3>时间范围</h3><div class="filter-options">${[["all","全部时间"],["week","最近7天"],["month","最近30天"]].map(([value,label]) => `<button class="filter-chip ${filters.timeRange === value ? "active" : ""}" data-set-time="${value}" data-folder="${folder}">${label}</button>`).join("")}</div></div>
    <div class="filter-group"><h3>排序方式</h3><div class="filter-options">${[["desc","接收时间倒序"],["asc","接收时间正序"]].map(([value,label]) => `<button class="filter-chip ${filters.sort === value ? "active" : ""}" data-set-sort="${value}" data-folder="${folder}">${label}</button>`).join("")}</div></div>
    <button class="primary-btn wide" data-action="apply-filter" data-folder="${folder}" style="margin-top:16px">查看结果</button>
  </section>`;
}

function detailSheetHtml(mail) {
  return `<section class="bottom-sheet" role="dialog" aria-modal="true" aria-label="更多操作" data-sheet-panel><div class="sheet-handle"></div><div class="sheet-title"><h2>更多操作</h2></div>
    ${mail.folder !== "sent" ? `<button class="sheet-option" data-action="mark-unread" data-id="${mail.id}">${icon("mail")}标记未读</button>` : ""}
    <button class="sheet-option" data-action="toggle-star" data-id="${mail.id}">${icon("star")}${mail.starred ? "取消星标" : "星标邮件"}</button>
    ${state.permissions.canSendMail ? `<button class="sheet-option" data-editor-mode="forward" data-id="${mail.id}">${icon("file")}复制为新邮件</button>` : ""}
    <button class="sheet-option danger" data-action="delete-mail" data-id="${mail.id}">${icon("trash")}删除邮件</button>
  </section>`;
}

function attachmentSheetHtml(file) {
  return `<section class="bottom-sheet" role="dialog" aria-modal="true" aria-label="附件预览" data-sheet-panel><div class="sheet-handle"></div><div class="sheet-title"><h2>附件预览</h2><button class="icon-btn" data-action="close-sheet" aria-label="关闭">${icon("x")}</button></div><div class="preview-panel"><span class="file-badge">${escapeHtml(file.type)}</span><strong>${escapeHtml(file.name)}</strong><span>${escapeHtml(file.size)}</span></div><div class="sheet-actions"><button class="secondary-btn" data-action="close-sheet">关闭</button><button class="primary-btn" data-action="download-attachment" data-attachment-id="${file.id}">${icon("download", 18)} 下载</button></div></section>`;
}

function confirmHtml(sheet) {
  return `<section class="confirm-dialog" role="alertdialog" aria-modal="true" data-sheet-panel><h2>${escapeHtml(sheet.title)}</h2><p>${escapeHtml(sheet.message)}</p><div class="confirm-actions"><button class="secondary-btn" data-action="close-sheet">取消</button><button class="${sheet.danger ? "danger-btn" : "primary-btn"}" data-confirm-action="${sheet.confirmAction}" data-id="${sheet.id || ""}">${escapeHtml(sheet.confirmLabel || "确定")}</button></div></section>`;
}

function openConfirm(config) { state.sheet = { type: "confirm", ...config }; renderSheet(); }
function closeSheet() { state.sheet = null; renderSheet(); }

function restoreScroll() {
  requestAnimationFrame(() => window.scrollTo({ top: state.scrollPositions.get(location.hash || "#/workbench") || 0, behavior: "instant" }));
}

async function refreshSharedData() {
  [state.permissions, state.stats, state.folders, state.recent] = await Promise.all([
    mailService.getPermissions(), mailService.getFolderStats(), mailService.getFolderDefinitions(), mailService.getRecent(5)
  ]);
}

async function route() {
  closeSheet();
  const parts = currentRoute();
  if (parts[0] === "workbench") return renderWorkbench();
  if (parts[0] === "mail" && parts.length === 1) return renderMailHome();
  if (parts[0] === "folder") return renderFolder(parts[1]);
  if (parts[0] === "detail") return renderDetail(parts[1], parts[2]);
  if (parts[0] === "recipients") return renderRecipientDetail(parts[1], parts[2] || "recipients");
  if (parts[0] === "receipt") return renderReceiptDetail(parts[1], parts[2] || "read");
  if (parts[0] === "editor") return renderEditor(parts[1], parts[2]);
  if (parts[0] === "picker") return renderPicker(parts[1] || "recipients");
  navigate("workbench");
}

function syncEditorFromDom() {
  if (!state.editor) return;
  const subject = document.querySelector("[data-editor-subject]");
  const body = document.querySelector("[data-editor-body]");
  if (subject) state.editor.subject = subject.value;
  if (body) { state.editor.body = body.innerText.trim(); state.editor.bodyHtml = body.innerHTML; }
}

async function saveEditor(folder) {
  syncEditorFromDom();
  const payload = { ...state.editor, folder: folder || (state.editor.mode === "scheduled" ? "scheduled" : "draft"), hasAttachment: state.editor.attachments.length > 0 };
  const saved = await mailService.saveDraft(payload);
  state.editor.id = saved.id;
  showToast(folder === "scheduled" ? "修改已保存" : "草稿已保存");
  navigate(folder === "scheduled" ? "folder/scheduled" : "folder/draft");
}

async function submitEditor() {
  syncEditorFromDom();
  if (!state.editor.recipients.length) return showToast("请选择收件人");
  if (!state.editor.body.trim()) return showToast("请输入邮件正文");
  if (!state.editor.subject.trim()) return openConfirm({ title: "邮件主题为空", message: "确认按无主题邮件发送吗？", confirmLabel: "继续发送", confirmAction: "send-without-subject" });
  await completeSend();
}

async function completeSend() {
  try {
    const result = await mailService.send({ ...state.editor, hasAttachment: state.editor.attachments.length > 0 });
    state.editor = null;
    showToast("邮件已发送");
    navigate(`detail/${result.id}/sent`);
  } catch (error) { showToast(error.message); }
}

function chooseFile({ imageOnly = false } = {}) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = imageOnly ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    if (imageOnly) {
      const reader = new FileReader();
      reader.onload = () => document.execCommand("insertImage", false, reader.result);
      reader.readAsDataURL(file);
      showToast("图片已插入正文");
      return;
    }
    state.editor.attachments.push({ id: `local-${Date.now()}`, name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, type: file.name.split(".").pop().toUpperCase() });
    renderEditor(state.editor.mode, state.editor.sourceId || state.editor.id);
  };
  input.click();
}

app.addEventListener("click", async (event) => {
  const routeTarget = event.target.closest("[data-route]");
  if (routeTarget) return navigate(routeTarget.dataset.route);
  if (event.target.closest("[data-action='back']")) return goBack();
  if (event.target.closest("[data-action='placeholder']")) return showToast("该区域沿用现有 APP，本工程未扩展其业务功能");

  const slice = event.target.closest("[data-slice]");
  if (slice) return document.querySelector(".slice-card")?.replaceWith(htmlToElement(renderWorkbenchSlice(slice.dataset.slice)));

  const folderRoute = event.target.closest("[data-folder-route]");
  if (folderRoute) return navigate(`folder/${folderRoute.dataset.folderRoute}`);

  const mailRow = event.target.closest("[data-mail-id]");
  if (mailRow) return navigate(`detail/${mailRow.dataset.mailId}/${mailRow.dataset.folder || "inbox"}`);

  const editorTarget = event.target.closest("[data-editor-mode]");
  if (editorTarget) { state.editor = null; return navigate(`editor/${editorTarget.dataset.editorMode}${editorTarget.dataset.id ? `/${editorTarget.dataset.id}` : ""}`); }

  const recipientDetail = event.target.closest("[data-recipient-detail]");
  if (recipientDetail) return navigate(`recipients/${recipientDetail.dataset.id}/${recipientDetail.dataset.recipientDetail}`);

  const receiptDetail = event.target.closest("[data-receipt-detail]");
  if (receiptDetail) return navigate(`receipt/${receiptDetail.dataset.id}/${receiptDetail.dataset.receiptDetail}`);

  const peopleTab = event.target.closest("[data-people-tab]");
  if (peopleTab) return renderRecipientDetail(peopleTab.dataset.id, peopleTab.dataset.peopleTab);

  const pickerTarget = event.target.closest("[data-picker-target]");
  if (pickerTarget) { syncEditorFromDom(); return navigate(`picker/${pickerTarget.dataset.pickerTarget}`); }

  const personRow = event.target.closest("[data-person-id]");
  if (personRow) {
    const id = personRow.dataset.personId;
    state.pickerSelection = state.pickerSelection.includes(id) ? state.pickerSelection.filter((value) => value !== id) : [...state.pickerSelection, id];
    return renderPicker(state.pickerTarget);
  }

  const pickerDepartment = event.target.closest("[data-picker-department]");
  if (pickerDepartment) { state.pickerDepartment = pickerDepartment.dataset.pickerDepartment; return renderPicker(state.pickerTarget); }

  const filterTrigger = event.target.closest("[data-filter-folder]");
  if (filterTrigger) { state.sheet = { type: "filter", folder: filterTrigger.dataset.filterFolder }; return renderSheet(); }

  const backdrop = event.target.closest(".sheet-backdrop");
  if (backdrop && !event.target.closest("[data-sheet-panel]")) return closeSheet();
  if (event.target.closest("[data-action='close-sheet']")) return closeSheet();

  const action = event.target.closest("[data-action]")?.dataset.action;
  const actionTarget = event.target.closest("[data-action]");
  if (action === "toggle-history") {
    const content = document.querySelector(".history-content"); content.hidden = !content.hidden; actionTarget.firstChild.textContent = content.hidden ? "显示历史沟通记录" : "收起历史沟通记录"; return;
  }
  if (action === "preview-attachment") {
    const file = state.currentMail?.attachments?.find((item) => item.id === actionTarget.dataset.attachmentId);
    if (!file) return showToast("附件不存在或已失效");
    state.sheet = { type: "attachment", file }; return renderSheet();
  }
  if (action === "folder-more") return showToast("列表默认按接收时间倒序");
  if (action === "detail-more") {
    const mail = await mailService.getMail(actionTarget.dataset.id); state.sheet = { type: "detail", mail }; return renderSheet();
  }
  if (action === "toggle-star") { await mailService.toggleStar(actionTarget.dataset.id); closeSheet(); return route(); }
  if (action === "mark-unread") { await mailService.markRead(actionTarget.dataset.id, false); closeSheet(); showToast("已标记为未读"); return goBack("mail"); }
  if (action === "delete-mail") { closeSheet(); await mailService.moveToTrash(actionTarget.dataset.id); showToast("已移至回收站"); await refreshSharedData(); return navigate("mail"); }
  if (action === "restore") { await mailService.restore(actionTarget.dataset.id); showToast("邮件已恢复到原所属模块"); await refreshSharedData(); return navigate("folder/trash"); }
  if (action === "hard-delete-confirm") return openConfirm({ title: "彻底删除邮件", message: "彻底删除后不可恢复，是否继续？", danger: true, confirmLabel: "彻底删除", confirmAction: "hard-delete", id: actionTarget.dataset.id });
  if (action === "recall") return openConfirm({ title: "撤回邮件", message: "撤回仅对未读人员生效，多收件人将按 PC 端规则部分撤回。", confirmLabel: "确认撤回", confirmAction: "recall", id: actionTarget.dataset.id });
  if (action === "toggle-important") { state.editor.important = !state.editor.important; return renderEditor(state.editor.mode, state.editor.sourceId || state.editor.id); }
  if (action === "add-attachment") return chooseFile();
  if (action === "insert-image") { document.querySelector("[data-editor-body]")?.focus(); return chooseFile({ imageOnly: true }); }
  if (action === "save-editor") return saveEditor(state.editor.mode === "scheduled" ? "scheduled" : "draft");
  if (action === "submit-editor") return submitEditor();
  if (action === "cancel-schedule") return openConfirm({ title: "取消定时发送", message: "取消后该邮件将转为普通草稿。", confirmLabel: "确认取消", confirmAction: "cancel-schedule", id: state.editor.id });
  if (action === "send-now") return openConfirm({ title: "立即发送", message: "发送前将按 PC 端规则重新校验人员状态。", confirmLabel: "立即发送", confirmAction: "send-now", id: state.editor.id });
  if (action === "edit-schedule") {
    syncEditorFromDom();
    const banner = document.querySelector(".schedule-banner");
    if (banner) banner.innerHTML = `<input class="datetime-input" type="datetime-local" value="${escapeHtml(String(state.editor.scheduledAt || "").replace(" ", "T"))}" data-schedule-input aria-label="定时发送时间"><div><button class="text-btn" data-action="cancel-schedule-edit">取消</button><button class="text-btn" data-action="save-schedule-time">确定</button></div>`;
    return;
  }
  if (action === "save-schedule-time") {
    const value = document.querySelector("[data-schedule-input]")?.value;
    if (!value) return showToast("请选择定时发送时间");
    state.editor.scheduledAt = value.replace("T", " ");
    const banner = document.querySelector(".schedule-banner");
    if (banner) banner.innerHTML = `<span>定时发送时间：${escapeHtml(state.editor.scheduledAt)}</span><button class="text-btn" data-action="edit-schedule">修改${icon("chevronRight", 15)}</button>`;
    return showToast("定时发送时间已更新");
  }
  if (action === "cancel-schedule-edit") {
    const banner = document.querySelector(".schedule-banner");
    if (banner) banner.innerHTML = `<span>定时发送时间：${escapeHtml(state.editor.scheduledAt)}</span><button class="text-btn" data-action="edit-schedule">修改${icon("chevronRight", 15)}</button>`;
    return;
  }
  if (action === "download-attachment") {
    const file = state.currentMail?.attachments?.find((item) => item.id === actionTarget.dataset.attachmentId);
    if (!file) return showToast("附件不存在或已失效");
    const blob = new Blob([`内部邮件附件演示文件\n文件名：${file.name}\n真实环境由 PC 端统一附件接口返回。`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${file.name}.demo.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); showToast("附件已开始下载"); return;
  }
  if (action === "confirm-picker") {
    const selected = await mailService.getPeople(state.pickerSelection);
    if (state.pickerTarget === "recipients") {
      state.editor.recipients = selected;
      state.editor.cc = state.editor.cc.filter((person) => !state.pickerSelection.includes(person.id));
    } else {
      state.editor.cc = selected.filter((person) => !state.editor.recipients.some((recipient) => recipient.id === person.id));
    }
    state.pickerKey = null;
    return goBack(`editor/${state.editor.mode}${state.editor.sourceId ? `/${state.editor.sourceId}` : ""}`);
  }
  if (action === "apply-filter") { closeSheet(); return renderFolder(actionTarget.dataset.folder); }
  if (action === "clear-filters") { state.folderFilters[actionTarget.dataset.folder] = { read: "all", attachment: false, important: false, starred: false, timeRange: "all", sort: "desc" }; closeSheet(); return renderFolder(actionTarget.dataset.folder); }

  const removeAttachment = event.target.closest("[data-remove-attachment]");
  if (removeAttachment) { state.editor.attachments.splice(Number(removeAttachment.dataset.removeAttachment), 1); return renderEditor(state.editor.mode, state.editor.sourceId || state.editor.id); }

  const format = event.target.closest("[data-format]");
  if (format) { document.querySelector("[data-editor-body]")?.focus(); document.execCommand(format.dataset.format); return syncEditorFromDom(); }

  const setRead = event.target.closest("[data-set-read]");
  if (setRead) { getFolderFilter(setRead.dataset.folder).read = setRead.dataset.setRead; return renderSheet(); }
  const toggleFilter = event.target.closest("[data-toggle-filter]");
  if (toggleFilter) { const filters = getFolderFilter(toggleFilter.dataset.folder); filters[toggleFilter.dataset.toggleFilter] = !filters[toggleFilter.dataset.toggleFilter]; return renderSheet(); }
  const setTime = event.target.closest("[data-set-time]");
  if (setTime) { getFolderFilter(setTime.dataset.folder).timeRange = setTime.dataset.setTime; return renderSheet(); }
  const setSort = event.target.closest("[data-set-sort]");
  if (setSort) { getFolderFilter(setSort.dataset.folder).sort = setSort.dataset.setSort; return renderSheet(); }

  const confirm = event.target.closest("[data-confirm-action]");
  if (confirm) return handleConfirm(confirm.dataset.confirmAction, confirm.dataset.id);
});

app.addEventListener("input", (event) => {
  if (event.target.matches("[data-editor-subject], [data-editor-body]")) syncEditorFromDom();
  if (event.target.matches("[data-folder-search]")) {
    const folder = event.target.dataset.folderSearch; state.folderQuery[folder] = event.target.value;
    clearTimeout(state.searchTimer); state.searchTimer = setTimeout(() => renderFolder(folder), 180);
  }
  if (event.target.matches("[data-picker-search]")) {
    state.pickerSearch = event.target.value; clearTimeout(state.pickerTimer); state.pickerTimer = setTimeout(() => renderPicker(state.pickerTarget), 180);
  }
  if (event.target.matches("[data-people-detail-search]")) {
    const keyword = event.target.value.toLowerCase(); document.querySelectorAll(".person-row").forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(keyword); });
  }
});

app.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-mail-id], [data-folder-route], [data-person-id], [data-picker-target], [data-editor-mode]")) { event.preventDefault(); event.target.click(); }
});

async function handleConfirm(action, id) {
  closeSheet();
  if (action === "hard-delete") { await mailService.hardDelete(id); showToast("邮件已彻底删除"); await refreshSharedData(); return navigate("folder/trash"); }
  if (action === "recall") { showToast("撤回请求已提交，未读人员将按 PC 端规则处理"); return; }
  if (action === "send-without-subject") return completeSend();
  if (action === "cancel-schedule") { await mailService.cancelSchedule(id); showToast("已取消定时并转为草稿"); await refreshSharedData(); return navigate("folder/draft"); }
  if (action === "send-now") { const mail = await mailService.sendNow(id); showToast("邮件已立即发送"); await refreshSharedData(); return navigate(`detail/${mail.id}/sent`); }
}

function htmlToElement(html) {
  const template = document.createElement("template"); template.innerHTML = html.trim(); return template.content.firstElementChild;
}

window.addEventListener("hashchange", route);
window.addEventListener("pageshow", () => refreshSharedData().then(route));

app.innerHTML = `<div class="page"><div class="empty-state"><strong>正在加载内部邮件…</strong></div></div>`;
await refreshSharedData();
if (!location.hash) location.hash = "#/workbench"; else route();
