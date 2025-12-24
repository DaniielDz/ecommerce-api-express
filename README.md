# E-commerce API con Express.js

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
- **Entorno Dockerizado**: Configuración lista para desarrollo con Ngrok integrado

## 🛠️ Tecnologías

- **Backend**: Node.js, Express.js, TypeScript
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: Zod
- **Pagos**: MercadoPago
- **Testing**: Jest, Supertest
- **Infraestructura**: Docker, Docker Compose, Ngrok
- **Linter**: ESLint con TS-Standard

## 📋 Requisitos Previos

- Docker y Docker Compose (Recomendado)
- Node.js (v18+) y PostgreSQL (Solo para ejecución manual sin Docker)
- Cuenta de MercadoPago (para integración de pagos)
- Cuenta de Ngrok (para obtener el Authtoken)

## 🐳 Docker Setup (Recomendado)

El proyecto está totalmente dockerizado para facilitar el desarrollo y las pruebas, incluyendo un túnel Ngrok preconfigurado para recibir Webhooks de Mercado Pago en local.

### 1. Configuración del Entorno

Crea un archivo .env en la raíz del proyecto copiando el ejemplo:

```bash
cp .env.example .env
```

Asegúrate de configurar tu NGROK_AUTHTOKEN en el archivo .env. No es necesario cambiar la DATABASE_URL, Docker se encarga de la conexión interna.

### 2. Levantar Servicios

Ejecuta el siguiente comando para construir y levantar la base de datos, la API y el túnel:

```bash
docker-compose up --build
```

### 3. Inicializar Base de Datos

Una vez que los contenedores estén corriendo, abre una nueva terminal y ejecuta estos comandos para crear las tablas y cargar datos de prueba:

```bash
# Ejecuta las migraciones de Prisma dentro del contenedor
docker-compose exec api npx prisma migrate dev

# Ejecuta el seed para cargar datos (usuarios, productos, etc.)
docker-compose exec api npx prisma db seed
```

### 4. 🌐 Configuración de Ngrok y Postman (Pagos)

Para probar el flujo de pagos completo (Checkout y Webhooks) necesitas configurar la URL pública que genera Ngrok.

