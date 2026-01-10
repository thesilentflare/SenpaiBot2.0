import { db, dbPromise } from '../database';

export type AdminEntry = {
  discordID: string;
  name: string;
  active: boolean;
};

/**
 * Check if a user is an active admin
 */
export const isActiveAdmin = async (discordID: string): Promise<boolean> => {
  const database = await dbPromise;

  const query = `
    SELECT * FROM Admins
    WHERE discordID = ? AND active = 1
  `;

  const admin = await database.get(query, [discordID]);
  return !!admin;
};

/**
 * Get all admins (active and inactive)
 */
export const getAllAdmins = async (): Promise<AdminEntry[]> => {
  const database = await dbPromise;

  const query = `
    SELECT u.discordID, u.name, a.active
    FROM Admins a
    JOIN Users u ON a.discordID = u.discordID
    ORDER BY a.active DESC, u.name ASC
  `;

  const admins = await database.all(query);
  return admins.map((entry: any) => ({
    discordID: entry.discordID,
    name: entry.name,
    active: entry.active === 1,
  }));
};

/**
 * Add a user to the admin table
 */
export const addAdmin = (
  discordID: string,
): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve, reject) => {
    // First check if they're already an admin
    db.get(
      `SELECT * FROM Admins WHERE discordID = ?`,
      [discordID],
      (err, row) => {
        if (err) {
          console.error('Error querying Admins table:', err.message);
          return reject(err);
        }

        if (row) {
          resolve({ success: false, message: 'User is already an admin.' });
        } else {
          // Insert new admin
          db.run(
            `INSERT INTO Admins (discordID, active) VALUES (?, 1)`,
            [discordID],
            function (err) {
              if (err) {
                console.error('Error adding admin:', err.message);
                return reject(err);
              }
              console.log(`Added admin: ${discordID}`);
              resolve({ success: true, message: 'Admin added successfully.' });
            },
          );
        }
      },
    );
  });
};

/**
 * Remove a user from the admin table
 */
export const removeAdmin = (
  discordID: string,
): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM Admins WHERE discordID = ?`,
      [discordID],
      function (err) {
        if (err) {
          console.error('Error removing admin:', err.message);
          return reject(err);
        }

        if (this.changes === 0) {
          resolve({ success: false, message: 'User is not an admin.' });
        } else {
          console.log(`Removed admin: ${discordID}`);
          resolve({ success: true, message: 'Admin removed successfully.' });
        }
      },
    );
  });
};

/**
 * Enable or disable an admin
 */
export const setAdminStatus = (
  discordID: string,
  active: boolean,
): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE Admins SET active = ? WHERE discordID = ?`,
      [active ? 1 : 0, discordID],
      function (err) {
        if (err) {
          console.error('Error updating admin status:', err.message);
          return reject(err);
        }

        if (this.changes === 0) {
          resolve({ success: false, message: 'User is not an admin.' });
        } else {
          console.log(
            `Updated admin ${discordID} status to ${active ? 'active' : 'inactive'}`,
          );
          resolve({
            success: true,
            message: `Admin ${active ? 'enabled' : 'disabled'} successfully.`,
          });
        }
      },
    );
  });
};
