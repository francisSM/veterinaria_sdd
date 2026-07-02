# ==========================================
# VetGuard L5 — Dockerfile de Producción
# ==========================================

# Stage 1: Build de Aplicación (Backend + Frontend)
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar archivos de dependencias e instalar todas (incluyendo devDependencies)
COPY package*.json ./
RUN npm install --no-audit

# Copiar el resto del código del proyecto
COPY . .

# Compilar el backend TypeScript a dist/
RUN npm run build

# Compilar el frontend React/Vite a dist-frontend/
RUN npx vite build

# Stage 2: Runtime de Producción
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copiar dependencias e instalar solo las de producción
COPY package*.json ./
RUN npm install --only=production --no-audit

# Copiar los compilados desde el stage builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-frontend ./dist-frontend
COPY --from=builder /app/database ./database

# Exponer el puerto de producción del servidor Express
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "dist/app.js"]
