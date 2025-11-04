const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.post("/register", (req, res) => {
  const {
    username,
    emailID,
    app_password,
    fintop_pin,
    description,
    phone_number,
    first_name,
    BankName,
    AccountNumber,
    IFSC_Code,
    AccountType
  } = req.body;

  const userQuery = `
    INSERT INTO users (username, emailID, app_password, fintop_pin, description, phone_number, first_name)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;

  db.query(
    userQuery,
    [username, emailID, app_password, fintop_pin, description, phone_number, first_name],
    (userError, userResults) => {
      if (userError) {
        console.error("Error inserting into users table:", userError);
        return res.status(500).json({ message: "Failed to save user data", error: userError });
      }

      const userId = userResults.insertId;
      const randomAmount = Math.floor(Math.random() * (60000 - 55000 + 1)) + 55000;

      const bankQuery = `
        INSERT INTO BankAccount (UserID, BankName, AccountNumber, IFSC_Code, AccountType, Amount)
        VALUES (?, ?, ?, ?, ?, ?);
      `;

      db.query(
        bankQuery,
        [userId, BankName, AccountNumber, IFSC_Code, AccountType, randomAmount],
        (bankError) => {
          if (bankError) {
            console.error("Error inserting into BankAccount table:", bankError);
            db.query("DELETE FROM users WHERE user_id = ?", [userId], (rollbackError) => {
              if (rollbackError) console.error("Rollback failed:", rollbackError);
            });
            return res.status(500).json({ message: "Failed to save bank account data", error: bankError });
          }
          res.status(201).json({ message: "User and bank account created successfully" });
        }
      );
    }
  );
});

router.post("/authenticate", (req, res) => {
  const { emailID, app_password } = req.body;

  const query = `
    SELECT * FROM users 
    WHERE emailID = ? AND app_password = ?;
  `;

  db.query(query, [emailID, app_password], (error, results) => {
    if (error) {
      console.error("Error during authentication:", error);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid emailID or app_password" });
    }

    const user = results[0];

    const logQuery = `
      INSERT INTO log (user_id, login_type)
      VALUES (?, 'user');
    `;
    db.query(logQuery, [user.user_id], (logError) => {
      if (logError) {
        console.error("Error inserting login log:", logError);
        return res.status(500).json({ message: "Server error" });
      }

      const bankQuery = `
        SELECT * FROM BankAccount
        WHERE UserID = ?;
      `;
      db.query(bankQuery, [user.user_id], (bankError, bankResults) => {
        if (bankError) {
          console.error("Error fetching bank account details:", bankError);
          return res.status(500).json({ message: "Server error" });
        }
        const bankAccount = bankResults[0] || null;

        const fintopQuery = `
          SELECT fintop_id FROM fintop
          WHERE user_id = ?;
        `;
        db.query(fintopQuery, [user.user_id], (fintopError, fintopResults) => {
          if (fintopError) {
            console.error("Error fetching fintop_id:", fintopError);
            return res.status(500).json({ message: "Server error" });
          }
          const fintopId = fintopResults.length > 0 ? fintopResults[0].fintop_id : null;

          const badgesQuery = `
            SELECT 
              b.badge_id, 
              b.tier, 
              b.title, 
              b.reward_amount,
              ub.awarded_at
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.badge_id
            WHERE ub.user_id = ?
            ORDER BY ub.awarded_at ASC;
          `;
          db.query(badgesQuery, [user.user_id], (badgeErr, badgeResults) => {
            if (badgeErr) {
              console.error("Error fetching user badges:", badgeErr);
              return res.status(500).json({ message: "Server error" });
            }

            delete user.app_password;
            delete user.fintop_pin;

            res.status(200).json({
              ...user,
              BankAccount: bankAccount,
              fintop_id: fintopId,
              badges: badgeResults  
            });
          });
        });
      });
    });
  });
});

router.post('/check-unique', (req, res) => {
  const { user_id, username, emailID, phone_number, AccountNumber } = req.body;

  let existingFields = [];
  let conditions = [];
  let userQueryParams = [];

  if (username) {
    conditions.push('username = ?');
    userQueryParams.push(username);
  }

  if (emailID) {
    conditions.push('emailID = ?');
    userQueryParams.push(emailID);
  }

  if (phone_number) {
    conditions.push('phone_number = ?');
    userQueryParams.push(phone_number);
  }

  let checkUsersTable = conditions.length > 0;

  const respond = () => {
    if (existingFields.length > 0) {
      res.status(200).json({ exists: true, fields: Array.from(new Set(existingFields)) });
    } else {
      res.status(200).json({ exists: false });
    }
  };

  if (checkUsersTable) {
    let userQuery = `SELECT username, emailID, phone_number FROM users WHERE (${conditions.join(' OR ')})`;

    if (user_id) {
      userQuery += ' AND user_id != ?';
      userQueryParams.push(user_id);
    }

    db.query(userQuery, userQueryParams, (userError, userResults) => {
      if (userError) {
        console.error('Error checking unique fields in users table:', userError);
        return res.status(500).json({ message: 'Server error' });
      }

      if (userResults.length > 0) {
        userResults.forEach((row) => {
          if (username && row.username === username) existingFields.push('Username');
          if (emailID && row.emailID === emailID) existingFields.push('Email ID');
          if (phone_number && row.phone_number === phone_number) existingFields.push('Phone Number');
        });
      }

      if (AccountNumber) {
        checkAccountNumber();
      } else {
        respond();
      }
    });
  } else if (AccountNumber) {
    checkAccountNumber();
  } else {
    res.status(200).json({ exists: false });
  }

  function checkAccountNumber() {
    const bankQuery = 'SELECT AccountNumber FROM BankAccount WHERE AccountNumber = ?';
    db.query(bankQuery, [AccountNumber], (bankError, bankResults) => {
      if (bankError) {
        console.error('Error checking AccountNumber:', bankError);
        return res.status(500).json({ message: 'Server error' });
      }

      if (bankResults.length > 0) {
        existingFields.push('Account Number');
      }

      respond();
    });
  }
});

router.put('/update', (req, res) => {
  const { user_id, username, first_name, emailID, description } = req.body;

  const query = `
    UPDATE users
    SET username = ?, first_name = ?, emailID = ?, description = ?
    WHERE user_id = ?;
  `;

  db.query(
    query,
    [username, first_name, emailID, description, user_id],
    (error, results) => {
      if (error) {
        console.error('Error updating user data:', error);
        return res
          .status(500)
          .json({ message: 'Failed to update user data', error });
      }

      const fetchQuery = `SELECT * FROM users WHERE user_id = ?;`;
      db.query(fetchQuery, [user_id], (fetchErr, userResults) => {
        if (fetchErr) {
          console.error('Error fetching updated user data:', fetchErr);
          return res
            .status(500)
            .json({ message: 'Failed to fetch updated user data', error: fetchErr });
        }
        const user = userResults[0];
        delete user.app_password;
        delete user.fintop_pin;

        const bankQuery = `SELECT * FROM BankAccount WHERE UserID = ?;`;
        db.query(bankQuery, [user_id], (bankErr, bankResults) => {
          if (bankErr) {
            console.error('Error fetching bank account details:', bankErr);
            return res
              .status(500)
              .json({ message: 'Server error', error: bankErr });
          }
          const bankAccount = bankResults[0] || null;

          const fintopQuery = `SELECT fintop_id FROM fintop WHERE user_id = ?;`;
          db.query(fintopQuery, [user_id], (fintopErr, fintopResults) => {
            if (fintopErr) {
              console.error('Error fetching fintop_id:', fintopErr);
              return res
                .status(500)
                .json({ message: 'Server error', error: fintopErr });
            }
            const fintop_id = fintopResults.length
              ? fintopResults[0].fintop_id
              : null;

            res.status(200).json({
              ...user,
              BankAccount: bankAccount,
              fintop_id,
            });
          });
        });
      });
    }
  );
});

function getLastLoginUser(callback) {
  const query = `
    SELECT
      l.user_id,
      f.fintop_id,
      u.fintop_pin
    FROM log l
    JOIN fintop f  ON f.user_id   = l.user_id
    JOIN users u    ON u.user_id   = l.user_id
    WHERE l.login_type = 'user'
    ORDER BY l.time_stamp DESC
    LIMIT 1
  `;
  db.query(query, (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(new Error("No user found"));
    callback(null, results[0]);
  });
}

router.post('/contactinfo', (req, res) => {
  const query = `
    SELECT 
      u.first_name, 
      u.phone_number, 
      f.fintop_id,
      pr.status AS request_status,
      pr.amount AS request_amount
    FROM users u
    JOIN fintop f ON u.user_id = f.user_id
    LEFT JOIN (
      SELECT pr1.from_id, pr1.status, pr1.amount
      FROM payment_request pr1
      JOIN (
        SELECT from_id, MAX(request_id) AS max_request_id
        FROM payment_request
        WHERE status = 'Pending'
        GROUP BY from_id
      ) pr2 ON pr1.from_id = pr2.from_id AND pr1.request_id = pr2.max_request_id
      WHERE pr1.status = 'Pending'
    ) pr ON f.fintop_id = pr.from_id
    ORDER BY u.user_id;
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error('Error retrieving contact information:', error);
      return res.status(500).json({ message: 'Failed to retrieve contact information', error });
    }

    res.status(200).json(results);
  });
});

