export type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  thumbnail: string;
  images: string[];
  brand?: string;
  sku?: string;
  discountPercentage?: number;
  reviews?: {
    rating: number;
    comment: string;
    reviewerName: string;
    date: string;
  }[];
};

export type ProductInput = Pick<Product, "title" | "description" | "category" | "price" | "stock" | "thumbnail">;

export type ProductList = { products: Product[]; total: number; skip: number; limit: number };

export type Category = { slug: string; name: string; url: string };

export type Session = { accessToken: string; username: string; firstName: string; lastName: string };

export type SortOption = "title-asc" | "title-desc" | "price-asc" | "price-desc" | "rating-desc";

export type ListParams = { page: number; size: number; search: string; category: string; sort: SortOption };
