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

const FAQ_SPREADSHEET_ID = "19MOB7haF0D97sWTebuo0Q4E9d_vVy_SHWAt58GZQDzk";
const PRICE_SPREADSHEET_ID = "1ryq0AloXjE-FXCz5_BkB8erYrVr8fvzr3SnOg42KTvc";
const SCHEDULE_SPREADSHEET_ID = "1whc-vJNHIOhJhnT9Sf-eS5l88AbDqF1BAxwNkaKjiEU";
const STAFF_SPREADSHEET_ID = "1IizFOVizcUsWrTrUEmvKfRmgXKOViAj8S5eHEDOVvJk";

// Simple in-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache: Record<string, CacheEntry> = {};
const CACHE_TTL: Record<string, number> = {
  faq: 10 * 60 * 1000, // 10 minutes
  prices: 10 * 60 * 1000, // 10 minutes
  appointments: 45 * 1000, // 45 seconds (enough to reduce quota usage significantly)
  staff: 60 * 1000, // 1 minute
};

function getFromCache(key: string) {
  const entry = cache[key];
  if (entry && (Date.now() - entry.timestamp) < (CACHE_TTL[key.split(":")[0]] || 60000)) {
    return entry.data;
  }
  return null;
}

function setInCache(key: string, data: any) {
  cache[key] = { data, timestamp: Date.now() };
}

function invalidateCache(prefix: string) {
  Object.keys(cache).forEach(key => {
    if (key.startsWith(prefix)) {
      delete cache[key];
    }
  });
}

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

async function getAllAppointmentsMapped() {
  const cacheKey = `appointments:all`;
  let rows = getFromCache(cacheKey);

  if (!rows) {
    const sheets = await getSheetsClient();
    const rangeToFetch = `A1:Z10000`;
    
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SCHEDULE_SPREADSHEET_ID,
        range: `booking!${rangeToFetch}`,
      });
      rows = response.data.values || [];
    } catch (e) {
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
            break;
          }
        } catch (err) {}
      }
    }
    
    if (rows && rows.length > 0) {
      setInCache(cacheKey, rows);
    }
  }

  if (!rows || rows.length === 0) return [];

  const firstRow = rows[0];
  const isHeader = firstRow && firstRow[0] && isNaN(parseInt(firstRow[0])) && firstRow[0].toString().length > 2;
  const dataRows = isHeader ? rows.slice(1) : rows;

  return dataRows.map((row: any) => {
    let timeRaw = (row[2] || "").toString().trim();
    if (timeRaw && !timeRaw.includes(':')) timeRaw += ":00";
    if (timeRaw && timeRaw.includes(':')) {
      const [h, m] = timeRaw.split(':');
      timeRaw = `${h.padStart(2, '0')}:${(m || '00').padEnd(2, '0').slice(0, 2)}`;
    }

    return {
      orderId: row[0] || "",
      date: row[1] || "",
      time: timeRaw,
      garage: (row[3] || "").toString().trim(),
      box: (row[4] || "").toString().trim(),
      service: row[5] || "",
      duration: row[6] || "1",
      status: row[7] || "Confirmed",
      clientName: row[11] || "",
      phone: row[12] || "",
      car: row[13] || row[5] || "",
      finishedTime: row[8] || "",
      difficulty: row[9] || "",
      sessionId: row[10] || "",
      note: row[16] || "",
      comment: row[14] || ""
    };
  });
}

async function getAppointments(date: string, garage?: string, box?: string, endDate?: string) {
  const allMapped = await getAllAppointmentsMapped();
  
  let filtered = allMapped.filter((app: any) => {
    let rowDate = app.date;
    if (!rowDate) return false;

    if (rowDate.includes(',') || rowDate.includes(' ')) {
      rowDate = rowDate.split(/[ ,]/)[0];
    }

    let isoRowDate = rowDate;
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
    
    return isoRowDate === date.trim();
  });

  if (garage && garage !== "undefined") {
    const target = garage.toLowerCase().trim();
    filtered = filtered.filter((app: any) => {
      const appGarage = app.garage.toLowerCase().trim();
      return appGarage === target || appGarage.includes(target) || target.includes(appGarage);
    });
  }

  if (box && box !== "undefined" && box !== "Все") {
    const targetBox = box.toLowerCase().trim();
    filtered = filtered.filter((app: any) => {
      const appBox = (app.box || "").toLowerCase().trim();
      return appBox === targetBox || appBox.includes(targetBox) || targetBox.includes(appBox);
    });
  }

  return filtered;
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

async function logScheduleAction(orderId: string | number, action: string, user: string = "Админ") {
  try {
    const sheets = await getSheetsClient();
    const timestamp = getFormattedUTC3Now();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: "schedule_log!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, orderId, action, user]]
      }
    });
  } catch (err) {
    console.error("Failed to log schedule action:", err);
  }
}

