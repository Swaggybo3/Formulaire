# 🚔 FiveM Discord Bot

Un bot Discord qui affiche le **statut de ton serveur FiveM** (en ligne, joueurs connectés, etc.) directement dans un salon Discord, avec mise à jour automatique.

## ⚙️ Fonctionnalités
- Affiche le nombre de joueurs connectés sur ton serveur FiveM.
- Met à jour automatiquement les informations toutes les minutes.
- Affiche un embed stylé avec les infos du serveur.
- Connexion rapide via `connect IP:PORT`.

## 🧩 Configuration

1. Ouvre le fichier `index.js`.
2. Remplace la ligne suivante :
   ```js
   const TOKEN = 'TON_BOT_TOKEN_ICI';
   ```
   par le token de ton bot Discord.
3. Vérifie que le salon Discord (`CHANNEL_ID`) correspond bien à ton salon.

## 🚀 Lancer le bot

```bash
npm install
node index.js
```

## 📡 Exemple

L’embed affichera automatiquement :
- 🟢 Serveur en ligne
- 👥 Nombre de joueurs connectés
- ⏱️ Ping
- 💬 Lien F8 : `connect 213.32.43.207:33161`

---
Développé pour ton serveur FiveM ❤️
