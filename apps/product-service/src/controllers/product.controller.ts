import { ValidationError } from "../../../../packages/error-handler/index";
import prisma from "../../../../packages/libs/prisma/index";
import { Request, Response, NextFunction } from "express";
import { imagekit } from "../../../../packages/libs/imagekit";
import { Prisma } from "@prisma/client";
// have to verify this
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.site_config.findFirst();
    if (!config) {
      return res.status(404).json({ message: "Categories not found" });
    }

    return res.status(200).json({
      categories: config.categories,
      subCategories: config.subCategories,
    });
  } catch (error) {
    return next(error);
  }
};

export const createDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { public_name, discountType, discountValue, discountCode } = req.body;
    const isDiscountCodeExist = await prisma.discount_codes.findUnique({
      where: {
        discountCode,
      },
    });
    if (isDiscountCodeExist) {
      return next(
        new ValidationError(
          "Discount code already exists.Please use different one."
        )
      );
    }
    const discount_code = await prisma.discount_codes.create({
      data: {
        public_name,
        discountType,
        discountValue: parseFloat(discountValue),
        discountCode,
        sellerId: req.seller.id,
      },
    });

    res.status(201).json({
      success: true,
      discount_code,
    });
  } catch (error) {
    next(error);
  }
};

export const getDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const discount_codes = await prisma.discount_codes.findMany({
      where: {
        sellerId: req.seller.id,
      },
    });
    res.status(201).json({
      success: true,
      discount_codes,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const sellerId = req.seller?.id;

    const discountCode = await prisma.discount_codes.findUnique({
      where: {
        id,
      },
      select: { id: true, sellerId: true },
    });

    if (!discountCode) {
      return next(new ValidationError("Discountcode not found!"));
    }

    if (discountCode.sellerId !== sellerId) {
      return next(new ValidationError("Unauthorized access!"));
    }

    await prisma.discount_codes.delete({ where: { id } });

    return res.status(200).json({
      message: "Discount code successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileName } = req.body;
    const response = await imagekit.upload({
      file: fileName,
      fileName: `product-${Date.now()}.jpg`,
      folder: "/products",
    });

    res.status(201).json({ file_url: response.url, fileId: response.fileId });
  } catch (error) {
    next(error);
  }
};

export const deleteProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileId } = req.body;
    const response = await imagekit.deleteFile(fileId);
    res.status(201).json({
      success: true,
      response,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  
  try {
    const {
      title,
      short_description,
      detailed_description,
      warranty,
      custom_specifications,
      slug,
      tags,
      cash_on_delivery,
      brand,
      video_url,
      category,
      colors = [],
      sizes = [],
      discountCodes=[],
      stock,
      sale_price,
      regular_price,
      subCategory,
      customProperties = {},
      images = [],
    } = req.body;

    if (
      !title ||
      !slug ||
      !short_description ||
      !category ||
      !subCategory ||
      !sale_price ||
      !images ||
      !tags ||
      !stock ||
      !regular_price
    ) {
      return next(new ValidationError("Misssing required fields"));
    }

    if (!req.seller.id) {
      return next(new ValidationError("Only seller can create products!"));
    }

    const slugChecking = await prisma.products.findUnique({
      where: {
        slug,
      },
    });
    if (slugChecking) {
      return next(
        new ValidationError("Slug already exist! Please use a different slug!")
      );
    }
    
    const newProduct = await prisma.products.create({
      data: {
        title,
        short_description,
        detailed_description,
        warranty,
        cashOnDelivery: cash_on_delivery,
        slug,
        shopId: req.seller?.Shop?.id!,
        tags: Array.isArray(tags) ? tags : tags.split(","),
        brand,
        video_url,
        category,
        subCategory,
        colors: colors || [],
        discount_codes: discountCodes.map((codeId: string) => codeId),
        sizes: sizes || [],
        stock: parseInt(stock),
        sale_price: parseFloat(sale_price),
        regular_price: parseFloat(regular_price),
        custom_properties: customProperties || {},
        custom_specifications: custom_specifications || {},
        starting_date:null,
        ending_date:null,
        images: {
          create: images
            .filter((img: any) => img && img.fileId && img.file_url) 
            .map((image: any) => ({
              file_id: image.fileId,
              url: [image.file_url],
            })),
        },
      },
      include: { images: true },
    });
    res.status(201).json({
      success: true,
      newProduct,
    });
  } catch (error) {
    next(error);
  }
};

export const getShopProducts = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await prisma.products.findMany({
      where: {
        shopId: req?.seller?.shop?.id,
      },
      include: {
        images: true,
      },
    });
    res.status(201).json({
      success: true,
      products,
    });
  } catch (error) {}
};

