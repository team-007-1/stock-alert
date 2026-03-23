const axios = require("axios");

// 🧠 Products
const products = [
  {
    name: "Rose Lassi",
    url: "https://shop.amul.com/en/product/amul-high-protein-rose-lassi-200-ml-or-pack-of-30"
  },
  {
    name: "Plain Lassi",
    url: "https://shop.amul.com/en/product/amul-high-protein-plain-lassi-200-ml-or-pack-of-30"
  }
];

// 🔔 Telegram
async function sendNotification(message) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: message
  });
}

// 🔍 Check stock
async function checkStock(product) {
  try {
    const res = await axios.get(product.url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = res.data;

    if (html.includes("Sold Out")) {
      console.log(`❌ ${product.name} → Out of stock`);
      return false;
    } else {
      console.log(`🔥 ${product.name} → IN STOCK`);
      return true;
    }
  } catch (err) {
    console.log(`⚠️ Error checking ${product.name}`);
    return false;
  }
}

// 🧠 MAIN
(async () => {
  const now = new Date().toLocaleString();
  console.log(`⏱ Running at: ${now}`);

  let found = false;

  for (const product of products) {
    const inStock = await checkStock(product);

    if (inStock) {
      found = true;
      await sendNotification(`🚨🚨🚨 IN STOCK 🚨🚨🚨\n${product.name}\n${product.url}`);
      break;
    }
  }

  // 🟢 Heartbeat logic (every hour)
  const minute = new Date().getMinutes();

  if (minute === 0) {
    await sendNotification(`✅ Bot Running\nTime: ${now}`);
  }
})();
