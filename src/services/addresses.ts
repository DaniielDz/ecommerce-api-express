import { AppError } from "../errors/AppError";
import { AddressesModel } from "../models/addresses";
import { CreateAddressInput, UpdateAddressInput } from "../schemas/addresses";

export class AddressesService {
  static async listUserAddresses(userId: string) {
    return await AddressesModel.getAllByUserId(userId);
  }

  static async getAddressById(addressId: string, userId: string) {
    const address = await AddressesModel.getById(addressId);

    if (!address || address.userId !== userId) {
      throw new AppError("No se encontró la dirección solicitada", 404);
    }

    return address;
  }

  static async createAddress(userId: string, data: CreateAddressInput) {
    return await AddressesModel.create(data, userId);
  }

  static async updateAddress(
    addressId: string,
    userId: string,
    data: UpdateAddressInput
  ) {
    await this.getAddressById(addressId, userId);

    return await AddressesModel.update(addressId, userId, data);
  }

  static async deleteAddress(addressId: string, userId: string) {
    const address = await this.getAddressById(addressId, userId);

    if (address.isDefault) {
      throw new AppError(
        "No se puede eliminar la dirección predeterminada",
        400
      );
    }

    return await AddressesModel.delete(addressId);
  }
}
