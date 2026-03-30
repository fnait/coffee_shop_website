const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = String(process.env.TELEGRAM_CHAT_ID);
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const userSessions = {};
let lastUpdateId = 0;

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/images/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    const filePath = await getTelegramFilePath(fileId);
    const telegramFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    function getImageFileIdFromMessage(message) {
      if (
        message.photo &&
        Array.isArray(message.photo) &&
        message.photo.length > 0
      ) {
        const largestPhoto = message.photo[message.photo.length - 1];
        return largestPhoto.file_id;
      }

      if (
        message.document &&
        message.document.mime_type &&
        message.document.mime_type.startsWith("image/")
      ) {
        return message.document.file_id;
      }

      return null;
    }
    const imageResponse = await axios.get(telegramFileUrl, {
      responseType: "stream",
    });

    res.setHeader(
      "Content-Type",
      imageResponse.headers["content-type"] || "image/jpeg",
    );

    imageResponse.data.pipe(res);
  } catch (error) {
    console.error(
      "Image proxy error:",
      (error.response && error.response.data) || error.message,
    );
    res.status(500).json({ error: "Failed to load image" });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const orderData = req.body;

    if (
      !orderData.customerName ||
      !Array.isArray(orderData.items) ||
      orderData.items.length === 0
    ) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    const docRef = await db.collection("orders").add({
      ...orderData,
      status: "new",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const itemsText = orderData.items
      .map((item) => {
        const itemTotal = item.price * item.quantity;
        return `- ${item.name} (${item.weight} г) ×${item.quantity} = ${itemTotal} грн`;
      })
      .join("\n");

    const message = [
      "⚡ Нове замовлення ⚡",
      "",
      `Ім'я: ${orderData.customerName || "-"}`,
      `Telegram: ${orderData.telegram || "-"}`,
      `Телефон: ${orderData.phone || "-"}`,
      "",
      "Товари:",
      itemsText || "-",
      "",
      `Коментар: ${orderData.comment || "-"}`,
      `Разом: ${orderData.totalAmount || 0} грн`,
      `ID замовлення: ${docRef.id}`,
    ].join("\n");

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: ADMIN_CHAT_ID,
      text: message,
    });

    res.status(201).json({
      success: true,
      orderId: docRef.id,
    });
  } catch (error) {
    console.error(
      "Order creation error:",
      (error.response && error.response.data) || error.message,
    );

    res.status(500).json({
      success: false,
      error: "Failed to create order",
    });
  }
});

app.get("/api/about", async (req, res) => {
  try {
    const about = await getAboutContent();

    if (!about) {
      return res.status(404).json({ error: "About content not found" });
    }

    res.json(about);
  } catch (error) {
    console.error("About fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch about content" });
  }
});

app.get("/api/roasting", async (req, res) => {
  try {
    const roasting = await getRoastingContent();

    if (!roasting) {
      return res.status(404).json({ error: "Roasting content not found" });
    }

    res.json(roasting);
  } catch (error) {
    console.error("Roasting fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch roasting content" });
  }
});

app.post("/api/roasting-requests", async (req, res) => {
  try {
    const requestData = req.body;

    if (
      !requestData.name ||
      !requestData.phone ||
      !requestData.telegram ||
      !requestData.description
    ) {
      return res.status(400).json({ error: "Invalid roasting request data" });
    }

    const docRef = await db.collection("roasting_requests").add({
      ...requestData,
      status: "new",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const message = [
      "🔥 Нова заявка на обсмажку 🔥",
      "",
      `Ім'я: ${requestData.name}`,
      `Телефон: ${requestData.phone}`,
      `Telegram: ${requestData.telegram}`,
      "",
      "Опис:",
      requestData.description,
      "",
      `ID заявки: ${docRef.id}`,
    ].join("\n");

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: ADMIN_CHAT_ID,
      text: message,
    });

    res.status(201).json({
      success: true,
      requestId: docRef.id,
    });
  } catch (error) {
    console.error(
      "Roasting request creation error:",
      (error.response && error.response.data) || error.message,
    );

    res.status(500).json({
      success: false,
      error: "Failed to create roasting request",
    });
  }
});

