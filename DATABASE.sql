drop database if exists dbms_mini;
create database dbms_mini;
use dbms_mini;

CREATE TABLE users (
  user_id      INT AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(50),
  phone_number VARCHAR(15),
  emailID      VARCHAR(100) UNIQUE,
  app_password VARCHAR(100),
  fintop_pin   VARCHAR(4),
  description  TEXT,
  first_name   VARCHAR(50)
);

CREATE TABLE BankAccount (
  AccountID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL,
  BankName VARCHAR(100) NOT NULL,
  AccountNumber VARCHAR(20) UNIQUE NOT NULL,
  IFSC_Code VARCHAR(11) NOT NULL,
  AccountType VARCHAR(50), 
  Amount DECIMAL(10, 2),
  FOREIGN KEY (UserID) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create the fintop table
CREATE TABLE fintop (
    fintop_id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    accountID INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (accountID) REFERENCES BankAccount(AccountID)
);


DELIMITER //
CREATE TRIGGER create_fintop_id
AFTER INSERT ON BankAccount
FOR EACH ROW
BEGIN
    DECLARE p_phone_number VARCHAR(15);
    DECLARE p_fintopnumber VARCHAR(15);
    DECLARE p_ifsc_prefix VARCHAR(4);

    -- Retrieve the phone_number from the users table and store it in the variable
    SELECT phone_number INTO p_phone_number 
    FROM users 
    WHERE user_id = NEW.UserID;

    -- Ensure the phone_number exists
    IF p_phone_number IS NOT NULL THEN
        -- Remove '+91 ' (including the space) from the phone_number
        SET p_fintopnumber = REPLACE(p_phone_number, '+91 ', '');

        -- Get the first 4 characters of the IFSC_Code
        SET p_ifsc_prefix = LEFT(NEW.IFSC_Code, 4);

        -- Insert the fintop_id into the fintop table
        INSERT INTO fintop (fintop_id, user_id, accountID)
        VALUES (CONCAT(p_fintopnumber, '@', p_ifsc_prefix), NEW.UserID, NEW.AccountID);
    ELSE
        -- Handle the case where phone_number is NULL 
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User phone number not found for the given UserID';
    END IF;
END //
DELIMITER ;

INSERT INTO users (username, first_name, phone_number, emailID, app_password, fintop_pin, description)
VALUES
('Striker', 'Suds', '+91 9876543210', 'Striker@gmail.com', 'Q@z!p$123', 1234, 'Regular user'),
('Bighari', 'hari', '+91 8765432109', 'bighari@gmail.com', '7kP#4s!890', 5678, 'Frequent user'),
('Samsam', 'Sam', '+91 7654321098', 'sam@gmail.com', '5T#m6W@021', 9012, 'Premium user'),
('Jigaboo', 'Suu', '+91 9898989898', 'Chari@gmail.com', 'ZxP@123!T5', 3456, 'Regular user'),
('ShyamGames', 'Games', '+91 8765432190', 'vs@gmail.com', 'R2T@!Kj90L', 6789, 'Frequent user');

INSERT INTO BankAccount (UserID, BankName, AccountNumber, IFSC_Code, AccountType, Amount)
VALUES
(1, 'State Bank of India', '123456789', 'SBIN0001234', 'savings', 50000.00),
(2, 'HDFC Bank', '987654321', 'HDFC0002345', 'current', 60000.00),
(3, 'ICICI Bank', '765432197', 'ICIC0003456', 'business', 75000.00), 
(4, 'Punjab National Bank', '654321987', 'PUNB0004567', 'savings', 55000.00),
(5, 'Axis Bank', '543219876', 'UTIB0005678', 'current', 50000.00);

SELECT * FROM users;
SELECT * FROM BankAccount;
SELECT * FROM fintop;

CREATE TABLE log (
    log_sequence INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    login_type ENUM('user') NOT NULL,
    time_stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    from_id VARCHAR(255) NOT NULL,
    to_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    time_stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Success', 'Failure') NOT NULL DEFAULT 'Success',
    FOREIGN KEY (from_id) REFERENCES fintop(fintop_id),
    FOREIGN KEY (to_id) REFERENCES fintop(fintop_id)
);

CREATE TABLE payment_request (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    from_id VARCHAR(255) NOT NULL,
    to_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    time_stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (from_id) REFERENCES fintop(fintop_id),
    FOREIGN KEY (to_id) REFERENCES fintop(fintop_id)
);


DELIMITER //
CREATE TRIGGER process_transaction
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    DECLARE from_account_id INT;
    DECLARE to_account_id INT;

    -- Get the accountID for the from_id
    SELECT accountID INTO from_account_id
    FROM fintop
    WHERE fintop_id = NEW.from_id;

    -- Get the accountID for the to_id
    SELECT accountID INTO to_account_id
    FROM fintop
    WHERE fintop_id = NEW.to_id;

    -- Deduct the amount from the from_account
    UPDATE BankAccount
    SET Amount = Amount - NEW.amount
    WHERE AccountID = from_account_id;

    -- Add the amount to the to_account
    UPDATE BankAccount
    SET Amount = Amount + NEW.amount
    WHERE AccountID = to_account_id;
END //
DELIMITER ;


DELIMITER //
CREATE TRIGGER update_payment_request_status
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    DECLARE total_amount DECIMAL(10, 2);
    DECLARE required_amount DECIMAL(10, 2);
    DECLARE req_time TIMESTAMP;

    -- Find the timestamp and required amount of the matching pending request
    SELECT time_stamp, amount
    INTO req_time, required_amount
    FROM payment_request
    WHERE from_id = NEW.to_id
      AND to_id = NEW.from_id
      AND status = 'Pending'
    ORDER BY time_stamp ASC
    LIMIT 1;

    -- If a matching request is found
    IF req_time IS NOT NULL THEN
        -- Calculate the total amount transferred after the request's timestamp
        SELECT COALESCE(SUM(amount), 0)
        INTO total_amount
        FROM transactions
        WHERE from_id = NEW.from_id
          AND to_id = NEW.to_id
          AND time_stamp >= req_time;

        -- If total amount meets or exceeds the request amount, approve the request
        IF total_amount >= required_amount THEN
            UPDATE payment_request
            SET status = 'Approved'
            WHERE from_id = NEW.to_id
              AND to_id = NEW.from_id
              AND time_stamp = req_time
              AND status = 'Pending'
            LIMIT 1;
        END IF;
    END IF;
END //
DELIMITER ;

 select * from payment_request;
 select * from transactions;
 select * from payment_request;


CREATE TABLE IF NOT EXISTS badges (
  badge_id       INT AUTO_INCREMENT PRIMARY KEY,
  tier           INT           NOT NULL,               
  title          VARCHAR(50)   NOT NULL,
  threshold      DECIMAL(10,2) NOT NULL,               
  reward_amount  DECIMAL(10,2) NOT NULL                
);

INSERT INTO badges (tier, title, threshold, reward_amount)
VALUES
  (4, 'Bronze',   5000,    500),
  (3, 'Silver',  25000,   2500),
  (2, 'Gold',    50000,   5000),
  (1, 'Diamond',100000,   1000)
ON DUPLICATE KEY UPDATE title = VALUES(title);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id    INT       NOT NULL,
  badge_id   INT       NOT NULL,
  awarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id)  REFERENCES users(user_id),
  FOREIGN KEY (badge_id) REFERENCES badges(badge_id)
);

