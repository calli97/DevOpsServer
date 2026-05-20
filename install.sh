#!/bin/bash
set -e

# Escapa caracteres que romperían un string TypeScript entre comillas dobles
escape_ts_string() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

# Permite prompts interactivos cuando se ejecuta via curl | bash
if [ ! -t 0 ]; then
  exec < /dev/tty
fi

REPO_URL="https://github.com/calli97/DevOpsServer"
BRANCH="master"

echo
echo "============================================"
echo "   DevOpsServer - Instalador"
echo "============================================"
echo
echo "Que queres instalar?"
echo "  1) Master Server"
echo "  2) Slave Server"
echo
read -p "Elegi una opcion [1/2]: " CHOICE

case "$CHOICE" in
  1)
    SUBDIR="MasterServer"
    INSTALL_DIR="$HOME/devops-master"
    PM2_NAME="devops-master"
    ;;
  2)
    SUBDIR="SlaveServer"
    INSTALL_DIR="$HOME/devops-slave"
    PM2_NAME="devops-slave"
    ;;
  *)
    echo "Opcion invalida. Saliendo."
    exit 1
    ;;
esac

echo
echo "Instalando $SUBDIR en $INSTALL_DIR..."
echo

# --- ACTUALIZAR SISTEMA ---
echo "Actualizando sistema..."
sudo apt update -y && sudo apt upgrade -y

# --- INSTALAR DEPENDENCIAS BASICAS ---
echo "Verificando dependencias base..."
sudo apt install -y curl git build-essential

# --- NVM ---
export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "Instalando NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
\. "$NVM_DIR/nvm.sh"
echo "NVM listo."

# --- NODE ---
if ! command -v node &> /dev/null; then
  echo "Instalando Node.js v22..."
  nvm install 22
  nvm use 22
  nvm alias default 22
else
  echo "Node.js ya instalado ($(node -v))"
fi

# --- PM2 ---
if ! command -v pm2 &> /dev/null; then
  echo "Instalando PM2..."
  npm install -g pm2
else
  echo "PM2 ya instalado."
fi

# --- NGINX (solo master) ---
if [ "$SUBDIR" = "MasterServer" ]; then
  if ! command -v nginx &> /dev/null; then
    echo "Instalando Nginx..."
    sudo apt install -y nginx
    sudo ufw allow 'Nginx Full'
  else
    echo "Nginx ya instalado."
  fi
fi

# --- CLONAR REPOSITORIO ---
echo
echo "Descargando $SUBDIR desde GitHub..."
TMP_DIR="/tmp/DevOpsServer-install-$$"

if [ -d "$INSTALL_DIR" ]; then
  echo "El directorio $INSTALL_DIR ya existe. Actualizando codigo..."
  cd "$INSTALL_DIR"
  git pull origin "$BRANCH"
else
  git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$TMP_DIR"
  mv "$TMP_DIR/$SUBDIR" "$INSTALL_DIR"
  rm -rf "$TMP_DIR"
  cd "$INSTALL_DIR"
fi

# --- CONFIGURACION ---
echo
echo "============================================"
echo "   Configuracion"
echo "============================================"
echo

if [ "$SUBDIR" = "MasterServer" ]; then
  read -p "Puerto del servidor [3040]: " PORT
  PORT=${PORT:-3040}

  read -p "GitHub Webhook Secret: " GITHUB_WEBHOOK_SECRET

  read -p "API Key (para el cliente web): " API_KEY

  echo
  echo "Base de datos:"
  read -p "  Tipo (mysql/mariadb/postgres) [mysql]: " DB_TYPE
  DB_TYPE=${DB_TYPE:-mysql}

  read -p "  Host [localhost]: " DB_HOST
  DB_HOST=${DB_HOST:-localhost}

  read -p "  Puerto [3306]: " DB_PORT
  DB_PORT=${DB_PORT:-3306}

  read -p "  Usuario: " DB_USER

  read -sp "  Password: " DB_PASSWORD
  echo

  read -p "  Nombre de la base de datos [devops]: " DB_NAME
  DB_NAME=${DB_NAME:-devops}

  cat > src/config.ts <<EOF
export default {
  port: $PORT,
  githubWebhookSecret: "$(escape_ts_string "$GITHUB_WEBHOOK_SECRET")",
  apiKey: "$(escape_ts_string "$API_KEY")",
  database: {
    type: "$DB_TYPE",
    host: "$DB_HOST",
    port: $DB_PORT,
    username: "$(escape_ts_string "$DB_USER")",
    password: "$(escape_ts_string "$DB_PASSWORD")",
    database: "$DB_NAME",
  },
};
EOF

else
  read -p "Puerto del servidor [3041]: " PORT
  PORT=${PORT:-3041}

  read -p "API Key (debe coincidir con el registrado en el Master): " API_KEY

  cat > src/config.ts <<EOF
export default {
  port: $PORT,
  apiKey: "$(escape_ts_string "$API_KEY")",
};
EOF
fi

echo
echo "config.ts generado:"
cat src/config.ts
echo

# --- COMPILAR ---
echo "Instalando dependencias npm..."
npm install

echo "Compilando TypeScript..."
npm run build

# --- PM2 ---
echo "Iniciando servidor con PM2..."
if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  pm2 restart "$PM2_NAME"
else
  pm2 start "node ./dist/index.js" --name "$PM2_NAME"
fi

echo "Configurando PM2 startup..."
STARTUP_CMD=$(pm2 startup | grep "sudo env" | tr -d '\n')
if [ -n "$STARTUP_CMD" ]; then
  eval "$STARTUP_CMD"
else
  echo "No se pudo configurar el startup de PM2 automaticamente."
  echo "Ejecuta manualmente: pm2 startup"
fi
pm2 save

# --- FIREWALL ---
echo
echo "Configurando firewall para puerto $PORT..."
if ! command -v ufw &> /dev/null; then
  sudo apt install -y ufw
fi
sudo ufw allow "$PORT/tcp"
sudo ufw status verbose

echo
echo "============================================"
echo "   Instalacion completada!"
echo "   $SUBDIR corriendo en puerto $PORT"
echo "   Directorio de instalacion: $INSTALL_DIR"
echo "============================================"
if [ "$SUBDIR" = "SlaveServer" ]; then
  echo
  echo "IMPORTANTE: el Slave necesita acceso SSH a GitHub"
  echo "para hacer git pull en los repositorios que despliega."
  echo "Si todavia no lo configuraste, ejecuta:"
  echo "  ssh-keygen -t ed25519 -C \"deploy\""
  echo "  cat ~/.ssh/id_ed25519.pub"
  echo "Y agrega esa clave publica en GitHub -> Settings -> Deploy keys"
  echo "del repositorio correspondiente."
fi
echo
