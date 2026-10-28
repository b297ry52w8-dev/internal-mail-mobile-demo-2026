export const currentUser = {
  id: "u-current",
  name: "李明",
  department: "产品研发部"
};

export const permissions = {
  canViewMail: true,
  canSendMail: true
};

// 模拟“服务端直接返回”的统一统计口径；前端不得根据列表重新计算。
export const serverFolderStats = {
  inbox: 28,
  unread: 6,
  starred: 3,
  sent: 42,
  draft: 2,
  scheduled: 1,
  trash: 8
};

export const people = [
  { id: "u-01", name: "张三", department: "产品研发部", status: "active" },
  { id: "u-02", name: "李四", department: "产品研发部", status: "active" },
  { id: "u-03", name: "王五", department: "产品研发部", status: "active" },
  { id: "u-04", name: "赵六", department: "技术支持部", status: "active" },
  { id: "u-05", name: "钱七", department: "技术支持部", status: "active" },
  { id: "u-06", name: "孙八", department: "市场部", status: "active" },
  { id: "u-07", name: "周九", department: "市场部", status: "active" },
  { id: "u-08", name: "吴十", department: "运营部", status: "active" },
  { id: "u-09", name: "郑十一", department: "运营部", status: "active" },
  { id: "u-10", name: "王十二", department: "财务部", status: "active" },
  { id: "u-11", name: "李十三", department: "人力资源部", status: "active" },
  { id: "u-12", name: "陈十四", department: "行政部", status: "active" },
  { id: "u-13", name: "刘十五", department: "法务部", status: "active" },
  { id: "u-14", name: "林敏", department: "产品研发部", status: "leaving" },
  { id: "u-15", name: "高远", department: "工程管理部", status: "active" }
];

const recipients = people.slice(1, 13);

