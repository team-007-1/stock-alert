const axios = require("axios");

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

async function sendNotification(message) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML"
    });
    console.log("✅ Telegram sent");
  } catch (err) {
    console.log("❌ Telegram error:", err?.response?.data || err.message);
  }
}

async function checkStock(product) {
  try {
    const query = JSON.stringify({
      filters: [{ field: "alias", value: product.alias, operator: "=" }]
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
    console.log(`📦 API response for ${product.name}:`, JSON.stringify(data).slice(0, 400));

    const item = data?.data?.[0] ?? data?.items?.[0] ?? (Array.isArray(data) ? data[0] : null);

    if (!item) {
      console.log(`⚠️ ${product.name} → No item found in response`);
      return false;
    }

    const isAvailable = item.available === true || item.available === 1;
    console.log(`${isAvailable ? "🟢" : "❌"} ${product.name} → ${isAvailable ? "IN STOCK" : "Out of stock"} (qty: ${item.inventory_quantity ?? "?"})`);
    return isAvailable;

  } catch (err) {
    console.log(`⚠️ Error checking ${product.name}:`, err?.response?.status, err?.response?.data || err.message);
    return false;
  }
}

(async () => {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const timeStr = ist.toISOString().replace("T", " ").slice(0, 19) + " IST";
  console.log(`⏱ Running at: ${timeStr}`);

  // Deploy ping on manual trigger
  if (process.env.FIRST_RUN === "true") {
    await sendNotification(`🚀 <b>Bot Deployed!</b>\n🕒 ${timeStr}\n▶️ Watching: Rose Lassi &amp; Plain Lassi`);
    return;
  }

  // Check all products
  let anyInStock = false;
  for (const product of products) {
    const inStock = await checkStock(product);
    if (inStock) {
      anyInStock = true;
      await sendNotification(
`🟢🟢🟢 <b>IN STOCK!</b> 🟢🟢🟢
🔥 <b>${product.name}</b>
👉 ${product.url}
⚡ BUY FAST!`
      );
    }
  }

  if (anyInStock) return;

  // Heartbeat — only at minute 0 or 30
  const minute = ist.getMinutes();
  if (minute === 0 || minute === 30) {
    await sendNotification(`⚡ <b>Bot Active</b>\n🕒 ${timeStr}\n🔍 Both products still out of stock`);
  }
})();
