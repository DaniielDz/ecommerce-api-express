import { ProductsFilters } from "../schemas/products";
import { PublicUser } from "./user";

declare global {
  namespace Express {
    interface Request {
      session?: {
        user: PublicUser | null;
      };
      productFilters?: ProductsFilters;
      params: { id?: number | string };
    }
  }
}

export {};
