import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

console.log("[Server] Starting initialization...");

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

const app = express();
const PORT = 3000;

app.use(express.json());

// Google Sheets Configuration
const CHATS_LOG_SPREADSHEET_ID = "1dEPsxN9ApmAw-lYpGtIZy9gFBTU1ZXMLfC7kqsmjjD8";
const FEEDBACK_SPREADSHEET_ID = "1_pqTb2M8bGrEK2lzaMAZeFLR4wrwkfCYIm7SfoKKCcg";

let sheetsClient: any = null;

async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
  }

  if (!clientEmail || !privateKey) {
    throw new Error("Google Service Account credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY) are missing.");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

const FAQ_SPREADSHEET_ID = "19MOB7haF0D97sWTebuo0Q4E9d_vVy_SHWAt58GZQDzk";
const PRICE_SPREADSHEET_ID = "1ryq0AloXjE-FXCz5_BkB8erYrVr8fvzr3SnOg42KTvc";
const SCHEDULE_SPREADSHEET_ID = "1whc-vJNHIOhJhnT9Sf-eS5l88AbDqF1BAxwNkaKjiEU";

const GARAGE_MAP: Record<string, string> = {
  "Слесарный ремонт и ТО": "Слесарный ремонт и ТО",
  "Электрика и диагностика": "Электрика и диагностика",
  "Детейлинг и покрытия": "Детейлинг и покрытия"
};

const BOXES = ["Бокс А", "Бокс Б", "Бокс В"];

function resolveGarage(category: string) {
  if (!category) return null;
  const normalized = category.toLowerCase().trim();
  
  // Try exact match first
  if (GARAGE_MAP[category]) return GARAGE_MAP[category];

  for (const [key, value] of Object.entries(GARAGE_MAP)) {
    const keyLower = key.toLowerCase();
    if (normalized === keyLower || keyLower.includes(normalized) || normalized.includes(keyLower)) {
      return value;
    }
  }
  return null;
}

async function getAppointments(date: string, garage?: string, box?: string, endDate?: string) {
  const sheets = await getSheetsClient();
  let rows: any[] = [];
  const rangeToFetch = `A1:Z10000`; // Increased range to handle more data
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: `booking!${rangeToFetch}`,
    });
    rows = response.data.values || [];
  } catch (e) {
    // Fallback to other common names
    const fallbacks = ['Sheet1', 'schedule', 'Лист1', 'записи', 'Sheet 1', 'Worksheet'];
    for (const name of fallbacks) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SCHEDULE_SPREADSHEET_ID,
          range: `${name}!${rangeToFetch}`,
        });
        const r = response.data.values || [];
        if (r.length > 0) {
          rows = r;
          console.log(`[Admin] Data found in fallback sheet: "${name}"`);
          break;
        }
      } catch (err) {}
    }
  }

  if (rows.length === 0) {
    console.error("[Admin] No data found in any sheet range");
    return [];
  }

  // Determine if first row is a header
  // If first cell of first row is NOT a number and looks like a word, it's probably a header
  const firstRow = rows[0];
  const isHeader = firstRow && firstRow[0] && isNaN(parseInt(firstRow[0])) && firstRow[0].toString().length > 2;
  const dataRows = isHeader ? rows.slice(1) : rows;
  
  // Filter by date range
  let filtered = dataRows.filter((row: any) => {
    let rowDate = (row[1] || "").toString().trim();
    if (!rowDate) return false;

    // Remove time if present (e.g. "01.05.2026, 12:00:00" -> "01.05.2026")
    if (rowDate.includes(',') || rowDate.includes(' ')) {
      rowDate = rowDate.split(/[ ,]/)[0];
    }

    let isoRowDate = rowDate;
    // Handle DD.MM.YYYY
    if (rowDate.includes('.')) {
      const parts = rowDate.split('.');
      if (parts.length === 3) {
        let [d, m, y] = parts;
        if (y.length === 2) y = "20" + y;
        isoRowDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    
    if (endDate && endDate !== "undefined" && endDate !== "null") {
      return isoRowDate >= date.trim() && isoRowDate <= endDate.trim();
    }
    
    // Handle ISO YYYY-MM-DD
    return isoRowDate === date.trim();
  });

  // Normalize mapping to ensure consistent format for client
  let mapped = filtered.map((row: any) => {
    // Normalize time: "9:00" -> "09:00", "9:0" -> "09:00"
    let timeRaw = (row[2] || "").toString().trim();
    if (timeRaw && !timeRaw.includes(':')) {
       timeRaw += ":00";
    }
    if (timeRaw && timeRaw.includes(':')) {
      const [h, m] = timeRaw.split(':');
      timeRaw = `${h.padStart(2, '0')}:${(m || '00').padEnd(2, '0').slice(0, 2)}`;
    }

    return [
      row[0] || "", // ID
      row[1] || "", // Date
      timeRaw,     // Time (Normalized)
      (row[3] || "").toString().trim(), // Garage
      (row[4] || "").toString().trim(), // Box
      row[5] || "", // Service
      row[6] || "1", // Duration
      row[7] || "Confirmed", // Status
      row[8] || "", 
      row[9] || "",
      row[10] || "",
      row[11] || "",
      row[12] || "",
      row[13] || "",
      row[14] || "",
      row[15] || "",
    ];
  });

  if (garage && garage !== "undefined") {
    // Case-insensitive flexible check for garage
    const target = garage.toLowerCase().trim();
    mapped = mapped.filter((app: any) => {
      const appGarage = app[3].toLowerCase().trim();
      return appGarage === target || appGarage.includes(target) || target.includes(appGarage);
    });
  }

  if (box && box !== "undefined" && box !== "Все") {
    const targetBox = box.toLowerCase().trim();
    mapped = mapped.filter((app: any) => {
      const appBox = (app[4] || "").toLowerCase().trim();
      return appBox === targetBox || appBox.includes(targetBox) || targetBox.includes(appBox);
    });
  }

  return mapped;
}

async function getNextOrderId() {
  const sheets = await getSheetsClient();
  let maxId = 0;
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SCHEDULE_SPREADSHEET_ID,
    range: `booking!A:A`,
  });
  const ids = res.data.values?.slice(1).map((r: any) => parseInt(r[0])).filter((n: any) => !isNaN(n)) || [];
  if (ids.length > 0) {
    maxId = Math.max(maxId, ...ids);
  }
  
  return maxId + 1;
}

