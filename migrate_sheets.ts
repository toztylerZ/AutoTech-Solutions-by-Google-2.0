import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const SCHEDULE_SPREADSHEET_ID = "1whc-vJNHIOhJhnT9Sf-eS5l88AbDqF1BAxwNkaKjiEU";

async function getSheetsClient() {
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

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

async function run() {
  const sheets = await getSheetsClient();
  const tabs = ["Ремонт", "Диагностика", "Кузовщина"];
  let allData: any[][] = [];

  const headers = ["ID", "Date", "Time", "Garage", "Box", "Service", "Client Name", "Phone", "SessionID", "Status", "Duration"];
  allData.push(headers);

  for (const tab of tabs) {
    try {
      console.log(`Fetching data from ${tab}...`);
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SCHEDULE_SPREADSHEET_ID,
        range: `${tab}!A2:K1000`,
      });
      if (response.data.values) {
        allData = [...allData, ...response.data.values];
      }
    } catch (e) {
      console.warn(`Tab ${tab} not found or inaccessible.`);
    }
  }

  // Create booking sheet
  try {
    console.log("Adding 'booking' sheet...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SCHEDULE_SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: "booking",
              },
            },
          },
        ],
      },
    });
  } catch (e: any) {
    if (e.message.includes("already exists")) {
      console.log("'booking' sheet already exists.");
    } else {
      console.error("Error creating sheet:", e);
    }
  }

  // Write all data to booking
  console.log("Writing data to 'booking'...");
  await sheets.spreadsheets.values.update({
    spreadsheetId: SCHEDULE_SPREADSHEET_ID,
    range: "booking!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: allData,
    },
  });

  // Optional: Remove old sheets
  for (const tab of tabs) {
    try {
      console.log(`Attempting to delete tab ${tab}...`);
      // We need sheetId to delete. Get spreadsheet details first.
      const ss = await sheets.spreadsheets.get({ spreadsheetId: SCHEDULE_SPREADSHEET_ID });
      const sheet = ss.data.sheets?.find(s => s.properties?.title === tab);
      if (sheet?.properties?.sheetId !== undefined) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SCHEDULE_SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                deleteSheet: {
                  sheetId: sheet.properties.sheetId,
                },
              },
            ],
          },
        });
        console.log(`Deleted ${tab}.`);
      }
    } catch (e) {
       console.error(`Failed to delete ${tab}:`, e);
    }
  }

  console.log("Consolidation complete!");
}

run().catch(console.error);