app.post("/api/course-requests", async (req, res) => {
  try {
    const requestData = req.body;

    if (
      !requestData.name ||
      !requestData.phone ||
      !requestData.telegram ||
      !requestData.courseTitle ||
      !requestData.price
    ) {
      return res.status(400).json({ error: "Invalid course request data" });
    }

    const docRef = await db.collection("course_requests").add({
      ...requestData,
      status: "new",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const message = [
      "✨ Нова заявка на курс ✨",
      "",
      `Курс: ${requestData.courseTitle}`,
      `Ціна: ${requestData.price} грн`,
      "",
      `Ім'я: ${requestData.name}`,
      `Телефон: ${requestData.phone}`,
      `Telegram: ${requestData.telegram}`,
      `Коментар: ${requestData.comment || "-"}`,
      "",
      `ID заявки: ${docRef.id}`,
    ].join("\n");

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: ADMIN_CHAT_ID,
      text: message,
    });

    res.status(201).json({
      success: true,
      requestId: docRef.id,
    });
  } catch (error) {
    console.error(
      "Course request creation error:",
      (error.response && error.response.data) || error.message,
    );

    res.status(500).json({
      success: false,
      error: "Failed to create course request",
    });
  }
});

app.get("/api/courses", async (req, res) => {
  try {
    const snapshot = await db.collection("courses").get();

    const courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(courses);
  } catch (error) {
    console.error("Courses fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

async function sendTelegramMessage(chatId, text) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text,
  });
}

function startAddSession(chatId) {
  userSessions[chatId] = {
    mode: "add_product",
    step: "name",
    product: {},
  };
}

function startAboutSession(chatId) {
  userSessions[chatId] = {
    mode: "edit_about",
    step: "title",
    about: {},
  };
}

function startRoastingSession(chatId) {
  userSessions[chatId] = {
    mode: "edit_roasting",
    step: "description",
    roasting: {},
  };
}

function clearSession(chatId) {
  delete userSessions[chatId];
}

function getImageFileIdFromMessage(message) {
  if (
    message.photo &&
    Array.isArray(message.photo) &&
    message.photo.length > 0
  ) {
    const largestPhoto = message.photo[message.photo.length - 1];
    return largestPhoto.file_id;
  }

  if (
    message.document &&
    message.document.mime_type &&
    message.document.mime_type.startsWith("image/")
  ) {
    return message.document.file_id;
  }

  return null;
}

async function getTelegramFilePath(fileId) {
  const response = await axios.get(`${TELEGRAM_API}/getFile`, {
    params: { file_id: fileId },
  });

  return response.data.result.file_path;
}

async function saveProduct(product) {
  const docRef = await db.collection("products").add({
    ...product,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return docRef.id;
}

async function saveAboutContent(data) {
  await db
    .collection("site_content")
    .doc("about")
    .set(
      {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

async function getAboutContent() {
  const doc = await db.collection("site_content").doc("about").get();

  if (!doc.exists) {
    return null;
  }

  return doc.data();
}

async function saveRoastingContent(data) {
  await db
    .collection("site_content")
    .doc("roasting")
    .set(
      {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

async function getRoastingContent() {
  const doc = await db.collection("site_content").doc("roasting").get();

  if (!doc.exists) {
    return null;
  }

  return doc.data();
}

async function handleAddProductSession(message) {
  const chatId = String(message.chat.id);
  const session = userSessions[chatId];

  if (!session || session.mode !== "add_product") {
    return false;
  }

  if (message.text && message.text.trim() === "/cancel") {
    clearSession(chatId);
    await sendTelegramMessage(chatId, "Додавання товару відмінено.");
    return true;
  }

  if (session.step === "name") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Введіть назву товару текстом.");
      return true;
    }

    session.product.name = message.text.trim();
    session.step = "price";
    await sendTelegramMessage(
      chatId,
      "Введіть ціну товару числом, наприклад: 390",
    );
    return true;
  }

  if (session.step === "price") {
    const price = Number(message.text);

    if (!message.text || Number.isNaN(price) || price <= 0) {
      await sendTelegramMessage(
        chatId,
        "Ціна повинна бути додатним числом.",
      );
      return true;
    }

    session.product.price = price;
    session.step = "weight";
    await sendTelegramMessage(chatId, "Введіть вагу в грамах, наприклад: 250");
    return true;
  }

  if (session.step === "weight") {
    const weight = Number(message.text);

    if (!message.text || Number.isNaN(weight) || weight <= 0) {
      await sendTelegramMessage(
        chatId,
        "Вага повинна бути додатним числом.",
      );
      return true;
    }

    session.product.weight = weight;
    session.step = "description";
    await sendTelegramMessage(chatId, "Введіть опис товару.");
    return true;
  }

  if (session.step === "description") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Введіть опис текстом.");
      return true;
    }

    session.product.description = message.text.trim();
    session.step = "inStock";
    await sendTelegramMessage(
      chatId,
      'Товар в наявності? Відповідь: "так" або "ні"',
    );
    return true;
  }

  if (session.step === "inStock") {
    if (!message.text) {
      await sendTelegramMessage(chatId, 'Відповідь текстом: "так" або "ні"');
      return true;
    }

    const answer = message.text.trim().toLowerCase();

    if (answer !== "так" && answer !== "ні") {
      await sendTelegramMessage(chatId, 'Відповідь текстом: "так" або "ні"');
      return true;
    }

    session.product.inStock = answer === "так";
    session.step = "photo";
    await sendTelegramMessage(chatId, "Тепер надішліть фото товару.");
    return true;
  }

  if (session.step === "photo") {
    if (
      !message.photo ||
      !Array.isArray(message.photo) ||
      message.photo.length === 0
    ) {
      await sendTelegramMessage(
        chatId,
        "Будь ласка, надішліть саме !фото! товару.",
      );
      return true;
    }

    const largestPhoto = message.photo[message.photo.length - 1];
    session.product.imageFileId = largestPhoto.file_id;

    const productId = await saveProduct(session.product);
    const createdProduct = session.product;

    clearSession(chatId);

    await sendTelegramMessage(
      chatId,
      [
        "Товар успішно додано.",
        "",
        `ID: ${productId}`,
        `Назва: ${createdProduct.name}`,
        `Ціна: ${createdProduct.price} грн`,
        `Вага: ${createdProduct.weight} г`,
        `Опис: ${createdProduct.description}`,
        `Наявність: ${createdProduct.inStock ? "так" : "ні"}`,
        "Фото: збережено через Telegram",
      ].join("\n"),
    );

    return true;
  }

  return false;
}

async function handleTelegramCommand(message) {
  if (!message) {
    return;
  }

  const chatId = String(message.chat.id);

  if (chatId !== ADMIN_CHAT_ID) {
    await sendTelegramMessage(chatId, "Вам не дозволено використовувати цього бота.");
    return;
  }

  const handledByAddSession = await handleAddProductSession(message);
  if (handledByAddSession) {
    return;
  }

  const handledByEditSession = await handleEditProductSession(message);
  if (handledByEditSession) {
    return;
  }

  const handledByDeleteSession = await handleDeleteProductSession(message);
  if (handledByDeleteSession) {
    return;
  }

  const handledByAboutSession = await handleAboutSession(message);
  if (handledByAboutSession) {
    return;
  }

  const handledByRoastingSession = await handleRoastingSession(message);
  if (handledByRoastingSession) {
    return;
  }

  const handledByAddCourseSession = await handleAddCourseSession(message);
  if (handledByAddCourseSession) {
    return;
  }

  const handledByEditCourseSession = await handleEditCourseSession(message);
  if (handledByEditCourseSession) {
    return;
  }

  if (!message.text) {
    return;
  }

  const text = message.text.trim();

  try {
    if (text === "/start") {
      await sendTelegramMessage(
        chatId,
        [
          "Бот працює.",
          "",
          "Доступні команди:",
          "/start",
          "/products",
          "/orders",
          "/add",
          "/edit",
          "/delete",
          "/about",
          "/about_edit",
          "/course_add",
          "/course_edit",
          "/course_requests",
          "/roasting",
          "/roasting_edit",
          "/roasting_requests",
          "/cancel",
        ].join("\n"),
      );
      return;
    }

    if (text === "/products") {
      const snapshot = await db.collection("products").get();

      if (snapshot.empty) {
        await sendTelegramMessage(chatId, "Товарів поки немає.");
        return;
      }

      const productsText = snapshot.docs
        .map((doc, index) => {
          const p = doc.data();
          const stockText = p.inStock ? "в наявності" : "немає в наявності";
          return `${index + 1}. ${p.name} — ${p.price} грн, ${p.weight} г, ${stockText}`;
        })
        .join("\n");

      await sendTelegramMessage(chatId, `Товари:\n\n${productsText}`);
      return;
    }

    if (text === "/orders") {
      const snapshot = await db
        .collection("orders")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      if (snapshot.empty) {
        await sendTelegramMessage(chatId, "Заказів поки немає.");
        return;
      }

      const ordersText = snapshot.docs
        .map((doc, index) => {
          const o = doc.data();
          return `${index + 1}. ${o.customerName || "-"} — ${o.totalAmount || 0} грн — ${o.status || "new"}`;
        })
        .join("\n");

      await sendTelegramMessage(chatId, `Останні замовлення:\n\n${ordersText}`);
      return;
    }

    if (text === "/add") {
      startAddSession(chatId);
      await sendTelegramMessage(chatId, "Введіть назву товару.");
      return;
    }

    if (text === "/edit") {
      const products = await getProductsList();

      if (products.length === 0) {
        await sendTelegramMessage(chatId, "Товарів поки немає.");
        return;
      }

      startEditSession(chatId);
      userSessions[chatId].products = products;

      const productsText = products
        .map(
          (product) =>
            `${product.index}. ${product.name} — ${product.price} грн`,
        )
        .join("\n");

      await sendTelegramMessage(
        chatId,
        `Виберіть номер товару для редагування:\n\n${productsText}`,
      );

      return;
    }

    if (text === "/delete") {
      const products = await getProductsList();

      if (products.length === 0) {
        await sendTelegramMessage(chatId, "Товарів поки немає.");
        return;
      }

      startDeleteSession(chatId);
      userSessions[chatId].products = products;

      const productsText = products
        .map(
          (product) =>
            `${product.index}. ${product.name} — ${product.price} грн`,
        )
        .join("\n");

      await sendTelegramMessage(
        chatId,
        `Виберіть номер товару для видалення:\n\n${productsText}`,
      );

      return;
    }

    if (text === "/about") {
      const about = await getAboutContent();

      if (!about) {
        await sendTelegramMessage(chatId, "Блок 'Про мене' поки не заповнений.");
        return;
      }

      await sendTelegramMessage(
        chatId,
        [
          "Наявний блок 'Про мене':",
          "",
          `Заголовок: ${about.title || "-"}`,
          `Текст: ${about.text || "-"}`,
          `Фото: ${about.imageFileId ? "є" : "немає"}`,
        ].join("\n"),
      );

      return;
    }

    if (text === "/about_edit") {
      startAboutSession(chatId);
      await sendTelegramMessage(
        chatId,
        "Введіть заголовок для блока 'Про мене'.",
      );
      return;
    }

    if (text === "/course_requests") {
      const snapshot = await db
        .collection("course_requests")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      if (snapshot.empty) {
        await sendTelegramMessage(chatId, "Заявок на курси поки немає.");
        return;
      }

      const requestsText = snapshot.docs
        .map((doc, index) => {
          const r = doc.data();
          return `${index + 1}. ${r.name || "-"} — ${r.courseTitle || "-"} — ${r.price || 0} грн — ${r.status || "new"}`;
        })
        .join("\n");

      await sendTelegramMessage(
        chatId,
        `Останні заявки на курси:\n\n${requestsText}`,
      );
      return;
    }

    if (text === "/cancel") {
      clearSession(chatId);
      await sendTelegramMessage(chatId, "Активна операція скасована.");
      return;
    }

    if (text === "/course_add") {
      startAddCourseSession(chatId);
      await sendTelegramMessage(chatId, "Введіть назву курсу.");
      return;
    }

    if (text === "/course_edit") {
      const courses = await getCoursesList();

      if (courses.length === 0) {
        await sendTelegramMessage(chatId, "Курсів поки немає.");
        return;
      }

      startEditCourseSession(chatId);
      userSessions[chatId].courses = courses;

      const coursesText = courses
        .map(
          (course) => `${course.index}. ${course.title} — ${course.price} грн`,
        )
        .join("\n");

      await sendTelegramMessage(
        chatId,
        `Виберіть номер курса для редагування:\n\n${coursesText}`,
      );

      return;
    }

    if (text === "/roasting") {
      const roasting = await getRoastingContent();

      if (!roasting) {
        await sendTelegramMessage(chatId, "Блок 'Обсмажка' поки не заповнений.");
        return;
      }

      await sendTelegramMessage(
        chatId,
        [
          "Наявний блок 'Обсмажка':",
          "",
          `Назва: ${roasting.title || "-"}`,
          `Опис: ${roasting.description || "-"}`,
          `Фото: ${roasting.imageFileId ? "є" : "немає"}`,
        ].join("\n"),
      );

      return;
    }

    if (text === "/roasting_edit") {
      startRoastingSession(chatId);
      await sendTelegramMessage(
        chatId,
        "Введіть опис для блока 'Обсмажка'.",
      );
      return;
    }

    if (text === "/roasting_requests") {
      const snapshot = await db
        .collection("roasting_requests")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      if (snapshot.empty) {
        await sendTelegramMessage(chatId, "Заявок на обсмажку поки немає.");
        return;
      }

      const requestsText = snapshot.docs
        .map((doc, index) => {
          const r = doc.data();
          return `${index + 1}. ${r.name || "-"} — ${r.phone || "-"} — ${r.status || "new"}`;
        })
        .join("\n");

      await sendTelegramMessage(
        chatId,
        `Останні заявки на обсмажку:\n\n${requestsText}`,
      );
      return;
    }

    await sendTelegramMessage(
      chatId,
      "Невідома команда.\n\nДоступні:\n/start\n/products\n/orders\n/add\n/edit\n/delete\n/about\n/about_edit\n/cancel",
    );
  } catch (error) {
    console.error(
      "Telegram command error:",
      (error.response && error.response.data) || error.message,
    );

    try {
      await sendTelegramMessage(
        chatId,
        "Сталася помилка при обробці команди.",
      );
    } catch (sendError) {
      console.error(
        "Telegram send error:",
        (sendError.response && sendError.response.data) || sendError.message,
      );
    }
  }
}

async function startTelegramPolling() {
  console.log("Telegram polling started...");

  try {
    const webhookInfo = await axios.get(`${TELEGRAM_API}/getWebhookInfo`);
    console.log("Current webhook info:", webhookInfo.data);

    if (webhookInfo.data.result && webhookInfo.data.result.url) {
      await axios.get(`${TELEGRAM_API}/deleteWebhook`);
      console.log("Webhook deleted. Switching to polling.");
    }
  } catch (error) {
    console.error(
      "Webhook cleanup error:",
      (error.response && error.response.data) || error.message,
    );
  }

  while (true) {
    try {
      const response = await axios.get(`${TELEGRAM_API}/getUpdates`, {
        params: {
          offset: lastUpdateId + 1,
          timeout: 20,
        },
      });

      const updates = response.data.result || [];

      for (const update of updates) {
        lastUpdateId = update.update_id;

        if (update.message) {
          console.log("New Telegram message received");
          await handleTelegramCommand(update.message);
        }
      }
    } catch (error) {
      console.error(
        "Polling error:",
        (error.response && error.response.data) || error.message,
      );

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function updateProduct(productId, updates) {
  await db
    .collection("products")
    .doc(productId)
    .update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function getProductsList() {
  const snapshot = await db.collection("products").get();

  return snapshot.docs.map((doc, index) => ({
    index: index + 1,
    id: doc.id,
    ...doc.data(),
  }));
}

function startEditSession(chatId) {
  userSessions[chatId] = {
    mode: "edit_product",
    step: "select_product",
    products: [],
    selectedProductId: null,
    selectedField: null,
  };
}

async function deleteProduct(productId) {
  await db.collection("products").doc(productId).delete();
}

function startDeleteSession(chatId) {
  userSessions[chatId] = {
    mode: "delete_product",
    step: "select_product",
    products: [],
    selectedProductId: null,
    selectedProductName: null,
  };
}

async function handleDeleteProductSession(message) {
  const chatId = String(message.chat.id);
  const session = userSessions[chatId];

  if (!session || session.mode !== "delete_product") {
    return false;
  }

  if (message.text && message.text.trim() === "/cancel") {
    clearSession(chatId);
    await sendTelegramMessage(chatId, "Видалення товара скасовано.");
    return true;
  }

  if (session.step === "select_product") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Відправте номер товару зі списку.");
      return true;
    }

    const selectedIndex = Number(message.text.trim());

    if (
      Number.isNaN(selectedIndex) ||
      selectedIndex < 1 ||
      selectedIndex > session.products.length
    ) {
      await sendTelegramMessage(chatId, "Некоректний номер товару.");
      return true;
    }

    const selectedProduct = session.products[selectedIndex - 1];
    session.selectedProductId = selectedProduct.id;
    session.selectedProductName = selectedProduct.name;
    session.step = "confirm_delete";

    await sendTelegramMessage(
      chatId,
      [
        `Ви вибрали товар: ${selectedProduct.name}`,
        "",
        'Підтвердіть видалення: "так" або "ні"',
      ].join("\n"),
    );

    return true;
  }

  if (session.step === "confirm_delete") {
    if (!message.text) {
      await sendTelegramMessage(chatId, 'Напишіть текстом: "так" або "ні".');
      return true;
    }

    const answer = message.text.trim().toLowerCase();

    if (answer !== "так" && answer !== "ні") {
      await sendTelegramMessage(chatId, 'Напишіть текстом: "так" або "ні".');
      return true;
    }

    if (answer === "ні") {
      clearSession(chatId);
      await sendTelegramMessage(chatId, "Видалення товара скасовано.");
      return true;
    }

    await deleteProduct(session.selectedProductId);

    const deletedName = session.selectedProductName;
    clearSession(chatId);

    await sendTelegramMessage(chatId, `Товар "${deletedName}" видалено.`);
    return true;
  }

  return false;
}

async function handleEditProductSession(message) {
  const chatId = String(message.chat.id);
  const session = userSessions[chatId];

  if (!session || session.mode !== "edit_product") {
    return false;
  }

  if (message.text && message.text.trim() === "/cancel") {
    clearSession(chatId);
    await sendTelegramMessage(chatId, "Редагування товару скасовано.");
    return true;
  }

  if (session.step === "select_product") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Відправте номер товару зі списку.");
      return true;
    }

    const selectedIndex = Number(message.text.trim());

    if (
      Number.isNaN(selectedIndex) ||
      selectedIndex < 1 ||
      selectedIndex > session.products.length
    ) {
      await sendTelegramMessage(chatId, "Некоректний номер товару.");
      return true;
    }

    const selectedProduct = session.products[selectedIndex - 1];
    session.selectedProductId = selectedProduct.id;
    session.step = "select_field";

    await sendTelegramMessage(
      chatId,
      [
        `Ви вибрали товар: ${selectedProduct.name}`,
        "",
        "Що змінити?",
        "1. Назву",
        "2. Опис",
        "3. Ціну",
        "4. Наявність",
        "5. Фото",
      ].join("\n"),
    );

    return true;
  }

  if (session.step === "select_field") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Відправте номер поля від 1 до 5.");
      return true;
    }

    const fieldChoice = message.text.trim();

    const fieldMap = {
      1: "name",
      2: "description",
      3: "price",
      4: "inStock",
      5: "photo",
    };

    if (!fieldMap[fieldChoice]) {
      await sendTelegramMessage(chatId, "Виберіть номер поля від 1 до 5.");
      return true;
    }

    session.selectedField = fieldMap[fieldChoice];

    if (session.selectedField === "name") {
      session.step = "update_name";
      await sendTelegramMessage(chatId, "Введіть нове ім'я товару.");
      return true;
    }

    if (session.selectedField === "description") {
      session.step = "update_description";
      await sendTelegramMessage(chatId, "Введіть нове опис товару.");
      return true;
    }

    if (session.selectedField === "price") {
      session.step = "update_price";
      await sendTelegramMessage(chatId, "Введіть нову ціну числом.");
      return true;
    }

    if (session.selectedField === "inStock") {
      session.step = "update_inStock";
      await sendTelegramMessage(chatId, 'Введіть "так" або "ні".');
      return true;
    }

    if (session.selectedField === "photo") {
      session.step = "update_photo";
      await sendTelegramMessage(chatId, "Відправте нове фото товару.");
      return true;
    }
  }

  if (session.step === "update_name") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Введіть назву текстом.");
      return true;
    }

    await updateProduct(session.selectedProductId, {
      name: message.text.trim(),
    });

    clearSession(chatId);
    await sendTelegramMessage(chatId, "Назва товару оновлено.");
    return true;
  }

  if (session.step === "update_description") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Введіть опис текстом.");
      return true;
    }

    await updateProduct(session.selectedProductId, {
      description: message.text.trim(),
    });

    clearSession(chatId);
    await sendTelegramMessage(chatId, "Опис товару оновлено.");
    return true;
  }

  if (session.step === "update_price") {
    const price = Number(message.text);

    if (!message.text || Number.isNaN(price) || price <= 0) {
      await sendTelegramMessage(
        chatId,
        "Ціна повинна бути додатним числом.",
      );
      return true;
    }

    await updateProduct(session.selectedProductId, {
      price,
    });

    clearSession(chatId);
    await sendTelegramMessage(chatId, "Ціна товару оновлена.");
    return true;
  }

  if (session.step === "update_inStock") {
    if (!message.text) {
      await sendTelegramMessage(chatId, 'Відповідьте текстом: "так" або "ні".');
      return true;
    }

    const answer = message.text.trim().toLowerCase();

    if (answer !== "так" && answer !== "ні") {
      await sendTelegramMessage(chatId, 'Відповідьте лише: "так" або "ні".');
      return true;
    }

    await updateProduct(session.selectedProductId, {
      inStock: answer === "так",
    });

    clearSession(chatId);
    await sendTelegramMessage(chatId, "Наявність товару оновлено.");
    return true;
  }

  if (session.step === "update_photo") {
    if (
      !message.photo ||
      !Array.isArray(message.photo) ||
      message.photo.length === 0
    ) {
      await sendTelegramMessage(chatId, "Будь ласка, відправте саме фото.");
      return true;
    }

    const largestPhoto = message.photo[message.photo.length - 1];

    await updateProduct(session.selectedProductId, {
      imageFileId: largestPhoto.file_id,
    });

    clearSession(chatId);
    await sendTelegramMessage(chatId, "Фото товару оновлено.");
    return true;
  }

  return false;
}

