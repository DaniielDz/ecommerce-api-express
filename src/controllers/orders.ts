import { Request, Response, NextFunction } from "express";
import { CreateOrderInput, GetAllOrdersQuery } from "../schemas/orders";
import { OrdersService } from "../services/orders";

export class OrdersController {
  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session!.user!.id;
      const { page, limit } = req.validatedData!.query as GetAllOrdersQuery;

      const result = await OrdersService.getUserOrders(userId, page, limit);

      return res.json({
        status: "success",
        data: result.orders,
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session!.user!.id;
      const { id: orderId } = req.validatedData!.params as { id: string };

      const result = await OrdersService.getOrderById(userId, orderId);

      return res.json({ status: "success", data: result });
    } catch (error) {
      return next(error);
    }
  }

  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session!.user!.id;
      const orderInput = req.validatedData!.body as CreateOrderInput;

      const result = await OrdersService.createOrder(userId, orderInput);

      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      return next(error);
    }
  }
}
