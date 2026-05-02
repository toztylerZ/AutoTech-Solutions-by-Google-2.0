import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

async function setup() {
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
    console.error("Missing credentials");
    process.exit(1);
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });

  const drive = google.drive({ version: "v3", auth });
  const sheets = google.sheets({ version: "v4", auth });

  const folderId = "1OhUCOfmpOpEnSEvrxG2sDPXaNAiDV8Zc";

  try {
    console.log("Creating log spreadsheet...");
    
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: "logs"
        }
      }
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    console.log("Created spreadsheet ID:", spreadsheetId);

    // Set headers on the first sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId!,
      range: "Sheet1!A1:D1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["Дата", "ID Сессии", "Вопрос", "Ответ"]]
      }
    });
    console.log("Headers set successfully.");

    // Move to folder
    try {
        const file = await drive.files.get({
            fileId: spreadsheetId!,
            fields: 'parents'
        });
        const previousParents = file.data.parents?.join(',');
        await drive.files.update({
            fileId: spreadsheetId!,
            addParents: folderId,
            removeParents: previousParents,
            fields: 'id, parents'
        });
        console.log("Moved to target folder successfully.");
    } catch (e: any) {
        console.warn("Could not move to folder:", e.message);
        console.warn("Spreadsheet still exists at ID:", spreadsheetId);
    }
    
    console.log("SUCCESS_SPREADSHEET_ID=" + spreadsheetId);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

setup();