DELIMITER //
DROP PROCEDURE IF EXISTS claim_next_badge;
//
CREATE PROCEDURE claim_next_badge(
  IN  p_user_id  INT,
  OUT p_badge_id INT
)
BEGIN
  DECLARE total_spent DECIMAL(10,2);

  SELECT COALESCE(SUM(t.amount),0)
    INTO total_spent
    FROM transactions t
    JOIN fintop f ON t.from_id = f.fintop_id
   WHERE f.user_id = p_user_id
     AND t.status = 'Success';

  SELECT b.badge_id
    INTO p_badge_id
    FROM badges b
    LEFT JOIN user_badges ub
      ON ub.user_id = p_user_id
     AND ub.badge_id = b.badge_id
   WHERE ub.badge_id IS NULL
     AND total_spent >= b.threshold
   ORDER BY b.tier DESC
   LIMIT 1;

  IF p_badge_id IS NOT NULL THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, p_badge_id);
  END IF;
END;
//
DELIMITER ;

DROP TRIGGER IF EXISTS credit_badge_reward;
DELIMITER //
CREATE TRIGGER credit_badge_reward
AFTER INSERT ON user_badges
FOR EACH ROW
BEGIN
  DECLARE acctID    INT;
  DECLARE rewardAmt DECIMAL(10,2);

  SELECT b.reward_amount
    INTO rewardAmt
    FROM badges b
   WHERE b.badge_id = NEW.badge_id;

  SELECT f.accountID
    INTO acctID
    FROM fintop f
   WHERE f.user_id = NEW.user_id;

  UPDATE BankAccount
     SET Amount = Amount + rewardAmt
   WHERE AccountID = acctID;
END;
//
DELIMITER ;
