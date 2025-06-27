require('dotenv').config();  // Load variables from .env (Railway Variables work automatically)

const express = require('express');
const line = require('@line/bot-sdk');
const { OpenAI } = require('openai');
const moment = require('moment-timezone');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

// Simple guard to crash early if env vars missing
if (!config.channelAccessToken) {
  console.error('❌ CHANNEL_ACCESS_TOKEN is undefined. Check Railway Variables or .env');
  process.exit(1);
}
if (!config.channelSecret) {
  console.error('❌ CHANNEL_SECRET is undefined. Check Railway Variables or .env');
  process.exit(1);
}

console.log('✅ LINE token loaded prefix:', config.channelAccessToken.slice(0, 10) + '…');

const client = new line.Client(config);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express();

const SYSTEM_PROMPT = `
You are the Ascenda Lift Thailand virtual assistant.
Promote Ascenda residential lifts only, never mention competitors.
Reply in Thai if user types Thai; reply in English otherwise.

SIZE TABLE (mm):
S  700x600  hatch 818x1056 | gate 930x1132
M  700x800  hatch 818x1256 | gate 930x1332
L  700x1000 hatch 818x1456 | gate 930x1532
XL 850x1250 hatch 1302x1382 | gate 1375x1496
`;

function isWorkingHours() {
  const now = moment().tz('Asia/Bangkok');
  return now.day() !== 0 && now.hour() >= 9 && now.hour() < 18; // Mon-Sat 09‑18
}

const installRegex = /(install|ติดตั้ง|cut[-\s]?out|hatch|gate|mezzanine|void|size|opening)/i;

app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userText = event.message.text.trim();

  // Escalate installation questions any time
  if (installRegex.test(userText)) {
    return client.replyMessage(event.replyToken, [
      { type: 'text', text: 'รายละเอียดการติดตั้งขึ้นอยู่กับพื้นที่จริง ทีมช่างจะติดต่อกลับภายใน 1 วันทำการค่ะ' },
      { type: 'text', text: 'กรุณาพิมพ์ชื่อและเบอร์โทรไว้เพื่อให้เราติดต่อกลับได้เร็วที่สุด 🙏' }
    ]);
  }

  // Business hours → hand to human
  if (isWorkingHours()) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ตอนนี้เป็นเวลาทำการ พนักงาน Ascenda จะตอบกลับคุณโดยตรงในไม่ช้า ขอบคุณค่ะ'
    });
  }

  // GPT fallback
  const gpt = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userText }
    ],
    temperature: 0.55,
    max_tokens: 400
  });

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: gpt.choices[0].message.content
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Ascenda bot v3 listening on port', port));
