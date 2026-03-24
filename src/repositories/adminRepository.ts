import pool from "../config/db";

export interface Admin {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "admin";
  created_at: Date;
}

export interface CreateSellerData {
  name: string;
  email: string;
  mobile: string;
  country: string;
  state: string;
  skills: string[];   
  password: string;
}


export interface CreateAdminData {
  name: string;
  email: string;
  password: string;
  role: "admin";
}

export const createAdmin = async (data: CreateAdminData): Promise<Admin> => {
  const [result]: any = await pool.query(
    `INSERT INTO admins (name, email, password, role) 
     VALUES (?, ?, ?, ?)`,
    [data.name, data.email, data.password, data.role]
  );

  return {
    id: result.insertId,
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    created_at: new Date(),
  };
};

export const findAdminByEmail = async (email: string): Promise<Admin | null> => {
  const [rows]: any = await pool.query(
    "SELECT * FROM admins WHERE email = ? LIMIT 1",
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const findSellerByEmail = async (email: string): Promise<any | null> => {
  const [rows]: any = await pool.query(
    "SELECT id, email FROM sellers WHERE email = ? LIMIT 1",
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
};


export const createSeller = async (data: CreateSellerData): Promise<number> => {
  const [result]: any = await pool.query(
    `INSERT INTO sellers (name, email, mobile, country, state, skills, password)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.email,
      data.mobile,
      data.country,
      data.state,
      JSON.stringify(data.skills),  
      data.password,
    ]
  );
  return result.insertId; 
};


export const getAllSellers = async (
  page: number,
  limit: number
): Promise<{ sellers: any[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [sellers]: any = await pool.query(
    `SELECT id, name, email, mobile, country, state, skills, role, created_at
     FROM sellers
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const [countResult]: any = await pool.query(
    "SELECT COUNT(*) as total FROM sellers"
  );
  const total = countResult[0].total;

  const parsedSellers = sellers.map((seller: any) => ({
    ...seller,
    skills: typeof seller.skills === "string"
      ? JSON.parse(seller.skills)
      : seller.skills,
  }));

  return { sellers: parsedSellers, total };
};