async function getServiceDuration(serviceName: string) {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: PRICE_SPREADSHEET_ID,
      range: "C2:E100", // C: Услуга, E: Время обслуживания
    });
    const rows = response.data.values || [];
    const row = rows.find(r => r[0]?.trim() === serviceName.trim());
    if (!row || !row[2]) return 1;
    
    const durStr = row[2].toLowerCase();
    const num = parseInt(durStr.match(/\d+/)?.[0] || "1");
    if (durStr.includes("мин")) return Math.ceil(num / 60);
    return num;
  } catch (err) {
    return 1;
  }
}

function formatPhoneNumber(rawPhone: string) {
  const digits = rawPhone.replace(/\D/g, "");
  let clean = "";
  
  if (digits.length === 11) {
    if (digits.startsWith("7") || digits.startsWith("8")) {
      clean = "7" + digits.substring(1);
    }
  } else if (digits.length === 10 && digits.startsWith("9")) {
    clean = "7" + digits;
  }

  if (clean.length !== 11) {
    return rawPhone;
  }

  return `${clean[0]}-(${clean.substring(1, 4)})-${clean.substring(4, 7)}-${clean.substring(7, 9)}-${clean.substring(9, 11)}`;
}

// API Routes
app.get("/api/schedule/slots", async (req, res) => {
  try {
    const { date, serviceCategory, serviceName } = req.query;
    if (!date || !serviceCategory) return res.json([]);

    const garage = resolveGarage(serviceCategory as string);
    if (!garage) return res.json([]);

    const duration = serviceName ? await getServiceDuration(serviceName as string) : 1;
    const appointments = await getAppointments(date as string, garage);
    
    const startHour = 9;
    const endHour = 21;
    const availableSlots = [];

    for (let h = startHour; h <= endHour - duration; h++) {
      const hStr = `${h}:00`;
      
      for (const box of BOXES) {
        let isBoxFree = true;
        for (let i = 0; i < duration; i++) {
          const slotHour = h + i;
          const isSlotOccupied = appointments.some((app: any) => {
            const appStart = parseInt(app[2]);
            const appDuration = parseInt(app[6] || "1");
            return app[4] === box && slotHour >= appStart && slotHour < (appStart + appDuration);
          });
          if (isSlotOccupied) {
            isBoxFree = false;
            break;
          }
        }
        
        if (isBoxFree) {
          availableSlots.push(hStr);
          break;
        }
      }
    }

    return res.json(availableSlots);
  } catch (error) {
    console.error("Slots fetch error:", error);
    return res.json([]);
  }
});

