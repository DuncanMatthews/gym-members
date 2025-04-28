// scripts/import-from-gsheet.ts
import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";
import path from 'path';

const prisma = new PrismaClient();

// 1. First, set up credentials for Google Sheets API
// - You'll need to create credentials in Google Cloud Console and download a credentials.json file
// - Place the credentials.json file in a secure location (e.g., /scripts/credentials.json)

async function importUsersFromSheet() {
  try {
    console.log("Starting Google Sheet import...");

    // 2. Configure authentication
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'scripts', 'webuy-404013-6dd687763ebe.json'), scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    // 3. Set up your spreadsheet ID and range
    const spreadsheetId = '1V3eX_NMMJphV1bcRLEuibv7db68fsgQQWjs-07mFUSQ'; // Replace with your sheet ID
    const range = 'SignUps!A2:F39'; // Adjust range as needed, skipping header row

    // 4. Get the data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in the spreadsheet.');
      return;
    }

    console.log(`Found ${rows.length} rows of data to import`);

    // 5. Process each row and create users
    let createdCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      // Adjust indexes based on your spreadsheet structure
      const [
        email,
        name,
        phone,
        gender,
        idNumber,
        addressLine1,
        addressLine2,
        city,
        postalCode,
        role = 'MEMBER'
      ] = row;

      // Skip if email is missing
      if (!email) {
        console.log('Skipping row with missing email');
        skippedCount++;
        continue;
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        console.log(`User with email ${email} already exists - skipping`);
        skippedCount++;
        continue;
      }

      // Add around line 71, before creating the user:
      if (idNumber) {
        const existingUserById = await prisma.user.findUnique({
          where: { idNumber }
        });

        if (existingUserById) {
          console.log(`User with ID number ${idNumber} already exists - skipping`);
          skippedCount++;
          continue;
        }
      }

      // Create the user
      await prisma.user.create({
        data: {
          email,
          name,
          password: 'tempPassword123', // Set a temporary password that users will change
          role: role as 'ADMIN' | 'STAFF' | 'MEMBER',
          phone: phone || null,
          gender: gender || null,
          idNumber: idNumber || null,
          addressLine1: addressLine1 || null,
          addressLine2: addressLine2 || null,
          city: city || null,
          postalCode: postalCode || null,
          isActive: true,
        }
      });

      createdCount++;
      console.log(`Created user: ${email}`);
    }

    console.log('------------------------------------');
    console.log(`Import complete!`);
    console.log(`Created: ${createdCount} users`);
    console.log(`Skipped: ${skippedCount} users`);
    console.log('------------------------------------');

  } catch (error) {
    console.error('Error importing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importUsersFromSheet();