router.post("/pay", (req, res) => {
  const { toFintopId, amount, fintopPin } = req.body;

  getLastLoginUser((err, lastUser) => {
    if (err) {
      console.error("Error fetching last login user:", err);
      return res.status(500).json({ message: "Error fetching user details" });
    }

    const { fintop_id: fromFintopId, fintop_pin } = lastUser;
    if (parseInt(fintopPin, 10) !== parseInt(fintop_pin, 10)) {
      return res.status(400).json({ message: "Invalid PIN" });
    }

    const balanceQ = `
      SELECT ba.Amount AS balance
      FROM BankAccount ba
      JOIN fintop f ON ba.UserID = f.user_id
      WHERE f.fintop_id = ?;
    `;
    db.query(balanceQ, [fromFintopId], (balErr, balRows) => {
      if (balErr) {
        console.error("Error fetching balance:", balErr);
        return res.status(500).json({ message: "Could not fetch balance" });
      }
      const balance = (balRows[0] && balRows[0].balance) || 0;

      const status = balance < amount ? 'Failure' : 'Success';
      const insertQ = `
        INSERT INTO transactions (from_id, to_id, amount, status)
        VALUES (?, ?, ?, ?)
      `;
      db.query(insertQ, [fromFintopId, toFintopId, amount, status], (txErr, txRes) => {
        if (txErr) {
          console.error("Error inserting transaction:", txErr);
          return res.status(500).json({ message: "Transaction failed" });
        }

        if (status === 'Failure') {
          return res.status(400).json({ message: "Transaction failure: insufficient balance" });
        }

        const transactionId = txRes.insertId;
        const fetchTsQ = `SELECT time_stamp FROM transactions WHERE transaction_id = ?`;
        db.query(fetchTsQ, [transactionId], (tsErr, tsRows) => {
          if (tsErr || !tsRows.length) {
            console.error("Error fetching timestamp:", tsErr);
            return res.status(500).json({ message: "Could not fetch transaction time" });
          }
          const txnTime = tsRows[0].time_stamp;

          db.query(balanceQ, [fromFintopId], (bal2Err, bal2Rows) => {
            if (bal2Err || !bal2Rows.length) {
              console.error("Error fetching balance:", bal2Err);
              return res.status(500).json({ message: "Could not fetch balance" });
            }
            const newBalance = bal2Rows[0].balance;

            const badgesQ = `
              SELECT b.title, b.reward_amount, ub.awarded_at
              FROM user_badges ub
              JOIN badges b ON ub.badge_id = b.badge_id
              JOIN fintop f ON ub.user_id = f.user_id
              WHERE f.fintop_id = ?
                AND ub.awarded_at >= ?
            `;
            db.query(badgesQ, [fromFintopId, txnTime], (bgErr, bgRows) => {
              if (bgErr) {
                console.error("Error fetching badges:", bgErr);
                return res.status(500).json({ message: "Could not fetch badges" });
              }
              res.json({
                message: "Transaction successful",
                balance: newBalance,
                newBadges: bgRows,
              });
            });
          });
        });
      });
    });
  });
});

