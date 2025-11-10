import { Request, Response, NextFunction } from "express";
import { UsersService } from "../services/users";
import { PatchUserInput } from "../schemas/users";

export class UsersController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session!.user!.id as string;
      const result = await UsersService.getProfile(userId);

      return res.json({ status: "success", data: result });
    } catch (error) {
      return next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session!.user!.id as string;
      const updateData = req.validatedData!.body as PatchUserInput;

      const result = await UsersService.updateProfile(userId, updateData);

      return res.json({ status: "success", data: result });
    } catch (error) {
      return next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session!.user!.id as string;

      await UsersService.deleteUser(userId);

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}
