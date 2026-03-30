const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

exports.sendNewOrderToTelegram = onDocumentCreated(
    "orders/{orderId}",
    async (event) => {
    const snap = event.data;
    ("");
    if (!snap) {
      logger.error("No document data found in event.");
      return;
    }

    const order = snap.data();

    const itemsText = (order.items || [])
      .map((item) => {
        const itemTotal = item.price * item.quantity;
        return `- ${item.name} (${item.weight} г) ×${item.quantity} = ${itemTotal} грн`;
      })
      .join("\n");

    const message = [
      "Нове замовлення",
      "",
      `Ім'я: ${order.customerName || "-"}`,
      `Telegram: ${order.telegram || "-"}`,
      `Телефон: ${order.phone || "-"}`,
      "",
      "Товари:",
      itemsText || "-",
      "",
      `Комментар: ${order.comment || "-"}`,
      `Всього: ${order.totalAmount || 0} грн`,
      `Статус: ${order.status || "new"}`,
    ].join("\n");

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
      await axios.post(url, {
        chat_id: CHAT_ID,
        text: message,
      });

      logger.info("Message sent to Telegram");
    } catch (error) {
      logger.error(
        "Telegram send error",
        (error.response && error.response.data) || error.message,
      );
    }
  },
);
