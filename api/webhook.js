const crypto = require("crypto");
const { messagingApi } = require("@line/bot-sdk");

const { MessagingApiClient } = messagingApi;

const client = new MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
});

function validateSignature(body, signature) {
  const hash = crypto
    .createHmac("SHA256", process.env.CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  return hash === signature;
}

module.exports = async (req, res) => {
  // POST以外は拒否
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  // 署名検証
  const rawBody =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  const signature = req.headers["x-line-signature"];

  if (!signature || !validateSignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { events } = req.body;

  for (const event of events) {
    if (event.type !== "message" || event.message.type !== "text") {
      continue;
    }

    if (event.message.text === "動画") {
      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "video",
            originalContentUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
            previewImageUrl: "https://dummyimage.com/480x360/000/fff.jpg&text=Preview",
          },
        ],
      });
    }
  }

  return res.status(200).json({ ok: true });
};
