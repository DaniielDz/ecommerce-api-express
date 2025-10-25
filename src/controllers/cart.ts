import { Request, Response, NextFunction } from "express";
import { CartService } from "../services/cart";
import { CartItemInput, UpdateCartItemInput } from "../schemas/cart";

export class CartController {
  static async getUserCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session!.user!.id as string;
      const cart = await CartService.getUserCart(userId);
      return res.json({ status: "success", cart });
    } catch (error) {
      return next(error);
    }
  }

  static async createOrUpdateCartItem(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.session!.user!.id as string;
      const itemData = req.validatedData!.body as CartItemInput;

      const { isCreated, item } = await CartService.createOrUpdateCartItem(
        userId,
        itemData
      );

      const statusCode = isCreated ? 201 : 200;
      return res.status(statusCode).json({ status: "success", data: item });
    } catch (error) {
      return next(error);
    }
  }

  static async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session!.user!.id as string;

      await CartService.clearCart(userId);

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  static async updateItemQuantity(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id: itemId } = req.validatedData!.params as { id: number };
      const { quantity } = req.validatedData!.body as UpdateCartItemInput;

      const updatedItem = await CartService.updateItemQuantity(
        itemId,
        quantity
      );

      return res.status(200).json({ status: "success", data: updatedItem });
    } catch (error) {
      return next(error);
    }
  }

  static async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.validatedData!.params as { id: number };

      await CartService.deleteItem(id);

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}
