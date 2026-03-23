const axios = require("axios");

// =========================
// 🧠 PRODUCTS
// =========================
const products = [
  {
    name: "Rose Lassi",
    alias: "amul-high-protein-rose-lassi-200-ml-or-pack-of-30",
    url: "https://shop.amul.com/en/product/amul-high-protein-rose-lassi-200-ml-or-pack-of-30"
  },
  {
    name: "Plain Lassi",
    alias: "amul-high-protein-plain-lassi-200-ml-or-pack-of-30",
    url: "https://shop.amul.com/en/product/amul-high-protein-plain-lassi-200-ml-or-pack-of-30"
  }
];

// =========================
// 🔔 TELEGRAM
// =========================
async function sendNotification(message) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML"
    });
    console.log("✅ Telegram message sent");
  } catch (err) {
    console.log("❌ Telegram error:", err?.response?.data || err.message);
  }
}

// =========================
// 🔍 STOCK CHECK via Amul API
// =========================
async function checkStock(product) {
  try {
    // Use Amul's internal JSON API - NOT the HTML page
    const query = JSON.stringify({
      filters: [
        { field: "alias", value: product.alias, operator: "=" }
      ]
    });

    const apiUrl = `https://shop.amul.com/api/1/entity/ms.products?q=${encodeURIComponent(query)}&fields=available,alias,name,inventory_quantity&limit=1`;

    const res = await axios.get(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://shop.amul.com/"
      },
      timeout: 10000
    });

    const data = res.data;
    console.log(`📦 API response for ${product.name}:`, JSON.stringify(data).slice(0, 300));

    // The API returns { data: [ { available: true/false, ... } ] }
    const item = data?.data?.[0] || data?.items?.[0] || (Array.isArray(data) ? data[0] : null);

    if (!item) {
      console.log(`⚠️ ${product.name} → No item found in API response`);
      return false;
    }

    const isAvailable = item.available === true || item.available === 1;
    const qty = item.inventory_quantity ?? "?";

    if (isAvailable) {
      console.log(`🟢 ${product.name} → IN STOCK (qty: ${qty})`);
    } else {
      console.log(`❌ ${product.name} → Out of stock`);
    }

    return isAvailable;

  } catch (err) {
    const status = err?.response?.status;
    const msg = err?.response?.data || err.message;
    console.log(`⚠️ Error checking ${product.name} [${status}]:`, msg);
    return false;
  }
}

// =========================
// 🧠 MAIN
// =========================
(async () => {
  const now = new Date();
  // Use IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const timeStr = ist.toISOString().replace("T", " ").slice(0, 19) + " IST";

  console.log(`⏱ Running at: ${timeStr}`);

  // =========================
  // 🔔 DEPLOY PING
  // Check if this is the very first run (passed via env)
  // =========================
  if (process.env.FIRST_RUN === "true") {
    await sendNotification(
`🚀 <b>Bot Deployed!</b>
🕒 ${timeStr}
▶️ Monitoring started for Rose Lassi &amp; Plain Lassi`
    );
    return; // Don't check stock on deploy ping
  }

  // =========================
  // 🔍 CHECK PRODUCTS
  // =========================
  let anyInStock = false;
  for (const product of products) {
    const inStock = await checkStock(product);
    if (inStock) {
      anyInStock = true;
      await sendNotification(
`🟢🟢🟢 <b>IN STOCK!</b> 🟢🟢🟢
🔥 <b>${product.name}</b>
👉 ${product.url}
⚡ BUY FAST before it sells out!`
      );
      // Don't return — check both products and notify for each
    }
  }

  if (anyInStock) return; // Skip heartbeat if stock alert was sent

  // =========================
  // 🔔 HEARTBEAT — every 30 mins only
  // =========================
  const minute = ist.getMinutes();
  const second = ist.getSeconds();

  // Only send heartbeat at minute 0 or 30, and only in first 2 seconds
  // This prevents duplicate sends across 2-min cron runs
  if ((minute === 0 || minute === 30) && second < 120) {
    await sendNotification(
`⚡ <b>Bot Active</b>
🕒 ${timeStr}
🔍 Checking every 2 min — products still out of stock`
    );
  }
})();
