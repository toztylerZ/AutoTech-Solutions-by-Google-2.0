
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

async function readLogs() {
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

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = "1dEPsxN9ApmAw-lYpGtIZy9gFBTU1ZXMLfC7kqsmjjD8";
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "logs!A:F",
    });
    console.log(JSON.stringify(response.data.values, null, 2));
  } catch (err) {
    console.error("Error reading logs:", err.message);
  }
}

readLogs();