async function handleAboutSession(message) {
  const chatId = String(message.chat.id);
  const session = userSessions[chatId];

  if (!session || session.mode !== "edit_about") {
    return false;
  }

  if (message.text && message.text.trim() === "/cancel") {
    clearSession(chatId);
    await sendTelegramMessage(
      chatId,
      "Редагрування блоку 'Про мене' відмінено.",
    );
    return true;
  }

  if (session.step === "title") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(
        chatId,
        "Введіть заголовок для блока 'Про мене'.",
      );
      return true;
    }

    session.about.title = message.text.trim();
    session.step = "text";

    await sendTelegramMessage(
      chatId,
      "Тепер відправте основний текст блока 'Про мене'.",
    );
    return true;
  }

  if (session.step === "text") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Введіть текст для блока 'Про мене'.");
      return true;
    }

    session.about.text = message.text.trim();
    session.step = "photo";

    await sendTelegramMessage(
      chatId,
      "Тепер відправте фото для блока 'Про мене'.",
    );
    return true;
  }

  if (session.step === "photo") {
    if (
      !message.photo ||
      !Array.isArray(message.photo) ||
      message.photo.length === 0
    ) {
      await sendTelegramMessage(chatId, "Будь ласка, відправте саме фото.");
      return true;
    }

    const largestPhoto = message.photo[message.photo.length - 1];
    session.about.imageFileId = largestPhoto.file_id;

    await saveAboutContent(session.about);

    clearSession(chatId);

    await sendTelegramMessage(chatId, "Блок 'Про мене' успішно оновлено.");
    return true;
  }

  return false;
}

