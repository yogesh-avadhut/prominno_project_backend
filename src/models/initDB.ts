import pool from "../config/db";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const initDB = async (): Promise<void> => {
  const conn = await pool.getConnection();

  try {
    console.log("🚀 Starting database initialization...");

    //admin table 
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(100)         NOT NULL,
        email       VARCHAR(150)         NOT NULL UNIQUE,
        password    VARCHAR(255)         NOT NULL,
        role        ENUM('admin')        NOT NULL DEFAULT 'admin',
        created_at  TIMESTAMP            DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(" admins table created");

//seller table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sellers (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(100)         NOT NULL,
        email       VARCHAR(150)         NOT NULL UNIQUE,
        mobile      VARCHAR(15)          NOT NULL,
        country     VARCHAR(100)         NOT NULL,
        state       VARCHAR(100)         NOT NULL,
        skills      JSON                 NOT NULL,
        password    VARCHAR(255)         NOT NULL,
        role        ENUM('seller')       NOT NULL DEFAULT 'seller',
        created_at  TIMESTAMP            DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("sellers table created");

//product table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        seller_id    INT           NOT NULL,
        name         VARCHAR(255)  NOT NULL,
        description  TEXT          NOT NULL,
        created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
      )
    `);
    console.log("table products created");

    //brand table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        product_id   INT            NOT NULL,
        brand_name   VARCHAR(255)   NOT NULL,
        detail       TEXT           NOT NULL,
        image        VARCHAR(500)   NOT NULL,
        price        DECIMAL(10,2)  NOT NULL,
        created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log("brands table created ");

//create demo admin 
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const [existing]: any = await conn.query(
      "SELECT id FROM admins WHERE email = ?",
      [adminEmail]
    );

    if (existing.length === 0) {
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || "Admin@123",
        10
      );
      await conn.query(
        "INSERT INTO admins (name, email, password) VALUES (?, ?, ?)",
        [
          process.env.ADMIN_NAME || "Super Admin",
          adminEmail,
          hashedPassword,
        ]
      );
      console.log(`demo admin created: ${adminEmail}`);
    } else {
      console.log("demo admin already exists...");
    }

    console.log("Database create complete");
  } catch (error) {
    console.error("error come db not created :", error);
    throw error;
  } finally {
    conn.release();
    process.exit(0);
  }
};

initDB();
