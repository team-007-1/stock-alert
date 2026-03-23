const axios = require("axios");

// 🧠 Products (priority order)
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

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message
    });
  } catch (err) {
    console.log("❌ Telegram error");
  }
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
      console.log(`🟢 ${product.name} → IN STOCK`);
      return true;
    }

  } catch (err) {
    console.log(`⚠️ Error checking ${product.name}`);
    return false;
  }
}

// 🧠 MAIN
(async () => {
  const now = new Date();
  const timeStr = now.toLocaleString();
  const minute = now.getMinutes();

  console.log(`⏱ Running at: ${timeStr}`);

  let found = false;

  // 🔍 Check all products
  for (const product of products) {
    const inStock = await checkStock(product);

    if (inStock) {
      found = true;

      await sendNotification(
`🟢🟢🟢 IN STOCK 🟢🟢🟢

🔥 ${product.name}
👉 ${product.url}

⚡ BUY FAST!`
      );

      break; // stop after first available
    }
  }

  // =========================
  // 🔔 HEARTBEAT SYSTEM
  // =========================

  // ✅ First run / deploy (first 2 min window)
  if (minute <= 1) {
    await sendNotification(
`⚡ Bot Started

🕒 ${timeStr}
📦 Monitoring products...`
    );
  }

  // ✅ Every ~30 min window (safe range)
  else if (minute >= 29 && minute <= 31) {
    await sendNotification(
`⚡ Bot Running

🕒 ${timeStr}`
    );
  }

})();
