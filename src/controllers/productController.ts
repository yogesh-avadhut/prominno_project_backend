import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import * as productRepository from "../repositories/productRepository";
import { successResponse, errorResponse } from "../utils/response";

export const addProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const sellerId = req.user!.id; 
    const { name, description } = req.body;

    if (!name || !description) {
      errorResponse(res, "Product name and description are required.", 400);
      return;
    }

    let brandsData: Array<{ brand_name: string; detail: string; price: number }> = [];

    if (req.body.brands) {
      if (typeof req.body.brands === "string") {
        try {
          brandsData = JSON.parse(req.body.brands);
        } catch {
          errorResponse(res, "Invalid brands format. Must be valid JSON.", 400);
          return;
        }
      } else if (Array.isArray(req.body.brands)) {
        brandsData = req.body.brands;
      }
    }

    if (!brandsData || brandsData.length === 0) {
      errorResponse(res, "At least one brand is required.", 400);
      return;
    }

    for (let i = 0; i < brandsData.length; i++) {
      const brand = brandsData[i];
      if (!brand.brand_name || !brand.detail || !brand.price) {
        errorResponse(
          res,
          `Brand at index ${i} is missing required fields: brand_name, detail, price.`,
          400
        );
        return;
      }
      if (isNaN(Number(brand.price)) || Number(brand.price) < 0) {
        errorResponse(res, `Brand price at index ${i} must be a valid positive number.`, 400);
        return;
      }
    }

    const uploadedFiles = req.files as Express.Multer.File[];
    if (!uploadedFiles || uploadedFiles.length !== brandsData.length) {
      errorResponse(
        res,
        `Number of uploaded images (${uploadedFiles?.length || 0}) must match number of brands (${brandsData.length}).`,
        400
      );
      return;
    }

    const productId = await productRepository.createProduct({
      seller_id: sellerId,
      name: name.trim(),
      description: description.trim(),
    });

    const createdBrands = [];
    for (let i = 0; i < brandsData.length; i++) {
      const brand = brandsData[i];
      const imageFile = uploadedFiles[i];

      const imagePath = `${process.env.UPLOAD_PATH || "uploads/brands"}/${imageFile.filename}`;

      const brandId = await productRepository.createBrand({
        product_id: productId,
        brand_name: brand.brand_name.trim(),
        detail: brand.detail.trim(),
        image: imagePath,
        price: Number(brand.price),
      });

      createdBrands.push({
        id: brandId,
        brand_name: brand.brand_name,
        detail: brand.detail,
        image: imagePath,
        price: Number(brand.price),
      });
    }

    successResponse(
      res,
      "Product added successfully.",
      {
        product: {
          id: productId,
          name,
          description,
          seller_id: sellerId,
          brands: createdBrands,
        },
      },
      201
    );
  } catch (error) {
    console.error("Add product error:", error);
    errorResponse(res, "Internal server error while adding product.", 500);
  }
};

export const listProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const sellerId = req.user!.id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page < 1 || limit < 1) {
      errorResponse(res, "Page and limit must be positive numbers.", 400);
      return;
    }

    if (limit > 100) {
      errorResponse(res, "Limit cannot exceed 100 per page.", 400);
      return;
    }

    const { products, total } = await productRepository.getProductsBySeller(
      sellerId,
      page,
      limit
    );

    const totalPages = Math.ceil(total / limit);

    successResponse(res, "Products fetched successfully.", {
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("List products error:", error);
    errorResponse(res, "Internal server error while fetching products.", 500);
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const sellerId = req.user!.id;
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      errorResponse(res, "Invalid product ID.", 400);
      return;
    }

    const product = await productRepository.getProductById(productId);

    if (!product) {
      errorResponse(res, "Product not found.", 404);
      return;
    }

    if (product.seller_id !== sellerId) {
      errorResponse(res, "Unauthorized. You can only delete your own products.", 403);
      return;
    }

    for (const brand of product.brands) {
      if (brand.image && fs.existsSync(brand.image)) {
        fs.unlinkSync(brand.image); //image remove
      }
    }

    await productRepository.deleteProductById(productId);

    successResponse(res, "Product deleted successfully.", null, 200);
  } catch (error) {
    console.error("Delete product error:", error);
    errorResponse(res, "Internal server error while deleting product.", 500);
  }
};

