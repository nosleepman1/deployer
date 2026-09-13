#!/usr/bin/env bash
# ==============================================================================
# Script d'installation & de lancement One-Line d'AMBO Deployer
# Usage sur un VPS vierge :
# curl -fsSL https://raw.githubusercontent.com/nosleepman1/deployer/main/scripts/install.sh | bash
# ==============================================================================

set -e

echo "============================================================="
echo "   🚀 Préparation de l'environnement AMBO Tech Deployer"
echo "============================================================="

# 1. Mise à jour minimale et paquets indispensables
sudo apt-get update -y
sudo apt-get install -y curl wget git ufw htop unzip net-tools

# 2. Installation de Node.js v20 LTS si absent
if ! command -v node &> /dev/null; then
  echo "📥 Installation de Node.js v20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "✔ Node.js version : $(node -v)"
echo "✔ NPM version     : $(npm -v)"

# 3. Installation d'AMBO Deployer dans /opt/ambo-deployer
DEPLOYER_DIR="/opt/ambo-deployer"

if [ -d "$DEPLOYER_DIR" ]; then
  echo "🔄 Mise à jour du CLI Deployer..."
  cd "$DEPLOYER_DIR"
  git pull origin main
else
  echo "📦 Clonage du CLI Deployer..."
  sudo git clone https://github.com/nosleepman1/deployer.git "$DEPLOYER_DIR"
  sudo chown -R $USER:$USER "$DEPLOYER_DIR"
  cd "$DEPLOYER_DIR"
fi

# 4. Installation des dépendances et compilation
echo "⚙️ Installation des dépendances et compilation TypeScript..."
npm install --loglevel=error
npm run build

# 5. Création du lien symbolique global 'deployer'
sudo ln -sf "$DEPLOYER_DIR/bin/deployer.js" /usr/local/bin/deployer
sudo chmod +x /usr/local/bin/deployer

echo "============================================================="
echo "✅ AMBO Deployer est prêt ! Lancement de l'assistant..."
echo "============================================================="

deployer init