router.post('/request', (req, res) => {
  const { toFintopId, amount, fintopPin } = req.body;

  getLastLoginUser((err, lastUser) => {
    if (err) {
      console.error('Error fetching last login user:', err);
      return res.status(500).json({ message: 'Error fetching user details' });
    }

    const { fintop_id: fromFintopId, fintop_pin } = lastUser;

    if (parseInt(fintopPin) !== parseInt(fintop_pin)) {
      return res.status(400).json({ message: 'Invalid PIN' });
    }

    const checkQuery = `
      SELECT request_id FROM payment_request
      WHERE from_id = ? AND to_id = ? AND status = 'Pending';
    `;

    db.query(checkQuery, [fromFintopId, toFintopId], (err, results) => {
      if (err) {
        console.error('Error checking existing payment request:', err);
        return res.status(500).json({ message: 'Failed to process payment request' });
      }

      if (results.length > 0) {
        const updateQuery = `
          UPDATE payment_request
          SET amount = ?, time_stamp = CURRENT_TIMESTAMP
          WHERE request_id = ?;
        `;

        db.query(updateQuery, [amount, results[0].request_id], (err) => {
          if (err) {
            console.error('Error updating payment request:', err);
            return res.status(500).json({ message: 'Failed to update payment request' });
          }

          res.json({ message: 'Payment request updated' });
        });
      } else {
        const insertQuery = `
          INSERT INTO payment_request (from_id, to_id, amount, status)
          VALUES (?, ?, ?, 'Pending');
        `;

        db.query(insertQuery, [fromFintopId, toFintopId, amount], (err) => {
          if (err) {
            console.error('Error creating payment request:', err);
            return res.status(500).json({ message: 'Payment request failed' });
          }

          res.json({ message: 'Payment request created' });
        });
      }
    });
  });
});

