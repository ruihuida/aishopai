import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.static(path.join(__dirname, "public")));

const DATA_DIR = path.join(__dirname, "data");
const files = {
  stores: path.join(DATA_DIR, "stores.json"),
  knowledge: path.join(DATA_DIR, "knowledge.json"),
  users: path.join(DATA_DIR, "users.json"),
  cases: path.join(DATA_DIR, "cases.json"),
  history: path.join(DATA_DIR, "history.json"),
};

function ensure(file, fallback) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2), "utf-8");
}

Object.values(files).forEach(file => ensure(file, []));

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

async function callAI(prompt, system = "你是中国电商AI运营管家。") {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.AI_BASE_URL || "https://api.gptsapi.net/v1";
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  if (!apiKey || apiKey.includes("你的")) {
    return fallbackAI(prompt);
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.65,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI接口错误：${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "AI没有返回有效内容。";
}

function fallbackAI(prompt) {
  if (prompt.includes("竞品")) {
    return `【竞品情报分析】\n\n一、价格分析\n竞品价格集中在中低价区间，建议不要直接硬拼最低价，而是突出材质、工艺、现货、定制能力。\n\n二、销量/笔数判断\n头部竞品可能依靠低价和强主图获得点击，建议重点观察其前三张主图、标题关键词和促销信息。\n\n三、主图分析\n建议主图更干净，主体更大，卖点不要堆太多，突出“厂家直供、现货、支持定制、批发优惠”。\n\n四、行动建议\n1. 重做前三张主图。\n2. 调整标题关键词。\n3. 增加详情页中的交期、MOQ、包装和工厂实力。\n4. 建立阶梯报价话术。`;
  }

  if (prompt.includes("成交") || prompt.includes("聊天")) {
    return `【AI成交分析】\n\n客户类型：价格敏感型 / 观望型。\n成交概率：中等。\n\n当前问题：过早报价，客户还没有明确采购数量、用途和交期。\n\n推荐回复：\n老板，价格主要看采购数量、规格和是否需要定制。您这边预计采购多少个？是现货用还是长期补货？我可以根据您的数量帮您核一个更合适的批发合作价。\n\n下一步动作：\n1. 先问数量。\n2. 再问用途。\n3. 给阶梯报价。\n4. 24小时后追单。`;
  }

  if (prompt.includes("视频")) {
    return `【AI短视频工作流】\n\nScene 1｜0-3秒\n镜头：产品近景慢推。\n字幕：这个产品让空间氛围感直接提升。\n转场：淡入。\n\nScene 2｜3-6秒\n镜头：细节特写，展示材质与工艺。\n字幕：树脂彩绘工艺，细节更立体。\n转场：快速切换。\n\nScene 3｜6-10秒\n镜头：场景摆放效果。\n字幕：适合家居、节日、礼品店陈列。\n转场：推拉变焦。\n\nScene 4｜10-15秒\n镜头：包装/尺寸/批发信息。\n字幕：支持批发、现货、定制。\nCTA：需要报价直接咨询。`;
  }

  if (prompt.includes("素材") || prompt.includes("主图")) {
    return `【AI素材工作流方案】\n\n一、产品识别\n产品适合做电商主图、详情页、场景图和广告图。\n\n二、主图建议\n1. 白底主图：主体居中，边缘干净。\n2. 卖点主图：突出厂家直供、现货、支持定制。\n3. 场景主图：欧美家居/节日氛围。\n4. 尺寸图：标注尺寸、包装、使用场景。\n\n三、Prompt建议\n高端电商产品摄影，干净背景，主体清晰，柔和光影，适合Amazon主图和详情页展示。`;
  }

  if (prompt.includes("【诊断模式】首次诊断")) {
    return `【首次店铺诊断建档】

一、首次诊断结论
这是本店铺第一次进入AI运营管家，本次不检查昨日任务，而是先建立店铺运营基线。当前重点不是马上判断执行好坏，而是先确认店铺的核心短板：点击率、转化率、询盘承接和广告ROI。

二、当前数据问题分析
1. 如果点击率偏低，优先检查主图、标题和价格展示。
2. 如果询盘有增长但转化不足，优先检查报价话术和客户跟进。
3. 如果ROI下降，不建议盲目加广告预算，应先修复主图、详情页和客服承接。

三、今日优先处理的3件事
1. 建立当前数据基线：记录GMV、询盘、CTR、CVR、ROI。
2. 找出最影响成交的一个环节，不要同时改太多变量。
3. 制定下次复盘检查项，方便系统判断执行效果。

四、7天周期计划
第1天：确认主推商品和核心问题。
第2天：优化前三张主图和标题关键词。
第3天：补充详情页中的交期、MOQ、包装、定制和工厂实力。
第4天：整理客户嫌贵、问最低价、问交期的话术。
第5天：跟进报价后未回复客户。
第6天：复盘广告ROI和询盘转化。
第7天：根据数据变化制定下一轮优化计划。

五、下次复盘需要检查的指标
- 点击率是否提升。
- 询盘量是否提升。
- 报价后客户回复率是否提升。
- 广告ROI是否改善。

六、给客户的反馈
这是第一次建档，不要追求一次解决所有问题。先把基线建立起来，下一次系统会根据本次计划和新数据判断执行效果。`;
  }

  return `【AI店铺复盘诊断】

一、上次计划执行检查
系统已读取上次诊断记录。本次应重点查看客户是否反馈了执行情况，以及今日数据是否与上次计划方向一致。

二、今日数据与上次数据对比
如果GMV或询盘提升但转化率下降，说明流量进来了，但成交承接仍然不足；如果ROI下降，说明广告投放效率需要复盘。

三、执行效果判断
如果客户未反馈任务完成情况，不能默认判断已完成或未完成，应标记为“未反馈”，并要求客户补充实际执行动作。

四、今日优先任务
1. 复盘上次计划完成度。
2. 对比今日与上次数据变化。
3. 根据未完成动作调整今日任务。

五、新的7天周期计划
第1天：检查上次计划执行情况。
第2天：修复未完成任务。
第3天：根据数据变化优化主图或话术。
第4天：跟进未回复客户。
第5天：复盘广告ROI。
第6天：沉淀有效动作。
第7天：生成下一轮优化方向。`;
}

function scoreKnowledge(item, searchText) {
  const text = JSON.stringify(item).toLowerCase();
  const words = String(searchText || "")
    .toLowerCase()
    .split(/[\s,，。！!？?、/]+/)
    .filter(Boolean);
  let score = item.priority === "高" ? 20 : 5;
  words.forEach(word => {
    if (word.length >= 2 && text.includes(word)) score += 10;
  });
  return score;
}

function relatedKnowledge(searchText) {
  return readJSON(files.knowledge)
    .map(item => ({ ...item, score: scoreKnowledge(item, searchText) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function spendCredits(amount) {
  const users = readJSON(files.users);
  const user = users[0] || { account: "boss", credits: 0 };
  user.credits = Math.max(0, Number(user.credits || 0) - amount);
  if (!users[0]) users.push(user);
  writeJSON(files.users, users);
  return user.credits;
}

function getStoreHistory(storeId) {
  return readJSON(files.history)
    .filter(item => item.storeId === storeId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function enrichStore(store) {
  const records = getStoreHistory(store.id);
  return {
    ...store,
    historyCount: records.length,
    lastDiagnosis: records[0] || null,
  };
}

function buildNextReviewItems(store, problem = "") {
  const text = `${problem} ${store?.platform || ""} ${store?.storeName || ""}`;
  const items = [];

  if (/主图|点击|CTR|曝光|标题/.test(text)) {
    items.push("检查前三张主图是否已优化，并记录点击率变化");
  }

  if (/询盘|报价|不回复|嫌贵|客户|成交/.test(text)) {
    items.push("统计报价后未回复客户跟进数量与回复率变化");
  }

  if (/ROI|广告|投放|关键词/.test(text)) {
    items.push("复盘广告ROI、低转化关键词和预算调整结果");
  }

  if (/详情|交期|MOQ|定制|包装|质量/.test(text)) {
    items.push("检查详情页是否补充交期、MOQ、定制、包装和工厂实力");
  }

  if (!items.length) {
    items.push("记录今日核心动作和明日数据变化");
    items.push("检查询盘、点击率、转化率和ROI是否有改善");
    items.push("反馈客户跟进、主图优化或详情页优化的执行情况");
  }

  return items.slice(0, 5);
}

app.get("/api/me", (req, res) => {
  const users = readJSON(files.users);
  res.json(users[0] || { account: "boss", credits: 0 });
});

app.get("/api/stores", (req, res) => {
  res.json(readJSON(files.stores).map(enrichStore));
});

app.post("/api/stores/authorize", (req, res) => {
  const { platform = "1688", storeName = "新授权店铺" } = req.body;
  const stores = readJSON(files.stores);
  const count = stores.filter(s => s.platform === platform).length;
  if (count >= 100) {
    return res.status(400).json({ error: "当前平台授权店铺已达到100个上限。" });
  }
  const item = {
    id: `${platform}_${Date.now()}`,
    platform,
    storeName,
    accountName: storeName,
    authorized: true,
    lastSync: new Date().toLocaleString(),
    dataScope: ["商品", "订单", "询盘", "售后", "库存", "广告"],
    today: { gmv: 18600, orders: 28, inquiries: 72, ctr: 2.3, cvr: 1.1, roi: 2.0, refundRate: 1.2 },
    yesterday: { gmv: 15200, orders: 24, inquiries: 61, ctr: 2.6, cvr: 1.4, roi: 2.3, refundRate: 1.0 },
    createdAt: new Date().toLocaleString(),
  };
  stores.push(item);
  writeJSON(files.stores, stores);
  res.json(item);
});

app.post("/api/stores/:id/sync", (req, res) => {
  const stores = readJSON(files.stores);
  const store = stores.find(s => s.id === req.params.id);
  if (!store) return res.status(404).json({ error: "店铺不存在" });
  store.yesterday = store.today;
  store.today = {
    gmv: Math.round(18000 + Math.random() * 15000),
    orders: Math.round(20 + Math.random() * 60),
    inquiries: Math.round(60 + Math.random() * 160),
    ctr: Number((1.6 + Math.random() * 2.2).toFixed(1)),
    cvr: Number((0.8 + Math.random() * 1.6).toFixed(1)),
    roi: Number((1.4 + Math.random() * 2.8).toFixed(1)),
    refundRate: Number((0.8 + Math.random() * 2).toFixed(1)),
  };
  store.lastSync = new Date().toLocaleString();
  writeJSON(files.stores, stores);
  res.json(store);
});

app.get("/api/history/:storeId", (req, res) => {
  res.json(getStoreHistory(req.params.storeId));
});

app.get("/api/knowledge", (req, res) => {
  res.json(readJSON(files.knowledge));
});

app.post("/api/knowledge", (req, res) => {
  const list = readJSON(files.knowledge);
  const item = { id: `k_${Date.now()}`, createdAt: new Date().toLocaleString(), ...req.body };
  list.unshift(item);
  writeJSON(files.knowledge, list);
  res.json(item);
});

app.post("/api/diagnosis", async (req, res) => {
  try {
    const stores = readJSON(files.stores);
    const store = stores.find(s => s.id === req.body.storeId);
    const previousRecords = store ? getStoreHistory(store.id) : [];
    const lastRecord = previousRecords[0] || null;
    const isFirstDiagnosis = previousRecords.length === 0;
    const executionFeedback = req.body.executionFeedback || "";
    const knowledge = relatedKnowledge(`${req.body.problem || ""} ${store?.platform || ""} ${store?.storeName || ""}`);
    const nextReviewItems = buildNextReviewItems(store, req.body.problem || "");

    const prompt = `
你是中国电商AI运营总监。请根据店铺同步数据、历史诊断记录和客户今天遇到的问题做复盘诊断。

【诊断模式】${isFirstDiagnosis ? "首次诊断" : "历史复盘"}

【重要规则】
1. 如果是首次诊断，绝对不要写“昨日任务检查”或“上次计划完成情况”，只能写“首次建档、当前基线、今日任务、7天计划、下次复盘检查项”。
2. 如果有历史记录，才能检查上次计划；没有客户反馈时，必须写“未反馈”，不能编造已完成或未完成。
3. 诊断必须结合今日/昨日数据变化，但不要假装知道客户实际做了什么。

【店铺数据】
${JSON.stringify(store || req.body, null, 2)}

【是否首次诊断】
${isFirstDiagnosis ? "是，这是该店铺第一次诊断，需要建立运营基线。" : "否，本次需要读取上次诊断记录并做复盘。"}

【上次诊断记录】
${lastRecord ? JSON.stringify(lastRecord, null, 2) : "暂无上次诊断记录。"}

【客户反馈的上次计划完成情况】
${executionFeedback || (isFirstDiagnosis ? "首次诊断，无需填写。" : "客户未反馈，必须标记为未反馈。")}

【用户今天遇到的问题】
${req.body.problem || "未填写"}

【命中的导师知识】
${JSON.stringify(knowledge, null, 2)}

请按下面结构输出：
${isFirstDiagnosis ? `
一、首次店铺诊断建档
二、当前数据问题分析
三、今日最优先处理的3件事
四、7天周期计划
五、下次复盘需要检查的指标
六、需要客户下次反馈的执行动作
七、给客户的鼓励和提醒
` : `
一、上次计划执行检查
二、今日数据与上次数据对比
三、执行效果判断
四、当前新问题
五、今日优先任务
六、新的7天周期计划
七、给客户的评价和鼓励
`}`;

    const result = await callAI(prompt);
    const remainingCredits = spendCredits(2);

    const history = readJSON(files.history);
    const record = {
      id: `diag_${Date.now()}`,
      storeId: store?.id || req.body.storeId || "manual",
      storeName: store?.storeName || "手动诊断",
      platform: store?.platform || req.body.platform || "未知平台",
      createdAt: new Date().toLocaleString(),
      mode: isFirstDiagnosis ? "首次诊断" : "历史复盘",
      storeSnapshot: store || req.body,
      problem: req.body.problem || "",
      executionFeedback,
      nextReviewItems,
      result,
      relatedKnowledgeCount: knowledge.length,
    };
    history.unshift(record);
    writeJSON(files.history, history);

    res.json({
      result,
      mode: record.mode,
      nextReviewItems,
      relatedKnowledgeCount: knowledge.length,
      relatedKnowledge: knowledge,
      remainingCredits,
    });
  } catch (error) {
    res.status(500).json({ result: `AI诊断失败：${error.message}`, remainingCredits: null });
  }
});

app.post("/api/competitor", async (req, res) => {
  const prompt = `你是电商竞品分析专家。根据用户粘贴的竞品截图/描述，分析价格、销量、销售笔数、主图风格、关键词和优化建议。\n${JSON.stringify(req.body).slice(0, 6000)}`;
  const result = await callAI(prompt);
  res.json({ result, remainingCredits: spendCredits(3) });
});

app.post("/api/creative", async (req, res) => {
  const prompt = `你是电商AI素材工作流专家。根据产品图/提示词，生成图生图、文生图、参考图生图、主图、详情页、场景图、Banner的工作流方案。\n${JSON.stringify(req.body).slice(0, 6000)}`;
  const result = await callAI(prompt);
  res.json({ result, remainingCredits: spendCredits(5) });
});

app.post("/api/video", async (req, res) => {
  const prompt = `你是电商短视频导演。根据产品图/产品信息，生成短视频工作流：产品识别、脚本、分镜、秒数、转场、字幕、BGM、口播、剪映/CapCut导出建议。\n${JSON.stringify(req.body).slice(0, 6000)}`;
  const result = await callAI(prompt);
  res.json({ result, remainingCredits: spendCredits(8) });
});

app.post("/api/sales", async (req, res) => {
  const prompt = `你是AI成交作战顾问。根据聊天截图/聊天内容和标签，分析客户心理、成交概率、问题点、回复策略和下一步动作。\n${JSON.stringify(req.body).slice(0, 6000)}`;
  const result = await callAI(prompt);
  res.json({ result, remainingCredits: spendCredits(2) });
});

app.post("/api/mentor/case", (req, res) => {
  const list = readJSON(files.cases);
  const item = { id: `case_${Date.now()}`, createdAt: new Date().toLocaleString(), ...req.body };
  list.unshift(item);
  writeJSON(files.cases, list);
  res.json(item);
});

app.post("/api/credits/recharge", (req, res) => {
  const { amount = 100 } = req.body;
  const users = readJSON(files.users);
  const user = users[0] || { account: "boss", credits: 0 };
  user.credits = Number(user.credits || 0) + Number(amount);
  if (!users[0]) users.push(user);
  writeJSON(files.users, users);
  res.json({ credits: user.credits });
});

app.post("/api/auth/code", (req, res) => {
  res.json({ ok: true, message: "验证码已发送。当前为页面演示，后续接入阿里云短信/SMTP邮箱。", code: "123456" });
});

app.post("/api/auth/realname", (req, res) => {
  res.json({ ok: true, status: "认证中", message: "实名资料已提交，后续接入真实认证服务。" });
});

app.get("*", (req, res) => {
  const target = req.path.includes("dashboard") ? "dashboard.html" : "index.html";
  res.sendFile(path.join(__dirname, "public", target));
});

app.listen(PORT, () => {
  console.log(`AI电商运营管家已启动：http://localhost:${PORT}`);
});