async function handleRoastingSession(message) {
  const chatId = String(message.chat.id);
  const session = userSessions[chatId];

  if (!session || session.mode !== "edit_roasting") {
    return false;
  }

  if (message.text && message.text.trim() === "/cancel") {
    clearSession(chatId);
    await sendTelegramMessage(
      chatId,
      "Редагрування блока 'Обсмажка' відмінено.",
    );
    return true;
  }

  if (session.step === "description") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(
        chatId,
        "Введіть опис для блока 'Обсмажка'.",
      );
      return true;
    }

    session.roasting.title = "Послуга обсмажки";
    session.roasting.description = message.text.trim();
    session.step = "photo";

    await sendTelegramMessage(
      chatId,
      "Тепер відправте фото для блока 'Обсмажка'.",
    );
    return true;
  }

  if (session.step === "photo") {
    const imageFileId = getImageFileIdFromMessage(message);

    if (!imageFileId) {
      await sendTelegramMessage(
        chatId,
        "Будь ласка, відправте зображення як фото або як файл-зображення.",
      );
      return true;
    }

    session.roasting.imageFileId = imageFileId;

    await saveRoastingContent(session.roasting);

    clearSession(chatId);

    await sendTelegramMessage(chatId, "Блок 'Обсмажка' успішно оновлено.");
    return true;
  }

  return false;
}