router.get('/reward', (req, res) => {
  getLastLoginUser((err, lastUser) => {
    if (err) {
      console.error('Error fetching last login user:', err);
      return res.status(500).json({ message: 'Error fetching user details' });
    }

    const { user_id, fintop_id } = lastUser;
    const doClaim = req.query.claim === 'true';

    const afterClaim = () => {
      const badgesQ = `
        SELECT
          b.badge_id,
          b.tier,
          b.title,
          b.threshold,
          b.reward_amount,
          ub.awarded_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.badge_id
        WHERE ub.user_id = ?
        ORDER BY b.tier ASC, ub.awarded_at ASC;
      `;
      db.query(badgesQ, [user_id], (badgeErr, badgeResults) => {
        if (badgeErr) {
          console.error('Error fetching badge details:', badgeErr);
          return res.status(500).json({ message: 'Error fetching badge details' });
        }

        const spendQ = `
          SELECT COALESCE(SUM(amount), 0) AS total_spent
          FROM transactions
          WHERE from_id = ? AND status = 'Success';
        `;
        db.query(spendQ, [fintop_id], (spendErr, spendResults) => {
          if (spendErr) {
            console.error('Error fetching total spend:', spendErr);
            return res.status(500).json({ message: 'Error fetching total spend' });
          }

          const total_spent = spendResults[0]?.total_spent || 0;
          res.json({ badges: badgeResults, total_spent });
        });
      });
    };

    if (doClaim) {
      db.query('CALL claim_next_badge(?, @new_badge_id)', [user_id], (procErr) => {
        if (procErr) {
          console.error('Error claiming next badge:', procErr);
          return res.status(500).json({ message: 'Error claiming badge' });
        }
        afterClaim();
      });
    } else {
      afterClaim();
    }
  });
});

router.post('/transactions-history', (req, res) => {
  const { transaction_id } = req.body;

  if (!transaction_id) {
    const query = `
      SELECT
          u.first_name AS FirstName,
          u.phone_number AS MobileNumber,
          t.time_stamp AS TimeStamp,
          t.amount AS Amount,
          t.transaction_id AS TransactionID,
          t.from_id AS SenderID,
          t.to_id AS RecipientID
      FROM log l
      JOIN fintop f 
        ON f.user_id = l.user_id
      JOIN transactions t 
        ON t.from_id = f.fintop_id OR t.to_id = f.fintop_id
      LEFT JOIN fintop f_related 
        ON f_related.fintop_id = CASE
          WHEN t.from_id = f.fintop_id THEN t.to_id
          WHEN t.to_id = f.fintop_id THEN t.from_id
        END
      LEFT JOIN users u 
        ON u.user_id = f_related.user_id
      WHERE l.login_type = 'user'
        AND l.time_stamp = (
            SELECT MAX(time_stamp)
            FROM log
            WHERE login_type = 'user'
        )
      ORDER BY t.time_stamp DESC;
    `;
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching transactions:', err);
        return res.status(500).json({ message: 'Error fetching transactions' });
      }
      return res.json(results);
    });
  } else {
    const detailQuery = `
      SELECT
        t.transaction_id,
        t.amount,
        t.time_stamp,
        t.status,

        sender.first_name   AS sender_name,
        sender.phone_number AS sender_phone,
        f_from.fintop_id    AS sender_fintop_id,

        receiver.first_name   AS receiver_name,
        receiver.phone_number AS receiver_phone,
        f_to.fintop_id        AS receiver_fintop_id

      FROM transactions t
      JOIN fintop f_from
        ON t.from_id = f_from.fintop_id
      JOIN users sender
        ON f_from.user_id = sender.user_id

      JOIN fintop f_to
        ON t.to_id = f_to.fintop_id
      JOIN users receiver
        ON f_to.user_id = receiver.user_id

      WHERE t.transaction_id = ?;
    `;
    db.query(detailQuery, [transaction_id], (err, results) => {
      if (err) {
        console.error('Error fetching transaction details:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      if (!results || results.length === 0) {
        return res.status(404).json({ message: 'No transaction found' });
      }
      return res.status(200).json(results[0]);
    });
  }
});

module.exports = router;