async function getServiceDuration(serviceName: string) {
  try {
    const cacheKey = "prices:all";
    let rows = getFromCache(cacheKey);

    if (!rows) {
      const sheets = await getSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: PRICE_SPREADSHEET_ID,
        range: "C2:E100", // C: Услуга, E: Время обслуживания
      });
      rows = response.data.values || [];
      setInCache(cacheKey, rows);
    }

    const row = (rows as any[]).find(r => r[0]?.trim() === serviceName.trim());
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

function getFormattedUTC3Now() {
  const now = new Date();
  const utc3 = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  const pad = (n: number) => n.toString().padStart(2, "0");
  const formattedDate = `${pad(utc3.getUTCDate())}.${pad(utc3.getUTCMonth() + 1)}.${utc3.getUTCFullYear()} ${pad(utc3.getUTCHours())}:${pad(utc3.getUTCMinutes())}:${pad(utc3.getUTCSeconds())}`;
  return formattedDate;
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
            const appStart = parseInt(app.time);
            const appDuration = parseInt(app.duration || "1");
            return app.box === box && slotHour >= appStart && slotHour < (appStart + appDuration);
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
          const appStart = parseInt(app.time);
          const appDuration = parseInt(app.duration || "1");
          return app.box === preferredBox && slotHour >= appStart && slotHour < (appStart + appDuration);
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
          const appStart = parseInt(app.time);
          const appDuration = parseInt(app.duration || "1");
          return app.box === box && slotHour >= appStart && slotHour < (appStart + appDuration);
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
      const prevCount = appointments.filter((a: any) => a.box === prev).length;
      const currCount = appointments.filter((a: any) => a.box === curr).length;
      return currCount < prevCount ? curr : prev;
    }, availableBoxes[0]);

    const sheets = await getSheetsClient();

    // 1. Check if there's an existing RAW application for this session to update it instead of creating new
    const existingApps = await sheets.spreadsheets.values.get({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: "booking!A:Q"
    });
    const allRows = existingApps.data.values || [];
    const rowIndex = allRows.findIndex((r: any) => r[10] === sessionId && r[7] === "RAW");

    const appDate = getFormattedUTC3Now();

    if (rowIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SCHEDULE_SPREADSHEET_ID,
        range: `booking!B${rowIndex + 1}:Q${rowIndex + 1}`,
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
            appDate,
            "" // Difficulty (placeholder for Column Q)
          ]]
        }
      });
      invalidateCache("appointments");
      return res.json({ success: true, box: targetBox, orderId: allRows[rowIndex][0] });
    }

    const nextId = await getNextOrderId();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: "booking!A:Q",
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
          "", // Difficulty (index 9)
          sessionId || "",
          clientName,
          formattedPhone,
          car || "", // Car
          whatToDo || "", // What_to_do
          appDate,
          "" // Note (index 16)
        ]]
      }
    });

    invalidateCache("appointments");
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

    const cacheKey = "appointments:all";
    let rows = getFromCache(cacheKey);

    if (!rows) {
      const sheets = await getSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SCHEDULE_SPREADSHEET_ID,
        range: "booking!A:Q",
      });
      rows = response.data.values || [];
      setInCache(cacheKey, rows);
    }

    const sessionRows = (rows as any[]).filter((r: any) => r.sessionId === sessionId && r.status === "RAW");
    
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
    const cacheKey = "prices:all";
    let rows = getFromCache(cacheKey);

    if (!rows) {
      const sheets = await getSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: PRICE_SPREADSHEET_ID,
        range: "B2:E100",
      });
      rows = response.data.values || [];
      setInCache(cacheKey, rows);
    }

    const prices = (rows as any[]).map((row: any) => ({
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
    const cacheKey = "faq:all";
    let rows = getFromCache(cacheKey);

    if (!rows) {
      const sheets = await getSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: FAQ_SPREADSHEET_ID,
        range: "A2:C100",
      });
      rows = response.data.values || [];
      setInCache(cacheKey, rows);
    }

    const faqItems = (rows as any[]).map((row: any) => ({
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
    const appDate = getFormattedUTC3Now();

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
      "", // Difficulty (index 9)
      sessionId || `W-${Date.now()}`,
      name || "", 
      formattedPhone,
      car || "", // Car
      comment || "", // What_to_do
      appDate, // Application_date
      "" // Note (index 16)
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: "booking!A:Q",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    invalidateCache("appointments");
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
    return res.json(apps);
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

    const allMapped = await getAllAppointmentsMapped();
    const searchStr = (query as string).toLowerCase().replace(/\D/g, ""); // strip formatting for phone comparison
    
    const results = allMapped.filter((app: any) => {
      const name = (app.clientName || "").toLowerCase();
      const phoneRaw = (app.phone || "").replace(/\D/g, "");
      const comment = (app.comment || "").toLowerCase();
      const car = (app.car || "").toLowerCase();
      
      // If searching by phone (at least 4 digits)
      if (/^\d+$/.test(searchStr) && searchStr.length >= 4) {
        // Normalize searchStr to 11 digits if it's 10 digits starting with 9
        let normalizedSearch = searchStr;
        if (normalizedSearch.length === 10 && normalizedSearch.startsWith('9')) {
          normalizedSearch = '7' + normalizedSearch;
        }
        
        // Normalize phoneRaw to 11 digits if it's 10 digits starting with 9
        let normalizedPhone = phoneRaw;
        if (normalizedPhone.length === 10 && normalizedPhone.startsWith('9')) {
          normalizedPhone = '7' + normalizedPhone;
        }

        // Partial match or full match
        return normalizedPhone.includes(normalizedSearch) || normalizedSearch.includes(normalizedPhone);
      }

      // String search
      const q = (query as string).toLowerCase().trim();
      return name.includes(q) || 
             comment.includes(q) ||
             car.includes(q);
    });

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

    // Status (7), Finished_time (8), Complexity (9)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: `booking!H${rowIndex + 1}:J${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[status, finishedTime || "", req.body.difficulty || ""]]
      }
    });

    // Note is at index 16 (Q)
    if (note !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SCHEDULE_SPREADSHEET_ID,
        range: `booking!Q${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[note]]
        }
      });
    }

    invalidateCache("appointments");
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Status update error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/appointments/close", async (req, res) => {
  try {
    const { orderId, complexity, note } = req.body;
    if (!orderId) return res.status(400).json({ error: "Missing orderId" });

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: "booking!A:A",
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((r: any) => r[0] === orderId.toString());

    if (rowIndex === -1) return res.status(404).json({ error: "Appointment not found" });

    const now = new Date();
    const finishedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const status = 'COMPLETED';

    await sheets.spreadsheets.values.update({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: `booking!H${rowIndex + 1}:J${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[status, finishedTime, complexity]]
      }
    });

    if (note !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SCHEDULE_SPREADSHEET_ID,
        range: `booking!Q${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[note]]
        }
      });
    }

    await logScheduleAction(orderId, `Закрыта через интерфейс персонала; Сложность: ${complexity}`, "Персонал");

    invalidateCache("appointments");
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Close appointment error:", err);
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

    invalidateCache("appointments");
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Status update error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/schedule/update", async (req, res) => {
  try {
    const { orderId, date, time, status, service, car, whatToDo, box, duration, clientName, phone, note, finishedTime, difficulty } = req.body;
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
    const range = `booking!A${rowIndex + 1}:Q${rowIndex + 1}`;
    const currentRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: range
    });
    
    if (!currentRes.data.values || currentRes.data.values.length === 0) {
      return res.status(404).json({ error: "Row data not found" });
    }

    const currentRow = currentRes.data.values[0];
    const newRow = [...currentRow];
    const changes: string[] = [];

    if (date !== undefined && date !== currentRow[1]) {
      changes.push(`Дата: ${currentRow[1] || 'пусто'} -> ${date}`);
      newRow[1] = date;
    }
    if (time !== undefined && time !== currentRow[2]) {
      changes.push(`Время: ${currentRow[2] || 'пусто'} -> ${time}`);
      newRow[2] = time;
    }
    if (box !== undefined && box !== currentRow[4]) {
      changes.push(`Бокс: ${currentRow[4] || 'пусто'} -> ${box}`);
      newRow[4] = box;
    }
    if (service !== undefined && service !== currentRow[5]) {
      changes.push(`Услуга: ${currentRow[5] || 'пусто'} -> ${service}`);
      newRow[5] = service;
    }
    if (duration !== undefined && duration !== currentRow[6]) {
      changes.push(`Длит: ${currentRow[6] || 'пусто'} -> ${duration}`);
      newRow[6] = duration;
    }
    if (status !== undefined && status !== currentRow[7]) {
      changes.push(`Статус: ${currentRow[7] || 'пусто'} -> ${status}`);
      newRow[7] = status;
    }
    if (finishedTime !== undefined && finishedTime !== currentRow[8]) {
      changes.push(`Заверш: ${currentRow[8] || 'пусто'} -> ${finishedTime}`);
      newRow[8] = finishedTime;
    }
    if (difficulty !== undefined && difficulty !== currentRow[9]) {
      changes.push(`Слож: ${currentRow[9] || 'пусто'} -> ${difficulty}`);
      newRow[9] = difficulty;
    }
    if (note !== undefined && note !== currentRow[16]) {
      changes.push(`Заметка изм.`);
      newRow[16] = note;
    }
    if (clientName !== undefined && clientName !== currentRow[11]) {
      changes.push(`Имя: ${currentRow[11] || 'пусто'} -> ${clientName}`);
      newRow[11] = clientName;
    }
    if (phone !== undefined && phone !== currentRow[12]) {
      changes.push(`Тел изм.`);
      newRow[12] = phone;
    }
    if (car !== undefined && car !== currentRow[13]) {
      changes.push(`Авто: ${currentRow[13] || 'пусто'} -> ${car}`);
      newRow[13] = car;
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] }
    });

    if (changes.length > 0) {
      await logScheduleAction(orderId, changes.join("; "));
    }

    invalidateCache("appointments");
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Update error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/schedule/create", async (req, res) => {
  try {
    const { date, time, status, service, car, whatToDo, box, duration, clientName, phone, note } = req.body;
    
    const sheets = await getSheetsClient();
    const nextId = await getNextOrderId();
    const appDate = getFormattedUTC3Now();

    const newRow = [
      nextId,
      date || "", 
      time || "",
      req.body.garage || "", // Use garage field if provided
      box || "",
      service || "",
      duration || "1",
      status || "NEW",
      "", // Finished_time
      "", // complexity (index 9)
      `ADMIN-${Date.now()}`, // sessionId
      clientName || "",
      phone || "",
      car || "",
      whatToDo || service || "",
      appDate,
      note || "" // Note (index 16)
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      range: "booking!A:Q",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });

    await logScheduleAction(nextId, "Запись создана (Админ)");

    invalidateCache("appointments");
    return res.json({ success: true, orderId: nextId });
  } catch (err: any) {
    console.error("Create error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/appointments/:orderId/history", async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ error: "Missing orderId" });

    const sheets = await getSheetsClient();
    
    // Fetch from schedule_log sheet
    let rows: any[][] = [];
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SCHEDULE_SPREADSHEET_ID,
        range: "schedule_log!A:D", // Date, OrderID, Change, User
      });
      rows = response.data.values || [];
    } catch (e: any) {
      console.warn("History sheet not found or empty:", e.message);
      return res.json([]);
    }

    if (rows.length <= 1) return res.json([]);

    const dataRows = rows.slice(1);
    const history = dataRows
      .filter(row => row[1]?.toString() === orderId.toString())
      .map(row => ({
        date: row[0] || "",
        change: row[2] || "",
        user: row[3] || "Система"
      }))
      .reverse();

    return res.json(history);
  } catch (err: any) {
    console.error("Fetch history error:", err);
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

Текущая дата и время: ${getFormattedUTC3Now()}`,
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

Текущая дата и время: ${getFormattedUTC3Now()}`, 
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

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Missing login or password" });
    }

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: STAFF_SPREADSHEET_ID,
      range: "staff!A:H",
    });
    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return res.status(401).json({ error: "Invalid login or password" });
    }

    const dataRows = rows.slice(1);
    const userRow = dataRows.find(row => 
      row[3]?.toString().trim() === username.trim() && 
      row[4]?.toString().trim() === password.trim()
    );

    if (!userRow) {
      // Emergency fallback for initial admin if sheet is empty or admin not found
      if (username === 'admin' && password === 'admin') {
         return res.json({
           username: 'admin',
           name: 'Администратор',
           role: 'администратор',
           access: null,
           box: null
         });
      }
      return res.status(401).json({ error: "Invalid login or password" });
    }

    const rawRole = userRow[7]?.toString().toLowerCase().trim() || "";
    let role = "работник";
    if (rawRole.includes("администратор") || rawRole.includes("admin")) {
      role = "администратор";
    } else if (rawRole.includes("менеджер") || rawRole.includes("manager")) {
      role = "менеджер";
    } else {
      role = "работник";
    }

    return res.json({
      username: userRow[3],
      name: userRow[2],
      role: role,
      access: userRow[5]?.toString().trim(),
      box: userRow[6]?.toString().trim()
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
});

app.get("/api/admin/staff", async (req, res) => {
  try {
    const cacheKey = "staff:all";
    let rows = getFromCache(cacheKey);

    if (!rows) {
      const sheets = await getSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: STAFF_SPREADSHEET_ID,
        range: "staff!A:H",
      });
      rows = response.data.values || [];
      setInCache(cacheKey, rows);
    }

    if (!rows || rows.length <= 1) return res.json([]);

    const dataRows = rows.slice(1);
    const staff = dataRows.map((row: any) => ({
      id: row[0],
      phone: row[1],
      user_name: row[2],
      login: row[3],
      password: row[4],
      access: row[5],
      box: row[6],
      role: row[7],
    }));

    return res.json(staff);
  } catch (err: any) {
    console.error("Staff fetch error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/staff", async (req, res) => {
  try {
    const { phone, user_name, login, password, access, box, role } = req.body;
    const sheets = await getSheetsClient();
    
    // Get next ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: STAFF_SPREADSHEET_ID,
      range: "staff!A:A",
    });
    const ids = response.data.values?.slice(1).map(r => parseInt(r[0])).filter(n => !isNaN(n)) || [];
    const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

    await sheets.spreadsheets.values.append({
      spreadsheetId: STAFF_SPREADSHEET_ID,
      range: "staff!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[nextId, phone, user_name, login, password, access, box, role]]
      }
    });

    invalidateCache("staff");
    return res.json({ success: true, id: nextId });
  } catch (err: any) {
    console.error("Staff create error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/staff/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, user_name, login, password, access, box, role } = req.body;
    const sheets = await getSheetsClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: STAFF_SPREADSHEET_ID,
      range: "staff!A:A",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(r => r[0] === id);

    if (rowIndex === -1) return res.status(404).json({ error: "Staff member not found" });

    await sheets.spreadsheets.values.update({
      spreadsheetId: STAFF_SPREADSHEET_ID,
      range: `staff!A${rowIndex + 1}:H${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[id, phone, user_name, login, password, access, box, role]]
      }
    });

    invalidateCache("staff");
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Staff update error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/staff/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sheets = await getSheetsClient();
    
    // Deleting in Sheets is tricky (you usually have to batchUpdate)
    // For simplicity, we can find the row and clear it or move everything up
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: STAFF_SPREADSHEET_ID,
      range: "staff!A:A",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(r => r[0] === id);

    if (rowIndex === -1) return res.status(404).json({ error: "Staff member not found" });

    // Get the sheet ID for 'staff'
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: STAFF_SPREADSHEET_ID,
    });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === "staff");
    const sheetId = sheet?.properties?.sheetId;

    if (sheetId === undefined) throw new Error("Staff sheet not found");

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: STAFF_SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }
        ]
      }
    });

    invalidateCache("staff");
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Staff delete error:", err);
    return res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);

  // Listen immediately so the AI Studio proxy stops showing "Starting Server"
  app
    .listen(PORT, "0.0.0.0", () => {
      console.log(`\n\n[Server] ==========================================`);
      console.log(`[Server] READY: Server running on http://0.0.0.0:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
      console.log(`[Server] ==========================================\n\n`);
    })
    .on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use`);
      } else {
        console.error("Server error:", err);
      }
    });

  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] Vite middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

startServer();