app.post("/api/schedule/book", async (req, res) => {
  try {
    const { date, time, serviceCategory, serviceName, clientName, phone, sessionId, car, whatToDo, box: preferredBox } = req.body;
    
    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone.startsWith("7") || formattedPhone.replace(/\D/g, "").length !== 11) {
      return res.status(400).json({ error: "Invalid phone number format." });
    }

    const garage = resolveGarage(serviceCategory);
    if (!garage) throw new Error(`Invalid service category: "${serviceCategory}"`);

    const duration = await getServiceDuration(serviceName);
    const appointments = await getAppointments(date, garage);
    const startHour = parseInt(time);
    
    // Validate preferred box if provided
    if (preferredBox) {
      let isBoxFree = true;
      for (let i = 0; i < duration; i++) {
        const slotHour = startHour + i;
        const isSlotOccupied = appointments.some((app: any) => {
          const appStart = parseInt(app[2]);
          const appDuration = parseInt(app[6] || "1");
          return app[4] === preferredBox && slotHour >= appStart && slotHour < (appStart + appDuration);
        });
        if (isSlotOccupied) {
          isBoxFree = false;
          break;
        }
      }
      if (!isBoxFree) {
        return res.status(400).json({ error: `Box ${preferredBox} is not available at this time` });
      }
    }

    const availableBoxes = [];
    for (const box of BOXES) {
      let isBoxFree = true;
      for (let i = 0; i < duration; i++) {
        const slotHour = startHour + i;
        const isSlotOccupied = appointments.some((app: any) => {
          const appStart = parseInt(app[2]);
          const appDuration = parseInt(app[6] || "1");
          return app[4] === box && slotHour >= appStart && slotHour < (appStart + appDuration);
        });
        if (isSlotOccupied) {
          isBoxFree = false;
          break;
        }
      }
      if (isBoxFree) {
        availableBoxes.push(box);
      }
    }

    if (availableBoxes.length === 0) {
      return res.status(400).json({ error: "No free boxes at this time" });
    }

    const targetBox = preferredBox || availableBoxes.reduce((prev, curr) => {
      const prevCount = appointments.filter(a => a[4] === prev).length;
      const currCount = appointments.filter(a => a[4] === curr).length;
      return currCount < prevCount ? curr : prev;
    }, availableBoxes[0]);

    const sheets = await getSheetsClient();

    // 1. Check if there's an existing RAW application for this session to update it instead of creating new
    const existingApps = await sheets.spreadsheets.values.get({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: "booking!A:P"
    });
    const allRows = existingApps.data.values || [];
    const rowIndex = allRows.findIndex((r: any) => r[10] === sessionId && r[7] === "RAW");

    const appDate = new Date().toLocaleString('ru-RU');

    if (rowIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SCHEDULE_SPREADSHEET_ID,
        range: `booking!B${rowIndex + 1}:P${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            date,
            time,
            garage,
            targetBox,
            serviceName,
            duration,
            "Confirmed",
            "", // Finished_time
            "", // Note
            sessionId || "",
            clientName,
            formattedPhone,
            car || "", // Car
            whatToDo || "", // What_to_do
            appDate
          ]]
        }
      });
      return res.json({ success: true, box: targetBox, orderId: allRows[rowIndex][0] });
    }

    const nextId = await getNextOrderId();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: `booking!A:P`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          nextId,
          date,
          time,
          garage,
          targetBox,
          serviceName,
          duration,
          "Confirmed",
          "", // Finished_time
          "", // Note
          sessionId || "",
          clientName,
          formattedPhone,
          car || "", // Car
          whatToDo || "", // What_to_do
          appDate
        ]]
      }
    });

    return res.json({ success: true, box: targetBox, orderId: nextId });
  } catch (error: any) {
    console.error("Schedule booking error:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/applications/last", async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.json(null);

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: "booking!A:P",
    });

    const rows = response.data.values || [];
    const sessionRows = rows.filter((r: any) => r[10] === sessionId && r[7] === "RAW");
    
    if (sessionRows.length === 0) return res.json(null);

    const last = sessionRows[sessionRows.length - 1];
    return res.json({
      name: last[11],
      phone: last[12],
      car: last[13] || "",
      category: last[3],
      comment: last[14] || last[5],
      orderId: last[0],
      date: last[1],
      time: last[2]
    });
  } catch (error) {
    console.error("Fetch last application error:", error);
    return res.json(null);
  }
});

app.get("/api/prices", async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: PRICE_SPREADSHEET_ID,
      range: "B2:E100",
    });

    const rows = response.data.values || [];
    const prices = rows.map((row: any) => ({
      category: row[0] || "",
      service: row[1] || "",
      price: row[2] || "По запросу",
      duration: row[3] || "Уточняйте"
    })).filter((item: any) => item.service);

    return res.json(prices);
  } catch (error: any) {
    console.error("Price Fetch Error:", error.message);
    return res.json([]);
  }
});

app.get("/api/faq/external", async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: FAQ_SPREADSHEET_ID,
      range: "A2:C100",
    });

    const rows = response.data.values || [];
    const faqItems = rows.map((row: any) => ({
      category: row[0] || "Общее",
      q: row[1] || "",
      a: row[2] || "",
      isExternal: true
    })).filter((item: any) => item.q && item.a);

    return res.json(faqItems);
  } catch (error: any) {
    console.error("External FAQ Fetch Error:", error.message);
    return res.json([]);
  }
});

app.post("/api/booking", async (req, res) => {
  console.log("Received website booking request:", req.body);
  
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ error: "Request Timeout", message: "Сервер не ответил вовремя." });
    }
  }, 15000);

  try {
    const { name, phone, car, comment, sessionId, date, time } = req.body;
    
    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone.startsWith("7") || formattedPhone.replace(/\D/g, "").length !== 11) {
      clearTimeout(timeout);
      return res.status(400).json({ error: "Invalid phone", message: "Некорректный номер телефона." });
    }

    const sheets = await getSheetsClient();
    const nextId = await getNextOrderId();
    const appDate = new Date().toLocaleString('ru-RU');

    const values = [[
      nextId,
      date || "", 
      time || "",
      "", // Category (AI will determine)
      "", // Box
      comment || "", // Service/Title
      "1", // Duration
      "RAW", // Status
      "", // Finished_time
      "", // Note
      sessionId || `W-${Date.now()}`,
      name || "", 
      formattedPhone,
      car || "", // Car
      comment || "", // What_to_do
      appDate // Application_date
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: "booking!A:P",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    clearTimeout(timeout);
    return res.json({ success: true, message: "Заявка успешно отправлена! Наш ассистент поможет вам подтвердить детали в чате." });
  } catch (error: any) {
    clearTimeout(timeout);
    console.error("Booking Error:", error);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

app.post("/api/chat/log", async (req, res) => {
  try {
    const { message, response, userId } = req.body;
    const sheets = await getSheetsClient();
    
    const now = new Date();
    const utc3 = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const pad = (n: number) => n.toString().padStart(2, "0");
    const formattedDate = `${utc3.getUTCFullYear()}.${pad(utc3.getUTCMonth() + 1)}.${pad(utc3.getUTCDate())} ${pad(utc3.getUTCHours())}:${pad(utc3.getUTCMinutes())}:${pad(utc3.getUTCSeconds())}`;

    await sheets.spreadsheets.values.append({
      spreadsheetId: CHATS_LOG_SPREADSHEET_ID,
      range: "logs!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          formattedDate,
          userId || "anonymous",
          message,
          response,
          "", 
          ""  
        ]]
      },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.json({ success: true });
  }
});

app.post("/api/chat/feedback", async (req, res) => {
  try {
    const { sessionId, rating, comment } = req.body;
    const sheets = await getSheetsClient();
    
    const now = new Date();
    const utc3 = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const pad = (n: number) => n.toString().padStart(2, "0");
    const formattedDate = `${utc3.getUTCFullYear()}.${pad(utc3.getUTCMonth() + 1)}.${pad(utc3.getUTCDate())} ${pad(utc3.getUTCHours())}:${pad(utc3.getUTCMinutes())}:${pad(utc3.getUTCSeconds())}`;

    await sheets.spreadsheets.values.append({
      spreadsheetId: FEEDBACK_SPREADSHEET_ID,
      range: "Sheet1!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          formattedDate,
          sessionId || "anonymous",
          rating || "",
          comment || ""
        ]]
      },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false });
  }
});

app.get("/api/admin/appointments", async (req, res) => {
  try {
    const { date, garage, box, endDate } = req.query;
    if (!date) return res.json([]);
    
    const apps = await getAppointments(date as string, garage as string, box as string, endDate as string);
    console.log(`[API] Found ${apps.length} appointments for date: ${date}, endDate: ${endDate}, garage: ${garage}, box: ${box}`);
    const mapped = apps.map((row: any) => ({
        orderId: row[0],
        date: row[1],
        time: row[2],
        garage: row[3],
        box: row[4],
        service: row[5],
        duration: parseInt(row[6] || "1"),
        status: row[7],
        finishedTime: row[8],
        note: row[9],
        sessionId: row[10],
        clientName: row[11],
        phone: row[12],
        car: row[13],
        whatToDo: row[14],
        applicationDate: row[15]
      }));
      
    return res.json(mapped);
  } catch (err: any) {
    console.error("[API] Admin appointments error:", err);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

app.get("/api/schedule/find", async (req, res) => {
  try {
    const { query } = req.query; // can be phone or name
    if (!query) return res.json([]);

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: "booking!A:P",
    });

    const rows = response.data.values || [];
    const searchStr = (query as string).toLowerCase().replace(/\D/g, ""); // strip formatting for phone comparison
    
    const results = rows.slice(1).filter((row: any) => {
      const name = (row[11] || "").toLowerCase();
      const phone = (row[12] || "").replace(/\D/g, "");
      const comment = (row[14] || "").toLowerCase();
      
      // If query is digits, try phone comparison. Otherwise name or comment.
      if (/^\d+$/.test(searchStr) && searchStr.length > 3) {
        return phone.includes(searchStr);
      }
      return name.includes((query as string).toLowerCase()) || comment.includes((query as string).toLowerCase());
    }).map((row: any) => ({
      orderId: row[0],
      date: row[1],
      time: row[2],
      service: row[5],
      status: row[7],
      clientName: row[11],
      phone: row[12],
      car: row[13]
    }));

    return res.json(results);
  } catch (err: any) {
    console.error("Search error:", err);
    return res.json([]);
  }
});

app.post("/api/admin/appointments/status", async (req, res) => {
  try {
    const { orderId, status, finishedTime, note } = req.body;
    if (!orderId || !status) return res.status(400).json({ error: "Missing orderId or status" });

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: "booking!A:A",
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((r: any) => r[0] === orderId.toString());

    if (rowIndex === -1) return res.status(404).json({ error: "Appointment not found" });

    // Status is index 7 (H), Finished_time is 8 (I), Note is 9 (J)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: `booking!H${rowIndex + 1}:J${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[status, finishedTime || "", note || ""]]
      }
    });

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Status update error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.patch("/api/admin/appointments/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!orderId || !status) return res.status(400).json({ error: "Missing orderId or status" });

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: "booking!A:A",
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((r: any) => r[0] === orderId.toString());

    if (rowIndex === -1) return res.status(404).json({ error: "Appointment not found" });

    // Status is index 7 (H)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: `booking!H${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[status]]
      }
    });

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Status update error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/schedule/update", async (req, res) => {
  try {
    const { orderId, date, time, status, service, car, whatToDo, box, duration, clientName, phone, note } = req.body;
    if (!orderId) return res.status(400).json({ error: "Missing orderId" });

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: "booking!A:A",
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((r: any) => r[0] === orderId.toString());

    if (rowIndex === -1) return res.status(404).json({ error: "Appointment not found" });

    // We only update what is provided
    const range = `booking!A${rowIndex + 1}:P${rowIndex + 1}`;
    const currentRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: range
    });
    
    if (!currentRes.data.values || currentRes.data.values.length === 0) {
      return res.status(404).json({ error: "Row data not found" });
    }

    const currentRow = currentRes.data.values[0];
    const newRow = [...currentRow];

    if (date !== undefined) newRow[1] = date;
    if (time !== undefined) newRow[2] = time;
    if (box !== undefined) newRow[4] = box;
    if (service !== undefined) newRow[5] = service;
    if (duration !== undefined) newRow[6] = duration;
    if (status !== undefined) newRow[7] = status;
    if (note !== undefined) newRow[9] = note;
    if (clientName !== undefined) newRow[11] = clientName;
    if (phone !== undefined) newRow[12] = phone;
    if (car !== undefined) newRow[13] = car;
    if (whatToDo !== undefined) newRow[14] = whatToDo;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] }
    });

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Update error:", err);
    return res.status(500).json({ error: err.message });
  }
});