async function saveCourse(course) {
  const docRef = await db.collection("courses").add({
    ...course,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return docRef.id;
}

async function updateCourse(courseId, updates) {
  await db
    .collection("courses")
    .doc(courseId)
    .update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function getCoursesList() {
  const snapshot = await db.collection("courses").get();

  return snapshot.docs.map((doc, index) => ({
    index: index + 1,
    id: doc.id,
    ...doc.data(),
  }));
}

function startAddCourseSession(chatId) {
  userSessions[chatId] = {
    mode: "add_course",
    step: "title",
    course: {},
  };
}

async function handleAddCourseSession(message) {
  const chatId = String(message.chat.id);
  const session = userSessions[chatId];

  if (!session || session.mode !== "add_course") {
    return false;
  }

  if (message.text && message.text.trim() === "/cancel") {
    clearSession(chatId);
    await sendTelegramMessage(chatId, "Додавання курсу відмінено.");
    return true;
  }

  if (session.step === "title") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Введіть назву курсу.");
      return true;
    }

    session.course.title = message.text.trim();
    session.step = "description";
    await sendTelegramMessage(chatId, "Введіть опис курсу.");
    return true;
  }

  if (session.step === "description") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Введіть опис курсу.");
      return true;
    }

    session.course.description = message.text.trim();
    session.step = "price";
    await sendTelegramMessage(chatId, "Введіть ціну курсу числом.");
    return true;
  }

  if (session.step === "price") {
    const price = Number(message.text);

    if (!message.text || Number.isNaN(price) || price <= 0) {
      await sendTelegramMessage(
        chatId,
        "Ціна повинна бути додатнім числом.",
      );
      return true;
    }

    session.course.price = price;
    session.step = "photo";
    await sendTelegramMessage(chatId, "Тепер відправте фото курсу.");
    return true;
  }

  if (session.step === "photo") {
    const imageFileId = getImageFileIdFromMessage(message);

    if (!imageFileId) {
      await sendTelegramMessage(
        chatId,
        "Будь ласка, відправте зображення як фото або як файл-зображення.",
      );
      return true;
    }

    session.course.imageFileId = imageFileId;

    const courseId = await saveCourse(session.course);
    const createdCourse = session.course;

    clearSession(chatId);

    await sendTelegramMessage(
      chatId,
      [
        "Курс успішно додано.",
        "",
        `ID: ${courseId}`,
        `Назва: ${createdCourse.title}`,
        `Ціна: ${createdCourse.price} грн`,
        "Фото: збережено",
      ].join("\n"),
    );

    return true;
  }

  return false;
}

