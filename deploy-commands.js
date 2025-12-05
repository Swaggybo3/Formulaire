// deploy-commands.js
const { REST, Routes } = require('discord.js');

const TOKEN = 'MzIzODg0NjMzNjQzMTU1NDU2.GVfCHS.vIX7ups7uCHkKjRKSR8iIEHKBCwBetZDKgBC-8';
const CLIENT_ID = '323884633643155456'; // l'ID de ton application (bot)
const GUILD_ID  = '1127299359336300668';  // serveur cible pour un déploiement instantané

const commands = [
  {
    name: "setupform",
    description: "Publie le bouton du formulaire",
    options: [
      {
        name: "channel_button",
        description: "Salon où poster le bouton",
        type: 7,
        required: true,
      },
      {
        name: "channel_receiver",
        description: "Salon où iront les embeds",
        type: 7,
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    // Guild command (instantané)
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );
    console.log('✅ Commandes slash (guild) déployées !');
  } catch (error) {
    console.error(error);
  }
})();
