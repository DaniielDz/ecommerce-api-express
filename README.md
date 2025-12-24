# E-commerce API con Express.js

![NodeJS](https://img.shields.io/badge/Node.js-20.x-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Express](https://img.shields.io/badge/Express-5.x-lightgrey) ![Prisma](https://img.shields.io/badge/Prisma-6.x-orange) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue) ![Jest](https://img.shields.io/badge/Jest-30.x-red)

Una API REST completa para una plataforma de e-commerce, construida con Express.js, TypeScript y Prisma. Incluye autenticación JWT, gestión de productos, carrito de compras, órdenes e integración con MercadoPago para pagos.

## 🚀 Características

- **Autenticación y Autorización**: Sistema de login/registro con JWT y roles (ADMIN/CUSTOMER)
- **Gestión de Productos**: CRUD completo de productos con categorías
- **Carrito de Compras**: Funcionalidad completa de carrito por usuario
- **Órdenes y Pagos**: Creación de órdenes con integración MercadoPago
- **Direcciones de Usuario**: Gestión de direcciones de envío
- **Validación de Datos**: Validación robusta con Zod
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Tests Completos**: Tests unitarios e integración con Jest
- **Arquitectura Limpia**: Patrón MVC con separación de responsabilidades

## 🛠️ Tecnologías

- **Backend**: Node.js, Express.js, TypeScript
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: Zod
- **Pagos**: MercadoPago
- **Testing**: Jest, Supertest
- **Linter**: ESLint con TS-Standard
- **Desarrollo**: ts-node-dev

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- PostgreSQL
- Cuenta de MercadoPago (para integración de pagos)

## 🔧 Instalación

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/DaniielDz/ecommerce-api-express.git
   cd ecommerce-api-express
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   
   Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```env
   PORT=3000
   SECRET_JWT_KEY=tu_clave_secreta_para_jwt
   DATABASE_URL=postgresql://usuario:password@localhost:5432/ecommerce_db
   MP_ACCESS_TOKEN=tu_token_de_acceso_de_mercadopago
   API_URL=http://localhost:3000
   MP_WEBHOOK_SECRET=tu_secreto_de_webhook_de_mercadopago
   ```

4. **Configura la base de datos:**
   ```bash
   # Ejecuta las migraciones
   npm run prisma
   
   # Opcional: Ejecuta el seed para datos de prueba
   npm run prisma:seed
   ```

## 🚀 Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

### Tests
```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con cobertura
npm test -- --coverage
```

### Linting
```bash
# Verificar código
npm run lint

# Corregir automáticamente
npm run lint:fix
```

## 📚 API Endpoints

### Autenticación
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Inicio de sesión
- `POST /auth/logout` - Cierre de sesión

### Usuarios
- `GET /users/me` - Obtener perfil del usuario autenticado
- `PATCH /users/me` - Actualizar perfil
- `DELETE /users/me` - Eliminar cuenta

### Direcciones
- `GET /users/me/addresses` - Listar direcciones del usuario
- `POST /users/me/addresses` - Crear nueva dirección
- `GET /users/me/addresses/:id` - Obtener dirección específica
- `PUT /users/me/addresses/:id` - Reemplazar dirección
- `PATCH /users/me/addresses/:id` - Actualizar dirección
- `DELETE /users/me/addresses/:id` - Eliminar dirección

### Productos (Público)
- `GET /products` - Listar productos con filtros y paginación
- `GET /products/:id` - Obtener producto específico

### Productos (Admin)
- `POST /products` - Crear producto
- `PUT /products/:id` - Reemplazar producto
- `PATCH /products/:id` - Actualizar producto
- `DELETE /products/:id` - Eliminar producto

### Categorías (Público)
- `GET /categories` - Listar categorías con paginación
- `GET /categories/:id` - Obtener categoría específica

### Categorías (Admin)
- `POST /categories` - Crear categoría
- `PUT /categories/:id` - Reemplazar categoría
- `PATCH /categories/:id` - Actualizar categoría
- `DELETE /categories/:id` - Eliminar categoría

### Carrito
- `GET /cart` - Obtener carrito del usuario
- `POST /cart` - Agregar producto al carrito
- `PUT /cart/:productId` - Actualizar cantidad de producto
- `DELETE /cart/:productId` - Remover producto del carrito
- `DELETE /cart` - Vaciar carrito

### Órdenes
- `GET /orders` - Listar órdenes del usuario con paginación
- `GET /orders/:id` - Obtener orden específica
- `POST /orders` - Crear nueva orden desde el carrito
- `PATCH /orders/:id/cancel` - Cancelar orden

### Pagos
- `POST /orders/:id/checkout` - Crear sesión de pago con MercadoPago

### Webhooks
- `POST /webhooks/mercadopago` - Webhook para notificaciones de MercadoPago

## 🏗️ Arquitectura del Proyecto

```
src/
├── app.ts              # Configuración principal de Express
├── server.ts           # Punto de entrada del servidor
├── config/             # Configuraciones
│   ├── env.ts         # Variables de entorno
│   └── mercadopago.ts # Configuración MercadoPago
├── controllers/        # Controladores de rutas
├── middlewares/        # Middlewares personalizados
├── models/            # Modelos de datos (Prisma)
├── routes/            # Definición de rutas
├── schemas/           # Validación con Zod
├── services/          # Lógica de negocio
├── types/             # Tipos TypeScript
├── utils/             # Utilidades
└── errors/            # Manejo de errores
```

## 🔐 Autenticación

La API utiliza JWT para autenticación. Después del login exitoso, incluye el token `access_token` en el header `Cookie` para las solicitudes autenticadas.

**Ejemplo de header:**
```
Cookie: access_token=tu_jwt_token_aqui
```

## 💳 Integración con MercadoPago

La API incluye integración completa con MercadoPago para procesar pagos:

1. Crear una orden desde el carrito
2. Generar una sesión de pago con MercadoPago
3. Redirigir al usuario a la página de pago
4. Recibir notificaciones vía webhook para actualizar el estado del pago

## 🧪 Tests

El proyecto incluye tests unitarios e integración:

- **Unitarios**: Middlewares, servicios y utilidades
- **Integración**: Endpoints completos con base de datos en memoria

Los tests están organizados en `tests/unit/` y `tests/integration/`.

### Testing con Postman

Para facilitar las pruebas de la API, se incluye una colección completa de Postman con todos los endpoints documentados:

1. **Importa la colección**: En Postman, haz clic en "Import" y selecciona el archivo `E-commerce_API.postman_collection.json`
2. **Configura las variables**:
   - `base_url`: URL base de tu API (por defecto: `http://localhost:3000`)
   - `access_token`: Se configura automáticamente después del login
3. **Ejecuta los requests**: Los requests están organizados por módulos e incluyen ejemplos de datos

**Nota**: Algunos endpoints requieren autenticación. Asegúrate de ejecutar primero el login para obtener el token de acceso.

## 📊 Base de Datos

### Modelo de Datos

- **Users**: Usuarios con roles (CUSTOMER/ADMIN)
- **Addresses**: Direcciones de envío por usuario
- **Categories**: Categorías de productos
- **Products**: Catálogo de productos
- **Cart**: Carrito de compras por usuario
- **CartItems**: Items en el carrito
- **Orders**: Órdenes de compra
- **OrderItems**: Items en las órdenes
- **Payments**: Registros de pagos

### Seed de Datos

El proyecto incluye datos de prueba que puedes cargar con:
```bash
npm run prisma:seed
```

**Usuarios de prueba:**
- Admin: `admin@demo.com` / `123456`
- Customer: `customer@demo.com` / `123456`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📞 Contacto

- **Autor**: DaniielDz
- **GitHub**: [https://github.com/DaniielDz](https://github.com/DaniielDz)
- **LinkedIn**: [https://www.linkedin.com/in/daniieldz/](https://www.linkedin.com/in/daniieldz/)

---

¡Gracias por usar esta API de e-commerce! Si encuentras algún problema o tienes sugerencias, no dudes en abrir un issue en GitHub.