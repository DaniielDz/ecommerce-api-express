import { Request, Response, NextFunction } from "express";
import { AddressesService } from "../services/addresses";
import { CreateAddressInput, UpdateAddressInput } from "../schemas/addresses";

export class AddressesController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session!.user!.id as string;
      const result = await AddressesService.listUserAddresses(userId);
      return res.json({ status: "success", data: result });
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session!.user!.id as string;
      const { id: addressId } = req.validatedData!.params as { id: string };

      const result = await AddressesService.getAddressById(addressId, userId);

      return res.json({ status: "success", data: result });
    } catch (error) {
      return next(error);
    }
  }

  static async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session!.user!.id as string;
      const addressData = req.validatedData!.body as CreateAddressInput;

      const result = await AddressesService.createAddress(userId, addressData);

      return res.status(201).json({ status: "success", data: result });
    } catch (error) {
      return next(error);
    }
  }

  static async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session!.user!.id as string;
      const { id: addressId } = req.validatedData!.params as { id: string };
      const addressData = req.validatedData!.body as UpdateAddressInput;

      const result = await AddressesService.updateAddress(
        addressId,
        userId,
        addressData
      );

      return res.json({ status: "success", data: result });
    } catch (error) {
      return next(error);
    }
  }

  static async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session!.user!.id as string;
      const { id: addressId } = req.validatedData!.params as { id: string };

      await AddressesService.deleteAddress(userId, addressId);

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}
