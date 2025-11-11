// tests/unit/services/addresses.test.ts

import { AddressesService } from "../../../src/services/addresses";
import { AddressesModel } from "../../../src/models/addresses";
import { AppError } from "../../../src/errors/AppError";

jest.mock("../../../src/models/addresses");

const mockAddressesModel = jest.mocked(AddressesModel);

// --- Datos de Prueba ---
const userId = "user-uuid-123";
const otherUserId = "user-uuid-456";
const addressId = "addr-uuid-789";

const mockAddress = {
  id: addressId,
  addressLine1: "Calle Falsa 123",
  addressLine2: null,
  city: "Springfield",
  state: "Provincia",
  postalCode: "5000",
  country: "Argentina",
  isDefault: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: userId,
};

const mockDefaultAddress = {
  ...mockAddress,
  id: "addr-uuid-default",
  isDefault: true,
};

const mockAddressInput = {
  addressLine1: "Calle Nueva 456",
  addressLine2: null,
  city: "Ciudad Nueva",
  state: "Estado Nuevo",
  postalCode: "5001",
  country: "Argentina",
  isDefault: false,
};

describe("AddressesService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("listUserAddresses", () => {
    test("debería retornar una lista de direcciones del usuario", async () => {
      mockAddressesModel.getAllByUserId.mockResolvedValue([
        mockAddress,
        mockDefaultAddress,
      ]);

      const result = await AddressesService.listUserAddresses(userId);

      expect(mockAddressesModel.getAllByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([mockAddress, mockDefaultAddress]);
    });
  });

  describe("getAddressById", () => {
    test("debería retornar una dirección si existe y pertenece al usuario", async () => {
      mockAddressesModel.getById.mockResolvedValue(mockAddress);

      const result = await AddressesService.getAddressById(addressId, userId);

      expect(mockAddressesModel.getById).toHaveBeenCalledWith(addressId);
      expect(result).toEqual(mockAddress);
    });

    test("debería lanzar AppError 404 si la dirección no existe", async () => {
      mockAddressesModel.getById.mockResolvedValue(null);

      await expect(
        AddressesService.getAddressById(addressId, userId)
      ).rejects.toThrow(AppError);
      await expect(
        AddressesService.getAddressById(addressId, userId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "No se encontró la dirección solicitada",
      });
    });

    test("debería lanzar AppError 404 si la dirección no pertenece al usuario", async () => {
      mockAddressesModel.getById.mockResolvedValue(mockAddress);

      await expect(
        AddressesService.getAddressById(addressId, otherUserId)
      ).rejects.toThrow(AppError);
      await expect(
        AddressesService.getAddressById(addressId, otherUserId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "No se encontró la dirección solicitada",
      });
    });
  });

  describe("createAddress", () => {
    test("debería llamar a AddressesModel.create", async () => {
      mockAddressesModel.create.mockResolvedValue(mockAddress);

      await AddressesService.createAddress(userId, mockAddressInput);

      expect(mockAddressesModel.create).toHaveBeenCalledWith(
        mockAddressInput,
        userId
      );
    });
  });

  describe("updateAddress", () => {
    test("debería actualizar la dirección si existe y pertenece al usuario", async () => {
      const updateData = { city: "Nueva Ciudad" };
      const updatedAddress = { ...mockAddress, city: "Nueva Ciudad" };

      mockAddressesModel.getById.mockResolvedValue(mockAddress);
      mockAddressesModel.update.mockResolvedValue(updatedAddress);

      const result = await AddressesService.updateAddress(
        addressId,
        userId,
        updateData
      );

      expect(mockAddressesModel.getById).toHaveBeenCalledWith(addressId);
      expect(mockAddressesModel.update).toHaveBeenCalledWith(
        addressId,
        userId,
        updateData
      );
      expect(result.city).toBe("Nueva Ciudad");
    });

    test("debería lanzar 404 si la dirección a actualizar no existe o no pertenece", async () => {
      mockAddressesModel.getById.mockResolvedValue(null); // Falla el check

      await expect(
        AddressesService.updateAddress(addressId, userId, {})
      ).rejects.toThrow(AppError);
      expect(mockAddressesModel.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteAddress", () => {
    test("debería eliminar la dirección si no es la predeterminada", async () => {
      mockAddressesModel.getById.mockResolvedValue(mockAddress);
      mockAddressesModel.delete.mockResolvedValue(mockAddress);

      const result = await AddressesService.deleteAddress(addressId, userId);

      expect(mockAddressesModel.getById).toHaveBeenCalledWith(addressId);
      expect(mockAddressesModel.delete).toHaveBeenCalledWith(addressId);
      expect(result).toEqual(mockAddress);
    });

    test("debería lanzar AppError 400 si se intenta eliminar la dirección predeterminada", async () => {
      mockAddressesModel.getById.mockResolvedValue(mockDefaultAddress);

      await expect(
        AddressesService.deleteAddress(mockDefaultAddress.id, userId)
      ).rejects.toThrow(AppError);
      await expect(
        AddressesService.deleteAddress(mockDefaultAddress.id, userId)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "No se puede eliminar la dirección predeterminada",
      });

      expect(mockAddressesModel.delete).not.toHaveBeenCalled();
    });

    test("debería lanzar 404 si la dirección a eliminar no existe o no pertenece", async () => {
      mockAddressesModel.getById.mockResolvedValue(null);

      await expect(
        AddressesService.deleteAddress(addressId, userId)
      ).rejects.toThrow(AppError);

      expect(mockAddressesModel.delete).not.toHaveBeenCalled();
    });
  });
});
