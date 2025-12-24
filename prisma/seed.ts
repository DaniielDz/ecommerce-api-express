import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Limpiar la base de datos (Orden inverso para respetar Foreign Keys)
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Database cleaned.");

  // 2. Crear Categorías
  const electronics = await prisma.category.create({
    data: {
      name: "Electrónica",
      description: "Gadgets, dispositivos y accesorios.",
    },
  });
  const clothing = await prisma.category.create({
    data: { name: "Ropa", description: "Moda y accesorios." },
  });

  // 3. Crear Productos
  await prisma.product.createMany({
    data: [
      {
        name: "Smartphone Pro Max",
        description: "El teléfono más avanzado con cámara de 108MP.",
        price: 999.99,
        stock: 50,
        sku: "PHONE-001",
        categoryId: electronics.id,
        imageUrl:
          "https://images.unsplash.com/photo-1598327770170-66916b59526c?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Laptop Developer Edition",
        description: "Potencia pura para compilar código.",
        price: 1499.5,
        stock: 20,
        sku: "LAP-DEV-01",
        categoryId: electronics.id,
        imageUrl:
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Camiseta Básica",
        description: "100% Algodón, color negro.",
        price: 19.99,
        stock: 100,
        sku: "TSHIRT-BLK-M",
        categoryId: clothing.id,
        imageUrl:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
      },
    ],
  });

  // 4. Crear Usuarios
  const passwordHash = await bcrypt.hash("123456", 10);

  // Admin User
  await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@demo.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // Customer User (Con carrito y dirección)
  const customer = await prisma.user.create({
    data: {
      firstName: "Daniel",
      lastName: "Demo",
      email: "customer@demo.com",
      passwordHash,
      role: Role.CUSTOMER,
      // Crear carrito automáticamente
      cart: { create: {} },
      // Crear dirección automáticamente
      addresses: {
        create: {
          addressLine1: "Av. Siempre Viva 742",
          city: "Springfield",
          state: "Estado",
          postalCode: "1234",
          country: "Argentina",
          isDefault: true,
        },
      },
    },
  });

  console.log("✅ Seed completed!");
  console.log("----------------------------------");
  console.log("👤 Admin: admin@demo.com / 123456");
  console.log(`👤 Customer: ${customer.email} / 123456`);
  console.log("----------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
