import { currentUser, folderDefinitions, mails as seedMails, people, permissions, serverFolderStats } from "../data/mock-mail-data.js";

const STORAGE_KEY = "smart-supervision-mail-demo-v1";
const clone = (value) => JSON.parse(JSON.stringify(value));

function loadMails() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : clone(seedMails);
  } catch {
    return clone(seedMails);
  }
}

let state = { mails: loadMails() };
const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state.mails));
const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(clone(value)), 90));

function filterByFolder(mail, folder) {
  if (folder === "unread") return mail.folder === "inbox" && !mail.read;
  if (folder === "starred") return mail.starred && mail.folder !== "trash";
  return mail.folder === folder;
}

export const mailService = {
  mode: "mock-adapter",
  async getPermissions() { return wait(permissions); },
  async getFolderDefinitions() { return wait(folderDefinitions); },
  async getFolderStats() { return wait(serverFolderStats); },
  async getRecent(limit = 5) {
    return wait(state.mails.filter((mail) => mail.folder === "inbox").slice(0, limit));
  },
  async getFolder(folder, { keyword = "", filters = {} } = {}) {
    const normalized = keyword.trim().toLowerCase();
    let result = state.mails.filter((mail) => filterByFolder(mail, folder));
    if (normalized) {
      result = result.filter((mail) => [mail.subject, mail.sender, mail.body, mail.summary].some((value) => String(value || "").toLowerCase().includes(normalized)));
    }
    if (filters.read === "unread") result = result.filter((mail) => !mail.read);
    if (filters.read === "read") result = result.filter((mail) => mail.read);
    if (filters.attachment) result = result.filter((mail) => mail.hasAttachment);
    if (filters.important) result = result.filter((mail) => mail.important);
    if (filters.starred) result = result.filter((mail) => mail.starred);
    const timestamp = (mail) => Date.parse(String(mail.fullTime || "").replace(" ", "T")) || 0;
    if (filters.timeRange && filters.timeRange !== "all" && result.length) {
      const newest = Math.max(...result.map(timestamp));
      const days = filters.timeRange === "week" ? 7 : 30;
      result = result.filter((mail) => newest - timestamp(mail) <= days * 86400000);
    }
    result.sort((a, b) => filters.sort === "asc" ? timestamp(a) - timestamp(b) : timestamp(b) - timestamp(a));
    return wait(result);
  },
  async getMail(id) {
    const mail = state.mails.find((item) => item.id === id);
    if (!mail) throw new Error("邮件不存在或已被删除");
    return wait(mail);
  },
  async getReceiptDetails(id, type) {
    const mail = state.mails.find((item) => item.id === id);
    if (!mail) throw new Error("邮件不存在或已被删除");
    const result = mail.receiptDetails?.[type] || { total: 0, items: [] };
    return wait(result);
  },
  async markRead(id, read = true) {
    const mail = state.mails.find((item) => item.id === id);
    if (mail) { mail.read = read; persist(); }
    return wait(mail);
  },
  async toggleStar(id) {
    const mail = state.mails.find((item) => item.id === id);
    if (mail) { mail.starred = !mail.starred; persist(); }
    return wait(mail);
  },
  async moveToTrash(id) {
    const mail = state.mails.find((item) => item.id === id);
    if (mail) { mail.originalFolder = mail.folder; mail.folder = "trash"; persist(); }
    return wait(mail);
  },
  async restore(id) {
    const mail = state.mails.find((item) => item.id === id);
    if (mail) { mail.folder = mail.originalFolder || "inbox"; delete mail.originalFolder; persist(); }
    return wait(mail);
  },
  async hardDelete(id) {
    state.mails = state.mails.filter((item) => item.id !== id);
    persist();
    return wait({ success: true });
  },
  async cancelSchedule(id) {
    const mail = state.mails.find((item) => item.id === id);
    if (mail) { mail.folder = "draft"; delete mail.scheduledAt; persist(); }
    return wait(mail);
  },
  async sendNow(id) {
    const mail = state.mails.find((item) => item.id === id);
    if (mail) { mail.folder = "sent"; delete mail.scheduledAt; mail.fullTime = "刚刚"; mail.time = "刚刚"; persist(); }
    return wait(mail);
  },
  async saveDraft(payload) {
    const existing = payload.id && state.mails.find((item) => item.id === payload.id);
    const next = { ...existing, ...clone(payload), id: existing?.id || `m-draft-${Date.now()}`, folder: payload.folder || "draft", sender: "我", senderId: currentUser.id, read: true };
    if (existing) Object.assign(existing, next); else state.mails.unshift(next);
    persist();
    return wait(next);
  },
  async send(payload) {
    if (!permissions.canSendMail) throw new Error("发送权限已被收回，请刷新后重试");
    if (!payload.recipients?.length) throw new Error("请选择收件人");
    if (!payload.body?.trim()) throw new Error("请输入邮件正文");
    const invalid = payload.recipients.find((person) => person.status !== "active");
    if (invalid) throw new Error(`${invalid.name} 当前不可接收邮件，请重新选择收件人`);
    const next = {
      ...clone(payload), id: `m-sent-${Date.now()}`, folder: "sent", sender: "我", senderId: currentUser.id,
      senderDepartment: currentUser.department, fullTime: "刚刚", time: "刚刚", read: true,
      summary: `收件人：${payload.recipients.slice(0, 2).map((item) => item.name).join("、")}${payload.recipients.length > 2 ? `等${payload.recipients.length}人` : ""}`,
      readCount: 0, unreadCount: payload.recipients.length, failed: []
    };
    state.mails.unshift(next); persist();
    return wait(next);
  },
  async searchPeople(keyword = "") {
    const normalized = keyword.trim().toLowerCase();
    return wait(people.filter((person) => person.status !== "left" && person.id !== currentUser.id && (!normalized || person.name.toLowerCase().includes(normalized) || person.department.toLowerCase().includes(normalized))));
  },
  async getPeople(ids = []) { return wait(people.filter((person) => ids.includes(person.id))); },
  resetDemo() { localStorage.removeItem(STORAGE_KEY); state = { mails: clone(seedMails) }; }
};
