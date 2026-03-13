#!/bin/bash
set -e  # detener script si algo falla

echo "🚀 Iniciando instalación de DevOpsServer..."
echo

# --- ACTUALIZAR SISTEMA ---
echo "🔄 Actualizando sistema..."
sudo apt update -y && sudo apt upgrade -y

# --- INSTALAR DEPENDENCIAS BÁSICAS ---
echo "📦 Verificando dependencias base..."
sudo apt install -y curl git build-essential

# --- VERIFICAR NVM ---
if ! command -v nvm &> /dev/null; then
  echo "🟢 Instalando NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
  echo "✅ NVM ya está instalado."
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# --- VERIFICAR NODE ---
if ! command -v node &> /dev/null; then
  echo "🟢 Instalando Node.js v22..."
  nvm install 22
  nvm use 22
  nvm alias default 22
else
  NODE_VERSION=$(node -v)
  echo "✅ Node.js ya está instalado ($NODE_VERSION)"
fi

# --- VERIFICAR PM2 ---
if ! command -v pm2 &> /dev/null; then
  echo "🟢 Instalando PM2..."
  npm install -g pm2
else
  echo "✅ PM2 ya está instalado."
fi

# --- SOLICITAR DATOS DE CONFIGURACIÓN ---
echo
echo "⚙️  Configuración de la base de datos:"
read -p "DB_TYPE (ej: mysql / mariadb / postgres): " DB_TYPE
read -p "DB_HOST (ej: localhost): " DB_HOST
read -p "DB_PORT (ej: 3306): " DB_PORT
read -p "DB_USER: " DB_USER
read -sp "DB_PASSWORD: " DB_PASSWORD
echo
read -p "DB_NAME: " DB_NAME

echo
read -p "Puerto para el servidor (ej: 3040): " PORT
read -p "GitHub Webhook Secret: " GITHUB_WEBHOOK_SECRET
read -p "API Key: " API_KEY

# --- CREAR ARCHIVO config.ts ---
CONFIG_FILE="src/config.ts"
echo
echo "🧾 Creando archivo $CONFIG_FILE..."
cat > $CONFIG_FILE <<EOF
export default {
  port: $PORT,
  githubWebhookSecret: "$GITHUB_WEBHOOK_SECRET",
  apiKey: "$API_KEY",
  database: {
    type: "$DB_TYPE",
    host: "$DB_HOST",
    port: $DB_PORT,
    username: "$DB_USER",
    password: "$DB_PASSWORD",
    database: "$DB_NAME",
  },
};
EOF

echo "✅ Archivo config.ts creado con éxito:"
cat $CONFIG_FILE
echo

# --- COMPILAR Y LEVANTAR SERVIDOR ---
echo "⚙️  Compilando aplicación..."
npm install
npm run build

echo "🚀 Iniciando servidor con Node.js..."
pm2 start "node ./dist/index.js" --name devops-server
pm2 save

echo
echo "🧱 Configurando firewall para permitir el puerto $PORT..."

if ! command -v ufw &> /dev/null; then
  echo "🟢 Instalando UFW..."
  sudo apt install -y ufw
fi

sudo ufw allow $PORT/tcp
sudo ufw status verbose

echo
echo "✅ Instalación completada con éxito."
echo "El servidor se está ejecutando en el puerto $PORT"
echo