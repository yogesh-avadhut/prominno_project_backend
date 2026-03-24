import pool from "../config/db";

export interface Seller {
  id: number;
  name: string;
  email: string;
  password: string;
  mobile: string;
  country: string;
  state: string;
  skills: string; 
  role: "seller";
  created_at: Date;
}

export const findSellerByEmail = async (email: string): Promise<Seller | null> => {
  const [rows]: any = await pool.query(
    "SELECT * FROM sellers WHERE email = ? LIMIT 1",
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const findSellerById = async (id: number): Promise<Seller | null> => {
  const [rows]: any = await pool.query(
    "SELECT id, name, email, mobile, country, state, skills, role FROM sellers WHERE id = ? LIMIT 1",
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};