export const deleteProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const sellerId = req.seller?.shop?.id;

    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { id: true, shopId: true, isDeleted: true },
    });

    if (!product) {
      return next(new ValidationError("Product not found"));
    }
    if (product.shopId !== sellerId) {
      return next(new ValidationError("Unauthorized action"));
    }

    if (product.isDeleted) {
      return next(new ValidationError("Product is already deleted"));
    }

    const deletedProduct = await prisma.products.update({
      where: { id: productId },
      data: {
        isDeleted: true,
        deletedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    return res.status(200).json({
      message:
        "Product is scheduled for deletion in 24 hours.You can restore it within this time",
      deletedAt: deletedProduct.deletedAt,
    });
  } catch (error) {
    return next(error);
  }
};

export const restoreProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const sellerId = req.seller?.shop?.id;

    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { id: true, shopId: true, isDeleted: true },
    });

    if (!product) {
      return next(new ValidationError("Product not found"));
    }
    if (product.shopId !== sellerId) {
      return next(new ValidationError("Unauthorized action"));
    }

    if (product.isDeleted) {
      return res
        .status(400)
        .json({ message: "Product is not in deleted state" });
    }

    await prisma.products.update({
      where: { id: productId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
    return res.status(200).json({
      message: "Product restored successfully!",
    });
  } catch (error) {
    return res.status(500).json({ message: "Error restoring product", error });
  }
};

export const getAllProducts = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type;

    // First, get all valid (non-deleted) shop IDs
    const validShops = await prisma.shops.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    const validShopIds = validShops.map((shop) => shop.id);

    // If no valid shops, return empty result
    if (validShopIds.length === 0) {
      return res.status(200).json({
        products: [],
        top10By: type === "latest" ? "latest" : "topSales",
        top10Products: [],
        total: 0,
        currentPage: page,
        totalPages: 0,
      });
    }

    const baseFilter: any = {
      AND: [
        {
          OR: [
            {
              starting_date: null,
            },
            {
              ending_date: null,
            }
          ],
        },
        {
          isDeleted: { not: true },
        },
        {
          shopId: {
            in: validShopIds,
          },
        },
      ],
    };

    const orderBy: Prisma.productsOrderByWithRelationInput =
      type === "latest"
        ? { createdAt: "desc" as Prisma.SortOrder }
        : { totalSales: "desc" as Prisma.SortOrder };

    const [products, total, top10Products] = await Promise.all([
      prisma.products.findMany({
        skip,
        take: limit,
        include: {
          images: true,
          Shop: true,
        },
        where: baseFilter,
        orderBy: {
          totalSales: "desc",
        },
      }),

      prisma.products.count({ where: baseFilter }),
      prisma.products.findMany({
        take: 10,
        where: baseFilter,
        include: {
          images: true,
          Shop: true,
        },
        orderBy,
      }),
    ]);

    res.status(200).json({
      products,
      top10By: type === "latest" ? "latest" : "topSales",
      top10Products,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await prisma.products.findUnique({
      where: {
        slug: req.params.slug!,
      },
      include: {
        images: true,
        Shop: true,
      },
    });
    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    return next(error);
  }
};

export const getFilteredProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      priceRange = [0, 10000],
      categories = [],
      colors = [],
      sizes = [],
      page = 1,
      limit = 12,
    } = req.query;

    const parsedPriceRange =
      typeof priceRange === "string"
        ? priceRange.split(",").map(Number)
        : [0, 10000];

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const skip = (parsedPage - 1) * parsedLimit;

    // First, get all valid (non-deleted) shop IDs
    const validShops = await prisma.shops.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    const validShopIds = validShops.map((shop) => shop.id);

    const filters: Record<string, any> = {
      AND: [
        {
          sale_price: {
            gte: parsedPriceRange[0],
            lte: parsedPriceRange[1],
          },
        },
        {
          starting_date: null,
        },
        {
          isDeleted: { not: true },
        },
        {
          shopId: {
            in: validShopIds,
          },
        },
      ],
    };

    if (categories && (categories as string[]).length > 0) {
      filters.AND.push({
        category: {
          in: Array.isArray(categories)
            ? categories
            : String(categories).split(","),
        },
      });
    }

    if (colors && (colors as string[]).length > 0) {
      filters.AND.push({
        colors: {
          hasSome: Array.isArray(colors) ? colors : [colors],
        },
      });
    }

    if (sizes && (sizes as string[]).length > 0) {
      filters.AND.push({
        sizes: {
          hasSome: Array.isArray(sizes) ? sizes : [sizes],
        },
      });
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          images: true,
          Shop: true,
        },
      }),
      prisma.products.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    res.json({
      products,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFilteredEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      priceRange = [0, 10000],
      categories = [],
      colors = [],
      sizes = [],
      page = 1,
      limit = 12,
    } = req.query;

    const parsedPriceRange =
      typeof priceRange === "string"
        ? priceRange.split(",").map(Number)
        : [0, 10000];

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const skip = (parsedPage - 1) * parsedLimit;

    // First, get all valid (non-deleted) shop IDs
    const validShops = await prisma.shops.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    const validShopIds = validShops.map((shop) => shop.id);

    const filters: Record<string, any> = {
      AND: [
        {
          sale_price: {
            gte: parsedPriceRange[0],
            lte: parsedPriceRange[1],
          },
        },
        {
          NOT: {
            starting_date: null,
          },
        },
        {
          isDeleted: { not: true },
        },
        {
          shopId: {
            in: validShopIds,
          },
        },
      ],
    };

    if (categories && (categories as string[]).length > 0) {
      filters.AND.push({
        category: {
          in: Array.isArray(categories)
            ? categories
            : String(categories).split(","),
        },
      });
    }

    if (colors && (colors as string[]).length > 0) {
      filters.AND.push({
        colors: {
          hasSome: Array.isArray(colors) ? colors : [colors],
        },
      });
    }

    if (sizes && (sizes as string[]).length > 0) {
      filters.AND.push({
        sizes: {
          hasSome: Array.isArray(sizes) ? sizes : [sizes],
        },
      });
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          images: true,
          Shop: true,
        },
      }),
      prisma.products.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    res.json({
      products,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFilteredShops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categories = [], countries = [], page = 1, limit = 12 } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {};

    if (categories && (categories as string[]).length > 0) {
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(","),
      };
    }

    if (countries && String(countries).length > 0) {
      filters.colors = {
        hasSome: Array.isArray(countries)
          ? countries
          : String(countries).split(","),
      };
    }

    const [shops, total] = await Promise.all([
      prisma.shops.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          sellers: true,
          followers: true,
          products: true,
        },
      }),
      prisma.shops.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    res.json({
      shops,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const searchedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Search query is required." });
    }
    const products = await prisma.products.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            short_description: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ products });
  } catch (error) {
    return next(error);
  }
};

