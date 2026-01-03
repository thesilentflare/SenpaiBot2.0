import { db, dbPromise } from "./database";

export type BirthdayEntry = {
  discordID: string;
  name: string;
  dateISOString: string;
};

export const getMonthlyBirthdays = async (
  month: number
): Promise<BirthdayEntry[]> => {
  const db = await dbPromise;

  // Month should be between 1 and 12
  if (month < 1 || month > 12) {
    throw new Error("Invalid month. Please provide a month between 1 and 12.");
  }

  // Query to get users with birthdays in the specified month
  const query = `
    SELECT u.discordID, u.name, b.dateISOString
    FROM Users u
    JOIN Birthdays b ON u.discordID = b.discordID
    WHERE strftime('%m', b.dateISOString) = ?
    ORDER BY strftime('%m', b.dateISOString), strftime('%d', b.dateISOString);
`;

  const birthdayList = await db.all(query, [String(month).padStart(2, "0")]);

  return birthdayList.map((entry) => ({
    discordID: entry.discordID,
    name: entry.name,
    dateISOString: entry.dateISOString,
  }));
};

export const getTodayBirthdays = async (
  month: number,
  day: number
): Promise<BirthdayEntry[]> => {
  const db = await dbPromise;

  // Pad the month and day for the query
  const monthString = String(month).padStart(2, "0"); // Ensure two digits
  const dayString = String(day).padStart(2, "0"); // Ensure two digits

  const query = `
        SELECT u.discordID, u.name, b.dateISOString
        FROM Users u
        JOIN Birthdays b ON u.discordID = b.discordID
        WHERE strftime('%m', b.dateISOString) = ? 
        AND strftime('%d', b.dateISOString) = ?;
    `;

  const todayBirthdays = await db.all(query, [monthString, dayString]);
  return todayBirthdays.map((entry: any) => ({
    discordID: entry.discordID,
    name: entry.name,
    dateISOString: entry.dateISOString,
  }));
};

export const getAllBirthdays = async (): Promise<BirthdayEntry[]> => {
  const db = await dbPromise;

  const query = `
        SELECT u.discordID, u.name, b.dateISOString
        FROM Users u
        JOIN Birthdays b ON u.discordID = b.discordID
        ORDER BY strftime('%m', b.dateISOString), strftime('%d', b.dateISOString);
    `;

  const allBirthdays = await db.all(query);
  return allBirthdays.map((entry: any) => ({
    discordID: entry.discordID,
    name: entry.name,
    dateISOString: entry.dateISOString,
  }));
};

export const setBirthday = (
  discordID: string,
  dateISOString: string
): Promise<{ success: boolean }> => {
  return new Promise((resolve, reject) => {
    // First, check if a birthday entry already exists for this user
    db.get(
      `SELECT * FROM Birthdays WHERE discordID = ?`,
      [discordID],
      (err, row) => {
        if (err) {
          console.error("Error querying Birthdays table:", err.message);
          return reject(err);
        }

        if (row) {
          // Update existing birthday
          db.run(
            `UPDATE Birthdays SET dateISOString = ? WHERE discordID = ?`,
            [dateISOString, discordID],
            function (err) {
              if (err) {
                console.error("Error updating birthday:", err.message);
                return reject(err);
              }
              console.log(
                `Updated birthday for user ${discordID} to ${dateISOString}`
              );
              resolve({ success: true });
            }
          );
        } else {
          // Insert new birthday
          db.run(
            `INSERT INTO Birthdays (discordID, dateISOString) VALUES (?, ?)`,
            [discordID, dateISOString],
            function (err) {
              if (err) {
                console.error("Error inserting birthday:", err.message);
                return reject(err);
              }
              console.log(
                `Set new birthday for user ${discordID} to ${dateISOString}`
              );
              resolve({ success: true });
            }
          );
        }
      }
    );
  });
};
