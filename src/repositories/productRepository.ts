import pool from "../config/db";

export interface CreateProductData {
  seller_id: number;
  name: string;
  description: string;
}

export interface CreateBrandData {
  product_id: number;
  brand_name: string;
  detail: string;
  image: string;      
  price: number;
}

export interface ProductWithBrands {
  id: number;
  name: string;
  description: string;
  seller_id: number;
  created_at: Date;
  brands: BrandData[];
  total_price: number;
}

export interface BrandData {
  id: number;
  brand_name: string;
  detail: string;
  image: string;
  price: number;
}

export const createProduct = async (data: CreateProductData): Promise<number> => {
  const [result]: any = await pool.query(
    "INSERT INTO products (seller_id, name, description) VALUES (?, ?, ?)",
    [data.seller_id, data.name, data.description]
  );
  return result.insertId;
};

export const createBrand = async (data: CreateBrandData): Promise<number> => {
  const [result]: any = await pool.query(
    `INSERT INTO brands (product_id, brand_name, detail, image, price)
     VALUES (?, ?, ?, ?, ?)`,
    [data.product_id, data.brand_name, data.detail, data.image, data.price]
  );
  return result.insertId;
};


export const getProductsBySeller = async (
  sellerId: number,
  page: number,
  limit: number
): Promise<{ products: ProductWithBrands[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [products]: any = await pool.query(
    `SELECT id, name, description, seller_id, created_at
     FROM products
     WHERE seller_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [sellerId, limit, offset]
  );

  const [countResult]: any = await pool.query(
    "SELECT COUNT(*) as total FROM products WHERE seller_id = ?",
    [sellerId]
  );
  const total = countResult[0].total;

  const productsWithBrands: ProductWithBrands[] = await Promise.all(
    products.map(async (product: any) => {
      const [brands]: any = await pool.query(
        `SELECT id, brand_name, detail, image, price
         FROM brands
         WHERE product_id = ?
         ORDER BY id ASC`,
        [product.id]
      );

      const total_price = brands.reduce(
        (sum: number, brand: any) => sum + parseFloat(brand.price),
        0
      );

      return {
        ...product,
        brands,
        total_price: parseFloat(total_price.toFixed(2)),
      };
    })
  );

  return { products: productsWithBrands, total };
};

export const getProductById = async (
  productId: number
): Promise<ProductWithBrands | null> => {
  const [products]: any = await pool.query(
    "SELECT id, name, description, seller_id, created_at FROM products WHERE id = ? LIMIT 1",
    [productId]
  );

  if (products.length === 0) return null;

  const product = products[0];

  const [brands]: any = await pool.query(
    "SELECT id, brand_name, detail, image, price FROM brands WHERE product_id = ? ORDER BY id ASC",
    [productId]
  );

  const total_price = brands.reduce(
    (sum: number, brand: any) => sum + parseFloat(brand.price),
    0
  );

  return {
    ...product,
    brands,
    total_price: parseFloat(total_price.toFixed(2)),
  };
};

export const deleteProductById = async (productId: number): Promise<boolean> => {
  const [result]: any = await pool.query(
    "DELETE FROM products WHERE id = ?",
    [productId]
  );
  return result.affectedRows > 0;
};