const PROMPTS_FILE = path.join(process.cwd(), "prompts.json");

function loadPrompts() {
  if (fs.existsSync(PROMPTS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROMPTS_FILE, "utf-8"));
    } catch (err) {}
  }
  
  /* SERVER_DEFAULT_PROMPT_START */
  return {
    'bot-system': `Ты — экспертный ИИ-менеджер автосервиса AUTOTECH SOLUTIONS. Твоя цель: безупречный сервис, точная консультация и подтверждение заявок в расписание.

ПРАВИЛА ОБЩЕНИЯ (КРИТИЧЕСКИ ВАЖНО):
1. **КОНФИДЕНЦИАЛЬНОСТЬ:** КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО выводить пользователю любые технические данные инструментов (JSON, ID сессий, структуру таблиц, массивы слотов). Ответы должны быть только на человеческом языке.
2. **ОПРЕДЕЛЕНИЕ КАТЕГОРИИ (ЦЕХА):** Ты обязан классифицировать запрос в одну из категорий:
   - "Слесарный ремонт и ТО" (мотор, ходовая, замена масел, тормоза).
   - "Электрика и диагностика" (ошибки на табло, проводка, аккумуляторы, чип-тюнинг).
   - "Детейлинг и покрытия" (полировка, керамика, пленки, химчистка, мойка).
3. **ОБРАБОТКА RAW-ЗАЯВОК:** Если в контексте есть данные RAW-заявки (имя, телефон, описание), НЕ спрашивай их повторно. Подтверди, что ты их видишь, уточни недостающие детали (марка авто, конкретная задача) и заверши запись.
4. **УТОЧНЕНИЕ ДЕТАЛЕЙ:** Для качественной записи обязательно заполни параметры:
   - 'car': Марка и модель автомобиля.
   - 'whatToDo': Конкретная жалоба или пожелание клиента (вносится в What_to_do).
5. **АЛГОРИТМ ЗАПИСИ:**
   - Предложи свободные слоты через 'get_available_slots'.
   - После согласования времени вызови 'book_with_schedule', передав все собранные данные (имя, телефон, авто, задача).
   - В финальном подтверждении ОБЯЗАТЕЛЬНО назови гараж (цех), в который записан клиент.
6. **ОТМЕНА И ИЗМЕНЕНИЕ:** Если клиент просит отменить или изменить запись:
   - Сначала найди её через 'find_appointment' (или используй данные из контекста).
   - Вызови 'update_appointment', указав 'orderId' и новый статус ('Cancelled' для отмены, 'Changed' для переноса).
   - Если это перенос, укажи также новые 'date' и 'time'.

Стиль общения: Лаконичный, профессиональный, экспертный. Без лишних извинений и воды.

Текущая дата и время: ${new Date().toLocaleString('ru-RU')}`,
    'report-analysis': `На основе предоставленных данных о записях в боксы, проанализируй загруженность и выяви узкие места. Рассчитай коэффициент полезного действия (КПД) каждого бокса и предложи рекомендации по оптимизации расписания для увеличения пропускной способности.`
  };
  /* SERVER_DEFAULT_PROMPT_END */
}