export const mails = [
  {
    id: "m-001", folder: "inbox", senderId: "u-01", sender: "张三", senderDepartment: "产品研发部",
    subject: "关于项目进度的会议通知", summary: "各位同事：本周五下午将召开项目进度会议，请各相关负责人提前准备汇报材料。",
    body: "各位同事：\n\n本周五下午将召开项目进度会议，请各相关负责人提前准备汇报材料。\n会议时间：12月8日（周五）14:00\n会议地点：3号楼5楼会议室\n\n请准时参加。\n\n张三\n2024年12月6日",
    time: "10:24", fullTime: "2024-12-06 10:24", read: false, important: true, starred: false,
    hasAttachment: true, recipients, cc: people.slice(3, 6),
    attachments: [
      { id: "a-01", name: "项目进度汇报材料.pdf", size: "2.3 MB", type: "PDF" },
      { id: "a-02", name: "会议议程.docx", size: "1.1 MB", type: "DOCX" }
    ], history: "2024-12-03 张三：已完成会议室预约。"
  },
  {
    id: "m-002", folder: "inbox", senderId: "u-02", sender: "李四", senderDepartment: "产品研发部",
    subject: "需求评审会议纪要", summary: "附件为本次评审的会议纪要，请查看并于本周内反馈修改意见。",
    body: "各位同事：\n\n附件为本次需求评审会议纪要，请查看并于本周内反馈修改意见。\n\n谢谢。",
    time: "昨天", fullTime: "2024-12-05 16:40", read: false, important: false, starred: false,
    hasAttachment: true, recipients: people.slice(2, 7), cc: [], attachments: [{ id: "a-03", name: "需求评审纪要.pdf", size: "860 KB", type: "PDF" }], history: ""
  },
  {
    id: "m-003", folder: "inbox", senderId: "u-03", sender: "王五", senderDepartment: "产品研发部",
    subject: "系统升级安排说明", summary: "为提升系统稳定性，计划于本周末进行系统升级，请提前保存工作内容。",
    body: "为提升系统稳定性，计划于本周末进行系统升级。升级期间部分服务会短暂不可用，请提前保存工作内容。",
    time: "12-06", fullTime: "2024-12-06 09:10", read: true, important: false, starred: true,
    hasAttachment: false, recipients: people.slice(0, 9), cc: [], attachments: [], history: ""
  },
  {
    id: "m-004", folder: "inbox", senderId: "u-04", sender: "赵六", senderDepartment: "技术支持部",
    subject: "月度工作总结及下月计划", summary: "请查收本月工作总结及下月计划，如有补充请于周五前反馈。",
    body: "请查收本月工作总结及下月计划。如有补充，请于周五前反馈。",
    time: "12-05", fullTime: "2024-12-05 11:20", read: true, important: false, starred: false,
    hasAttachment: false, recipients: people.slice(0, 5), cc: [], attachments: [], history: ""
  },
  {
    id: "m-005", folder: "inbox", senderId: "u-11", sender: "人力资源部", senderDepartment: "人力资源部",
    subject: "关于优化考勤管理的通知", summary: "根据公司最新管理要求，从下月开始优化考勤管理流程。",
    body: "根据公司最新管理要求，从下月开始优化考勤管理流程，请各部门及时传达并按新制度执行。",
    time: "12-04", fullTime: "2024-12-04 16:00", read: true, important: false, starred: false,
    hasAttachment: true, recipients: people, cc: [], attachments: [{ id: "a-04", name: "考勤管理制度.pdf", size: "1.2 MB", type: "PDF" }], history: ""
  },
  {
    id: "m-006", folder: "inbox", senderId: "u-12", sender: "行政部", senderDepartment: "行政部",
    subject: "关于办公区域调整的通知", summary: "为优化办公环境，公司将于下周进行部分办公区域调整。",
    body: "为优化办公环境，公司将于下周进行部分办公区域调整，具体安排请查看附件。",
    time: "12-03", fullTime: "2024-12-03 14:10", read: true, important: false, starred: false,
    hasAttachment: false, recipients: people, cc: [], attachments: [], history: ""
  },
  {
    id: "m-007", folder: "inbox", senderId: "u-06", sender: "市场部", senderDepartment: "市场部",
    subject: "市场活动总结报告", summary: "现将本次市场活动的总结报告发送给大家，请查收。",
    body: "现将本次市场活动的总结报告发送给大家，请查收。",
    time: "12-02", fullTime: "2024-12-02 17:30", read: true, important: false, starred: false,
    hasAttachment: false, recipients: people.slice(0, 8), cc: [], attachments: [], history: ""
  },
  {
    id: "m-101", folder: "sent", senderId: "u-current", sender: "我", senderDepartment: "产品研发部",
    subject: "关于项目进度的会议通知", summary: "收件人：李四、王五等12人",
    body: "为保证项目按计划推进，请各位按时提交本周进度材料。",
    time: "10:24", fullTime: "2024-12-06 10:24", read: true, important: false, starred: false,
    hasAttachment: false, recipients, cc: [], attachments: [], readCount: 10, unreadCount: 2, failed: [],
    receiptDetails: {
      read: { total: 10, items: recipients.slice(0, 10) },
      unread: { total: 2, items: recipients.slice(10, 12) },
      failed: { total: 0, items: [] }
    }
  },
  {
    id: "m-102", folder: "sent", senderId: "u-current", sender: "我", senderDepartment: "产品研发部",
    subject: "需求评审会议纪要", summary: "收件人：张三、赵六等5人",
    body: "需求评审会议纪要已整理，请相关同事确认。",
    time: "昨天", fullTime: "2024-12-05 15:20", read: true, important: false, starred: false,
    hasAttachment: true, recipients: people.slice(0, 5), cc: [], attachments: [{ id: "a-09", name: "评审纪要.pdf", size: "980 KB", type: "PDF" }], readCount: 4, unreadCount: 1, failed: [],
    receiptDetails: {
      read: { total: 4, items: people.slice(0, 4) },
      unread: { total: 1, items: people.slice(4, 5) },
      failed: { total: 0, items: [] }
    }
  },
  {
    id: "m-103", folder: "sent", senderId: "u-current", sender: "我", senderDepartment: "产品研发部",
    subject: "系统升级安排说明", summary: "收件人：公司全员",
    body: "为提升系统稳定性，计划于本周末进行系统升级，具体安排如下。",
    time: "12-06", fullTime: "2024-12-06 10:30", read: true, important: false, starred: false,
    hasAttachment: true, recipients: people, cc: [], attachments: [{ id: "a-10", name: "系统升级计划.pdf", size: "1.5 MB", type: "PDF" }], readCount: 180, unreadCount: 76, failed: [{ name: "林敏", reason: "人员状态异常" }],
    receiptDetails: {
      read: { total: 180, items: people.slice(0, 10) },
      unread: { total: 76, items: people.slice(10) },
      failed: { total: 1, items: [{ id: "u-14-failed", name: "林敏", department: "人员状态异常", status: "active" }] }
    }
  },
  {
    id: "m-201", folder: "draft", senderId: "u-current", sender: "我", senderDepartment: "产品研发部",
    subject: "下周工作安排", summary: "草稿保存于今天 09:18",
    body: "请各位补充下周重点工作安排。", time: "09:18", fullTime: "2024-12-06 09:18",
    read: true, important: false, starred: false, hasAttachment: false, recipients: people.slice(1, 3), cc: [], attachments: []
  },
  {
    id: "m-301", folder: "scheduled", senderId: "u-current", sender: "我", senderDepartment: "产品研发部",
    subject: "项目方案确认", summary: "定时发送：2024-12-10 09:00", body: "请确认最终项目实施方案。",
    time: "12-10", fullTime: "2024-12-10 09:00", scheduledAt: "2024-12-10 09:00",
    read: true, important: false, starred: false, hasAttachment: false, recipients: people.slice(1, 3), cc: [], attachments: []
  },
  {
    id: "m-302", folder: "scheduled", senderId: "u-current", sender: "我", senderDepartment: "产品研发部",
    subject: "周报发送", summary: "定时发送：2024-12-11 08:30", body: "本周工作周报请查收。",
    time: "12-11", fullTime: "2024-12-11 08:30", scheduledAt: "2024-12-11 08:30",
    read: true, important: false, starred: false, hasAttachment: false, recipients: people, cc: [], attachments: []
  },
  {
    id: "m-401", folder: "trash", originalFolder: "inbox", senderId: "u-11", sender: "人力资源部", senderDepartment: "人力资源部",
    subject: "关于优化考勤管理的通知", summary: "此邮件已被删除，保留至 2025-06-04",
    body: "根据公司最新管理要求，从下月开始优化考勤管理流程。\n\n（此邮件已被删除，保留至 2025-06-04）",
    time: "12-04", fullTime: "2024-12-04 16:00", read: true, important: false, starred: false,
    hasAttachment: true, recipients: people, cc: [], attachments: [{ id: "a-11", name: "考勤管理制度.pdf", size: "1.2 MB", type: "PDF" }]
  }
];

export const folderDefinitions = [
  { key: "inbox", label: "收件箱", icon: "inbox" },
  { key: "unread", label: "未读邮件", icon: "mail" },
  { key: "starred", label: "星标邮件", icon: "star" },
  { key: "sent", label: "已发送", icon: "send" },
  { key: "draft", label: "草稿箱", icon: "file" },
  { key: "scheduled", label: "待发送", icon: "clock" },
  { key: "trash", label: "回收站", icon: "trash" }
];
