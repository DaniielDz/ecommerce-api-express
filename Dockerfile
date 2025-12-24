# ---------------------------------------
# Etapa 1: Base (Dependencias comunes)
# ---------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
# Copiamos solo los archivos de dependencias primero para aprovechar la caché de Docker
COPY package*.json ./
# Instalamos todas las dependencias (incluyendo devDependencies para compilar TS)
RUN npm install

# ---------------------------------------
# Etapa 2: Desarrollo (Hot-Reloading)
# ---------------------------------------
FROM base AS development
# En desarrollo, montamos el código como volumen, así que no copiamos nada aquí.
# El comando por defecto será el de desarrollo.
CMD ["npm", "run", "dev"]

# ---------------------------------------
# Etapa 3: Builder (Compilación)
# ---------------------------------------
FROM base AS builder
COPY . .
RUN npm run build

# ---------------------------------------
# Etapa 4: Producción (Imagen final ligera)
# ---------------------------------------
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
# Solo instalamos dependencias de producción
RUN npm install --only=production
# Copiamos la carpeta compilada desde la etapa builder
COPY --from=builder /app/dist ./dist
# Copiamos la carpeta prisma para poder correr migraciones
COPY --from=builder /app/prisma ./prisma

# Usuario no root por seguridad
USER node

# El comando de inicio corre migraciones y luego levanta el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]