let systemPrompts = loadPrompts();

app.get("/api/admin/prompts", (req, res) => {
  res.json(systemPrompts);
});

app.post("/api/admin/prompts", (req, res) => {
  const { id, content } = req.body;
  if (!id || content === undefined) return res.status(400).json({ error: "Missing id or content" });
  systemPrompts[id] = content;
  try {
    fs.writeFileSync(PROMPTS_FILE, JSON.stringify(systemPrompts, null, 2), "utf-8");
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to save: " + err.message });
  }
});

app.post("/api/admin/prompts/restore", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const DEFAULT_PROMPTS = {
    'bot-system': `Ты — экспертный ИИ-менеджер автосервиса AUTOTECH SOLUTIONS. Твоя цель: безупречный сервис, точная консультация и подтверждение заявок в расписание.

ПРАВИЛА ОБЩЕНИЯ (КРИТИЧЕСКИ ВАЖНО):
1. **КОНФИДЕНЦИАЛЬНОСТЬ:** КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО выводить пользователю любые технические данные инструментов (JSON, ID сессий, структуру таблиц, массивы слотов). Ответы должны быть только на человеческом языке.
2. **ОПРЕДЕЛЕНИЕ КАТЕГОРИИ (ЦЕХА):** Ты обязан классифицировать запрос в одну из категорий:
   - "Слесарный ремонт и ТО" (мотор, ходовая, замена масел, тормоза).
   - "Электрика и диагностика" (ошибки на табло, проводка, аккумуляторы, чип-тюнинг).
   - "Детейлинг и покрытия" (полировка, керамика, пленки, химчистка, мойка).
3. **ОБРАБОТКА RAW-ЗАЯВОК:** Если в контексте есть данные RAW-заявки (имя, телефон, описание), НЕ спрашивай их повторно. Подтверди, что ты их видишь, уточни недостающие детали (марка авто, конкретная задача) и заверши запись.
4. **УТОЧНЕНИЕ ДЕТАЛЕЙ:** Для качественной записи обязательно заполни параметры:
   - 'car': Марка и модель автомобиля.
   - 'whatToDo': Конкретная жалоба или пожелание клиента (вносится в What_to_do).
5. **АЛГОРИТМ ЗАПИСИ:**
   - Предложи свободные слоты через 'get_available_slots'.
   - После согласования времени вызови 'book_with_schedule', передав все собранные данные (имя, телефон, авто, задача).
   - В финальном подтверждении ОБЯЗАТЕЛЬНО назови гараж (цех), в который записан клиент.
6. **ОТМЕНА И ИЗМЕНЕНИЕ:** Если клиент просит отменить или изменить запись:
   - Сначала найди её через 'find_appointment' (или используй данные из контекста).
   - Вызови 'update_appointment', указав 'orderId' и новый статус ('Cancelled' для отмены, 'Changed' для переноса).
   - Если это перенос, укажи также новые 'date' и 'time'.

Стиль общения: Лаконичный, профессиональный, экспертный. Без лишних извинений и воды.

Текущая дата и время: ${new Date().toLocaleString('ru-RU')}`, 
    'report-analysis': `На основе предоставленных данных о записях в боксы, проанализируй загруженность и выяви узкие места. Рассчитай коэффициент полезного действия (КПД) каждого бокса и предложи рекомендации по оптимизации расписания для увеличения пропускной способности.` 
  };
  
  if (DEFAULT_PROMPTS[id as keyof typeof DEFAULT_PROMPTS]) {
    systemPrompts[id] = DEFAULT_PROMPTS[id as keyof typeof DEFAULT_PROMPTS];
    try {
      fs.writeFileSync(PROMPTS_FILE, JSON.stringify(systemPrompts, null, 2), "utf-8");
      return res.json({ success: true, content: systemPrompts[id] });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to restore: " + err.message });
    }
  }
  return res.status(404).json({ error: "Default prompt not found" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