- **Obtén la URL de Ngrok**:
  Abre tu navegador en http://localhost:4040.
  Copia la URL pública que aparece (ej: https://a1b2c3d4.ngrok-free.app).

- **Configura tu entorno local (Webhooks)**:
  Ve a tu archivo .env y actualiza API_URL para que Mercado Pago sepa dónde enviar las notificaciones:

  ```bash
  API_URL=https://a1b2c3d4.ngrok-free.app/webhooks/mercadopago
  ```

  Nota: Si cambias el .env, reinicia el contenedor de la API (`docker-compose restart api`).

- **Configura Postman**:
  Si estás usando la colección de Postman incluida, actualiza la variable de colección `base_url` con la URL de Ngrok. Esto asegura que las redirecciones y callbacks funcionen correctamente desde la nube.

  Variable `base_url`: https://a1b2c3d4.ngrok-free.app (en lugar de http://localhost:3000).

## 🔧 Instalación Manual (Alternativa)

Si prefieres no usar Docker, sigue estos pasos:

1. **Clona el repositorio**:

   ```bash
   git clone https://github.com/DaniielDz/ecommerce-api-express.git
   cd ecommerce-api-express
   ```

2. **Instala las dependencias**:

   ```bash
   npm install
   ```

3. **Configura las variables de entorno**:
   Configura el archivo .env apuntando a tu base de datos PostgreSQL local (localhost).

4. **Configura la base de datos**:

   ```bash
   npm run prisma      # Migraciones
   npm run prisma:seed # Seed de datos
   ```

5. **Inicia el servidor**:

   ```bash
   npm run dev
   ```

## 📚 API Endpoints

### Autenticación
- POST /auth/register - Registro de usuario
- POST /auth/login - Inicio de sesión
- POST /auth/logout - Cierre de sesión

### Usuarios
- GET /users/me - Obtener perfil del usuario autenticado
- PATCH /users/me - Actualizar perfil
- DELETE /users/me - Eliminar cuenta

### Direcciones
- GET /users/me/addresses - Listar direcciones del usuario
- POST /users/me/addresses - Crear nueva dirección
- GET /users/me/addresses/:id - Obtener dirección específica
- PATCH /users/me/addresses/:id - Actualizar dirección
- DELETE /users/me/addresses/:id - Eliminar dirección

### Productos (Público)
- GET /products - Listar productos con filtros y paginación
- GET /products/:id - Obtener producto específico

### Productos (Admin)
- POST /products - Crear producto
- PUT /products/:id - Reemplazar producto
- PATCH /products/:id - Actualizar producto
- DELETE /products/:id - Eliminar producto

### Categorías (Público)
- GET /categories - Listar categorías con paginación
- GET /categories/:id - Obtener categoría específica

### Categorías (Admin)
- POST /categories - Crear categoría
- PUT /categories/:id - Reemplazar categoría
- PATCH /categories/:id - Actualizar categoría
- DELETE /categories/:id - Eliminar categoría

### Carrito
- GET /cart - Obtener carrito del usuario
- POST /cart/items - Agregar producto al carrito
- PATCH /cart/items/:id - Actualizar cantidad de producto
- DELETE /cart/items/:id - Remover producto del carrito
- DELETE /cart - Vaciar carrito

### Órdenes
- GET /orders - Listar órdenes del usuario con paginación
- GET /orders/:id - Obtener orden específica
- POST /orders - Crear nueva orden desde el carrito

### Pagos
- POST /orders/:id/checkout - Crear sesión de pago con MercadoPago

### Webhooks
- POST /webhooks/mercadopago - Webhook para notificaciones de MercadoPago

## 🏗️ Arquitectura del Proyecto

```
src/
├── app.ts              # Configuración principal de Express
├── server.ts           # Punto de entrada del servidor
├── config/             # Configuraciones
│   ├── env.ts          # Variables de entorno
│   └── mercadopago.ts  # Configuración MercadoPago
├── controllers/        # Controladores de rutas
├── middlewares/        # Middlewares personalizados
├── models/             # Modelos de datos (Prisma)
├── routes/             # Definición de rutas
├── schemas/            # Validación con Zod
├── services/           # Lógica de negocio
├── types/              # Tipos TypeScript
├── utils/              # Utilidades
└── errors/             # Manejo de errores
```

## 🔐 Autenticación

La API utiliza JWT para autenticación. Después del login exitoso, incluye el token `access_token` en el header Cookie para las solicitudes autenticadas.

## 💳 Integración con MercadoPago

La API incluye integración completa con MercadoPago para procesar pagos:

- Crear una orden desde el carrito
- Generar una sesión de pago con MercadoPago
- Redirigir al usuario a la página de pago
- Recibir notificaciones vía webhook para actualizar el estado del pago

## 🧪 Tests

El proyecto incluye tests unitarios e integración:

- **Unitarios**: Middlewares, servicios y utilidades
- **Integración**: Endpoints completos con base de datos en memoria

Los tests están organizados en `tests/unit/` y `tests/integration/`. Para ejecutarlos:

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con cobertura
npm test -- --coverage
```

### Testing con Postman

Para facilitar las pruebas de la API, se incluye una colección completa de Postman con todos los endpoints documentados:

- **Importa la colección**: En Postman, haz clic en "Import" y selecciona el archivo `E-commerce_API.postman_collection.json`
- **Configura las variables**:
  - `base_url`: URL base de tu API. Si usas Docker/Ngrok, usa la URL pública de Ngrok (ej. https://xxxx.ngrok-free.app).
  - `access_token`: Se configura automáticamente después del login.
- **Ejecuta los requests**: Los requests están organizados por módulos e incluyen ejemplos de datos.

## 📊 Base de Datos

### Modelo de Datos
- Users: Usuarios con roles (CUSTOMER/ADMIN)
- Addresses: Direcciones de envío por usuario
- Categories: Categorías de productos
- Products: Catálogo de productos
- Cart: Carrito de compras por usuario
- CartItems: Items en el carrito
- Orders: Órdenes de compra
- OrderItems: Items en las órdenes
- Payments: Registros de pagos

### Seed de Datos
El proyecto incluye datos de prueba que puedes cargar con `npm run prisma:seed` (o a través de docker-compose como se indica arriba).

- **Usuarios de prueba**:
  - Admin: admin@demo.com / 123456
  - Customer: customer@demo.com / 123456

## 🤝 Contribución

- Fork el proyecto
- Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
- Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
- Push a la rama (`git push origin feature/nueva-funcionalidad`)
- Abre un Pull Request

## 📞 Contacto

- **Autor**: DaniielDz
- **GitHub**: https://github.com/DaniielDz
- **LinkedIn**: https://www.linkedin.com/in/daniieldz/

¡Gracias por usar esta API de e-commerce! Si encuentras algún problema o tienes sugerencias, no dudes en abrir un issue en GitHub.