function startEditCourseSession(chatId) {
  userSessions[chatId] = {
    mode: "edit_course",
    step: "select_course",
    courses: [],
    selectedCourseId: null,
    selectedField: null,
  };
}

async function handleEditCourseSession(message) {
  const chatId = String(message.chat.id);
  const session = userSessions[chatId];

  if (!session || session.mode !== "edit_course") {
    return false;
  }

  if (message.text && message.text.trim() === "/cancel") {
    clearSession(chatId);
    await sendTelegramMessage(chatId, "Редагування курсу відмінено.");
    return true;
  }

  if (session.step === "select_course") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Введіть номер курсу зі списку.");
      return true;
    }

    const selectedIndex = Number(message.text.trim());

    if (
      Number.isNaN(selectedIndex) ||
      selectedIndex < 1 ||
      selectedIndex > session.courses.length
    ) {
      await sendTelegramMessage(chatId, "Невірний номер курсу.");
      return true;
    }

    const selectedCourse = session.courses[selectedIndex - 1];
    session.selectedCourseId = selectedCourse.id;
    session.step = "select_field";

    await sendTelegramMessage(
      chatId,
      [
        `Вибраний курс: ${selectedCourse.title}`,
        "",
        "Що змінити?",
        "1. Назву",
        "2. Опис",
        "3. Ціну",
        "4. Фото",
      ].join("\n"),
    );

    return true;
  }

  if (session.step === "select_field") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Виберіть номер поля від 1 до 4.");
      return true;
    }

    const fieldChoice = message.text.trim();

    const fieldMap = {
      1: "title",
      2: "description",
      3: "price",
      4: "photo",
    };

    if (!fieldMap[fieldChoice]) {
      await sendTelegramMessage(chatId, "Виберіть номер поля від 1 до 4.");
      return true;
    }

    session.selectedField = fieldMap[fieldChoice];

    if (session.selectedField === "title") {
      session.step = "update_title";
      await sendTelegramMessage(chatId, "Введіть нову назву курсу.");
      return true;
    }

    if (session.selectedField === "description") {
      session.step = "update_description";
      await sendTelegramMessage(chatId, "Введіть новий опис курсу.");
      return true;
    }

    if (session.selectedField === "price") {
      session.step = "update_price";
      await sendTelegramMessage(chatId, "Введіть нову ціну курсу.");
      return true;
    }

    if (session.selectedField === "photo") {
      session.step = "update_photo";
      await sendTelegramMessage(chatId, "Надішліть нове фото курсу.");
      return true;
    }
  }

  if (session.step === "update_title") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Введіть нову назву курсу.");
      return true;
    }

    await updateCourse(session.selectedCourseId, {
      title: message.text.trim(),
    });

    clearSession(chatId);
    await sendTelegramMessage(chatId, "Назва курсу оновлено.");
    return true;
  }

  if (session.step === "update_description") {
    if (!message.text || !message.text.trim()) {
      await sendTelegramMessage(chatId, "Введіть новий опис курсу.");
      return true;
    }

    await updateCourse(session.selectedCourseId, {
      description: message.text.trim(),
    });

    clearSession(chatId);
    await sendTelegramMessage(chatId, "Опис курсу оновлено.");
    return true;
  }

  if (session.step === "update_price") {
    const price = Number(message.text);

    if (!message.text || Number.isNaN(price) || price <= 0) {
      await sendTelegramMessage(
        chatId,
        "Ціна повинна бути додатнім числом.",
      );
      return true;
    }

    await updateCourse(session.selectedCourseId, {
      price,
    });

    clearSession(chatId);
    await sendTelegramMessage(chatId, "Ціна курсу оновлена.");
    return true;
  }

  if (session.step === "update_photo") {
    const imageFileId = getImageFileIdFromMessage(message);

    if (!imageFileId) {
      await sendTelegramMessage(
        chatId,
        "Будь ласка, відправте зображення як фото або як файл-зображення.",
      );
      return true;
    }

    await updateCourse(session.selectedCourseId, {
      imageFileId,
    });

    clearSession(chatId);
    await sendTelegramMessage(chatId, "Фото курсу оновлено.");
    return true;
  }

  return false;
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startTelegramPolling();
});
