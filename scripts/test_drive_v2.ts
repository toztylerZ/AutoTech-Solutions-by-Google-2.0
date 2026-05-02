import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.substring(1, privateKey.length - 1);
    privateKey = privateKey.replace(/\\n/g, "\n");
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
  }
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.metadata.readonly"],
  });
  const drive = google.drive({ version: "v3", auth });
  try {
    const res = await drive.files.list({
      q: "'1OhUCOfmpOpEnSEvrxG2sDPXaNAiDV8Zc' in parents",
    });
    console.log("FILES_IN_FOLDER=", res.data.files);
  } catch (e: any) {
    console.error("DRIVE_ERROR=", e.message);
  }
}
test();