export const topShops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // const topShopsData = await prisma.orders.groupBy({
    //   by: ["shopId"],
    //   _sum: {
    //     total: true,
    //   },
    //   orderBy: {
    //     _sum: {
    //       total: "desc",
    //     },
    //   },
    //   take: 10,
    // });

    // const shopIds = topShopsData.map((item: any) => item.shopId);

    // const shops = await prisma.shops.findMany({
    //   where: {
    //     id: {
    //       in: shopIds,
    //     },
    //   },
    //   select: {
    //     id: true,
    //     name: true,
    //     avatar: true,
    //     coverBanner: true,
    //     address: true,
    //     rating: true,
    //     followers: true,
    //     category: true,
    //   },
    // });

    // const enrichedShops = shops.map((shop) => {
    //   const salesData = topShopsData.find((s) => s.shopId === shop.id);
    //   return {
    //     ...shop,
    //     totalSales: salesData?._sum.total ?? 0,
    //   };
    // });

    // const top10Shops = enrichedShops
    //   .sort((a, b) => (b.totalSales = a.totalSales))
    //   .slice(0, 10);

    // return res.status(200).json({ shops: top10Shops });

    const shops = await prisma.shops.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
        coverBanner: true,
        address: true,
        rating: true,
        followers: true,
        category: true,
      },
    });

    return res.status(200).json({ shops });
  } catch (error) {
    return next(error);
  }
};

export const getAllEvents = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type;

    // First, get all valid (non-deleted) shop IDs
    const validShops = await prisma.shops.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    const validShopIds = validShops.map((shop) => shop.id);

    // If no valid shops, return empty result
    if (validShopIds.length === 0) {
      return res.status(200).json({
        events: [],
        top10BySales: [],
        total: 0,
        currentPage: page,
        totalPages: 0,
      });
    }

    const baseFilter: any = {
      AND: [
        {
          starting_date: { not: null },
        },
        {
          ending_date: { not: null },
        },
        {
          isDeleted: { not: true },
        },
        {
          shopId: {
            in: validShopIds,
          },
        },
      ],
    };

    const [events, total, top10BySales] = await Promise.all([
      prisma.products.findMany({
        skip,
        take: limit,
        include: {
          images: true,
          Shop: true,
        },
        where: baseFilter,
        orderBy: {
          totalSales: "desc",
        },
      }),
      prisma.products.count({ where: baseFilter }),
      prisma.products.findMany({
        take: 10,
        where: baseFilter,
        include: {
          images: true,
          Shop: true,
        },
        orderBy: {
          totalSales: "desc",
        },
      }),
    ]);

    res.status(200).json({
      events,
      top10BySales,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};


