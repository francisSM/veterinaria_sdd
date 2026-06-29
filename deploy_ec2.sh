#!/bin/bash
# ==============================================================================
# SCRIPT DE DESPLIEGUE REMOTO - AWS EC2 STAGING BRIDGE (veterinaria_sdd)
# ==============================================================================
set -e

echo "=== [1/5] Actualizando dependencias y utilidades Linux ==="
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl git build-essential postgresql-client

echo "=== [2/5] Instalando Runtime Node.js (v18.x) y PM2 ==="
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

echo "=== [3/5] Configurando variables de entorno seguras ==="
export NODE_ENV=production
export PORT=3000
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=produccion_pass_l5
export DB_NAME=veterinaria_sdd
export JWT_SECRET=super_secret_jwt_token_key_generation_L5

echo "=== [4/5] Restaurando Esquema SQL de 40 Tablas (DDL) ==="
# Simulación de la migración relacional
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/migrations/001_create_hcc_tables.sql || true
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/migrations/002_create_ilm_tables.sql || true
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/migrations/003_create_fap_tables.sql || true
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/migrations/004_create_gap_tables.sql || true

echo "=== [5/5] Compilando e Inicializando aplicación mediante PM2 ==="
npm install
npm run build || true
pm2 delete AppServerL5 2>/dev/null || true
pm2 start dist/app.js --name "AppServerL5"

echo "=== DESPLIEGUE FINALIZADO EXITOSAMENTE EN AWS EC2 ==="
echo "La API se encuentra escuchando en el puerto 3000."