export const viewProductPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const sellerId = req.user!.id;
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      errorResponse(res, "Invalid product ID.", 400);
      return;
    }

    const product = await productRepository.getProductById(productId);

    if (!product) {
      errorResponse(res, "Product not found.", 404);
      return;
    }

    if (product.seller_id !== sellerId) {
      errorResponse(res, "Unauthorized. You can only view PDF for your own products.", 403);
      return;
    }

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="product-${productId}.pdf"`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

    // ---- Header ----
    doc.fontSize(24).fillColor("#333").text("Product Details", { align: "center" }).moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#cccccc").stroke().moveDown(1);

    // ---- Product Info ----
    doc.fontSize(18).fillColor("#222").text("Product Name:").moveDown(0.2);
    doc.fontSize(16).fillColor("#555").text(product.name).moveDown(0.8);

    doc.fontSize(18).fillColor("#222").text("Description:").moveDown(0.2);
    doc.fontSize(14).fillColor("#555").text(product.description, { lineGap: 4 }).moveDown(1);

    // ---- Brands Section ----
    doc.fontSize(16).fillColor("#222").text("Brand Details:", { underline: true }).moveDown(0.5);

    const imageBoxSize = 100; // fixed box for image

    for (let i = 0; i < product.brands.length; i++) {
      const brand = product.brands[i];

      // Page break if needed
      if (doc.y > pageHeight - imageBoxSize - 50) doc.addPage();

      const startX = doc.x;
      const startY = doc.y;

      // ---- Brand Image ----
      const imagePath = path.resolve(brand.image);
      if (fs.existsSync(imagePath)) {
        try {
          doc.image(imagePath, startX, startY, { width: imageBoxSize, height: imageBoxSize });
        } catch {
          doc.fontSize(10).fillColor("#999").text("[Image not available]", startX, startY, { width: imageBoxSize, align: "center" });
        }
      } else {
        doc.fontSize(10).fillColor("#999").text("[Image not found]", startX, startY, { width: imageBoxSize, align: "center" });
      }

      // ---- Brand Text next to image ----
      const textX = startX + imageBoxSize + 10;
      const textWidth = pageWidth - imageBoxSize - 10;

      let currentY = startY;

      doc.fontSize(14).fillColor("#333")
         .text(`Brand ${i + 1}: ${brand.brand_name}`, textX, currentY, { width: textWidth });

      currentY = doc.y;
      doc.fontSize(12).fillColor("#555")
         .text(`Detail: ${brand.detail}`, textX, currentY, { width: textWidth });

      currentY = doc.y;
      doc.fontSize(12).fillColor("#007700")
         .text(`Price: ₹${parseFloat(brand.price.toString()).toFixed(2)}`, textX, currentY, { width: textWidth });

      // ---- Move cursor below the bigger of image or text ----
      const textHeight = doc.y - startY;
      const boxHeight = Math.max(imageBoxSize, textHeight);
      doc.y = startY + boxHeight + 50; // spacing after brand

      // ---- Separator line ----
      if (i < product.brands.length - 1) {
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#eeeeee").stroke().moveDown(0.5);
      }
    }

    // ---- Total Price ----
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#cccccc").stroke().moveDown(0.5);
    doc.fontSize(16).fillColor("#222").text("Total Price: ", { continued: true });
    doc.fillColor("#007700").text(`₹${product.total_price.toFixed(2)}`).moveDown(1);

    // ---- Footer ----
    doc.fontSize(9).fillColor("#aaa").text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" });

    doc.end();
  } catch (error) {
    console.error("View PDF error:", error);
    if (!res.headersSent) {
      errorResponse(res, "Internal server error while generating PDF.", 500);
    }
  }
};