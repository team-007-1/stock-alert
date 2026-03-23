const axios = require("axios");

// 🔥 Your products (priority order)
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

// 🔔 Your notification (Telegram for now)
async function sendNotification(message) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("⚠️ No Telegram config, printing instead:");
    console.log(message);
    return;
  }

  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: message
  });
}

// 🔍 Check stock
async function checkStock(product) {
  try {
    const res = await axios.get(product.url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
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

// 🧠 Main logic
(async () => {
  for (const product of products) {
    const inStock = await checkStock(product);

    if (inStock) {
      await sendNotification(`🔥 ${product.name} is IN STOCK!\n${product.url}`);
      break; // stop after first available (priority)
    }
  }
})();
