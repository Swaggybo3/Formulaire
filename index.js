// index.js — VERSION FINALE PREMIUM + AUTEUR + AVATAR + EMBED GOLD + FIX + ANIMATION ASCII (multi-messages) + TAGS + STAFF + LOGS
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
  StringSelectMenuBuilder, // ⬅️ pour le menu des tags
} = require("discord.js");

/* ========= CONFIG ========= */
const TOKEN = "ici";

/* ====== RÔLE STAFF & LOGS ====== */
const STAFF_ROLE = "1440293547076096122";     // ID rôle Staff
const LOG_CHANNEL_ID = "1375948211654754411"; // ID salon logs
/* ========================== */

/* ====== CHANNELS SELON TYPE ====== */
const CHANNEL_VENTE = "1379947999287054496";
const CHANNEL_LOCATION = "1446153731724017785";
/* ================================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message],
});

/* ---------- NUMÉRO DOSSIER AUTO ---------- */
let dossierCounter = 1;
function nextDossierNumber() {
  return String(dossierCounter++).padStart(4, "0");
}

/* ---------- COULEURS ---------- */
const GOLD = "#d4af37";
const GREEN = "#1abc9c";
const RED = "#e74c3c";

/* ---------- ID BOUTON ---------- */
function makeBtnId(receiverId) {
  return `start_form::${receiverId}`;
}
function parseBtnId(customId) {
  return customId.split("::")[1];
}

/* ---------- ÉTATS DES FORMULAIRES ---------- */
const states = new Map();

/* ---------- BARRE PROGRESSION ---------- */
function bar(step, total) {
  return "▰".repeat(step) + "▱".repeat(total - step);
}

function questionEmbed(step, total, title, desc, color) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`✨ Étape ${step}/${total}  ${bar(step, total)}\n🟩 ${title}`)
    .setDescription(desc)
    .setFooter({ text: "Réponds ici • Bouton Annuler disponible" });
}

/* ---------- BOUTON ANNULER ---------- */
function cancelBtn(threadId) {
  return new ButtonBuilder()
    .setCustomId(`cancel::${threadId}`)
    .setLabel("Annuler")
    .setEmoji("🛑")
    .setStyle(ButtonStyle.Danger);
}

/* ---------- ANIMATION ASCII (multi-messages) ---------- */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function playLoaderAnimation(thread) {
  const frames = [
    "⏳ Chargement du formulaire...\n```\n█▒▒▒▒▒▒▒▒▒ 10%\n```",
    "⏳ Chargement du formulaire...\n```\n███▒▒▒▒▒▒▒ 30%\n```",
    "⏳ Chargement du formulaire...\n```\n██████▒▒▒▒ 60%\n```",
    "⏳ Chargement du formulaire...\n```\n█████████▒ 90%\n```",
    "✅ Formulaire prêt.\n```\n██████████ 100%\n```"
  ];

  const msg = await thread.send(frames[0]);
  for (let i = 1; i < frames.length; i++) {
    await new Promise(res => setTimeout(res, 600));
    await msg.edit(frames[i]);
  }
}

/* ---------- QUESTION TEXTE ---------- */
async function askText(thread, state, step, total, title, desc, color) {
  const cancel = cancelBtn(thread.id);

  await thread.send({
    embeds: [questionEmbed(step, total, title, desc, color)],
    components: [new ActionRowBuilder().addComponents(cancel)]
  });

  while (true) {
    const collected = await thread.awaitMessages({
      filter: (m) => m.author.id === state.userId,
      max: 1,
      time: 150000,
    });

    if (state.cancelled) throw new Error("cancelled");
    if (collected.size === 0) throw new Error("timeout");

    return collected.first().content.trim();
  }
}

/* ---------- CHOIX VENDRE/LOUER ---------- */
async function askTypeChoice(thread, state, step, total) {
  const vendre = new ButtonBuilder()
    .setCustomId(`type_vendre::${thread.id}`)
    .setLabel("Vendre")
    .setStyle(ButtonStyle.Success);

  const louer = new ButtonBuilder()
    .setCustomId(`type_louer::${thread.id}`)
    .setLabel("Louer")
    .setStyle(ButtonStyle.Primary);

  const cancel = cancelBtn(thread.id);

  const embed = questionEmbed(step, total, "Vendre ou Louer ?", "Clique sur un bouton ci-dessous.", GOLD);

  const msg = await thread.send({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(vendre, louer, cancel)]
  });

  return new Promise((resolve, reject) => {
    const collector = msg.createMessageComponentCollector({
      filter: (i) =>
        i.user.id === state.userId &&
        (i.customId.startsWith("type_vendre") ||
         i.customId.startsWith("type_louer") ||
         i.customId.startsWith("cancel")),
      time: 120000
    });

    collector.on("collect", async (i) => {
      if (i.customId.startsWith("cancel")) {
        state.cancelled = true;
        await i.reply({ content: "🛑 Annulé.", ephemeral: true });
        return reject(new Error("cancelled"));
      }

      const picked = i.customId.startsWith("type_vendre") ? "Vendre" : "Louer";
      await i.reply({ content: `✔ Sélection : **${picked}**`, ephemeral: true });
      resolve(picked);
    });

    collector.on("end", (col, reason) => {
      if (reason === "time") reject(new Error("timeout"));
    });
  });
}

/* ---------- CHOIX DU TAG (type de bien) ---------- */
async function askTag(thread, state, step, total) {
  const select = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`tag_select::${thread.id}`)
      .setPlaceholder("Choisir le type de bien")
      .addOptions([
        { label: "Maison", value: "Maison", emoji: "🏠" },
        { label: "Appartement", value: "Appartement", emoji: "🏢" },
        { label: "Villa", value: "Villa", emoji: "🏡" },
        { label: "Garage", value: "Garage", emoji: "🚗" },
        { label: "Stockage", value: "Stockage", emoji: "📦" },
        { label: "Bureau", value: "Bureau", emoji: "💼" },
        { label: "Terrain", value: "Terrain", emoji: "🌾" },
        { label: "Local commercial", value: "Local commercial", emoji: "📍" },
        { label: "Atelier", value: "Atelier", emoji: "⚙️" },
      ])
  );

  const embed = questionEmbed(
    step, total,
    "Catégorie du bien",
    "Choisis le type du bien dans le menu déroulant.",
    GOLD
  );

  const msg = await thread.send({ embeds: [embed], components: [select] });

  return new Promise((resolve, reject) => {
    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === state.userId && i.customId.startsWith("tag_select"),
      time: 120000
    });

    collector.on("collect", async (i) => {
      const chosen = i.values[0];
      await i.reply({ content: `✔ Catégorie sélectionnée : **${chosen}**`, ephemeral: true });
      resolve(chosen);
    });

    collector.on("end", (_, r) => {
      if (r === "time") reject(new Error("timeout"));
    });
  });
}

/* ---------- PHOTOS ---------- */
async function collectImages(thread, state) {
  const done = new ButtonBuilder()
    .setCustomId(`photos_done::${thread.id}`)
    .setLabel("J'ai fini")
    .setStyle(ButtonStyle.Success);

  const cancel = cancelBtn(thread.id);

  // Étape 6/6 (Catégorie ajoutée en étape 3)
  await thread.send({
    embeds: [questionEmbed(6, 6, "Photos", "Envoie **1 à 4 photos** depuis ton PC.\nPuis clique **J'ai fini**.", GREEN)],
    components: [new ActionRowBuilder().addComponents(done, cancel)]
  });

  const urls = [];
  return new Promise((resolve) => {
    const collector = thread.createMessageCollector({
      filter: (m) => m.author.id === state.userId,
      time: 180000,
    });

    state.photoCollector = collector;

    collector.on("collect", (m) => {
      for (const att of m.attachments.values()) {
        if ((att.contentType || "").startsWith("image/") && urls.length < 4) {
          urls.push(att.url);
        }
      }
    });

    collector.on("end", () => {
      state.photoCollector = null;
      resolve(urls.length > 0 ? urls : null);
    });
  });
}

/* ---------- RÉSUMÉ (AVATAR + PREMIUM GOLD) ---------- */
async function showSummary(thread, state) {
  const d = state.data;

  const embed = new EmbedBuilder()
    .setColor(GREEN)
    .setTitle(`📄 RÉSUMÉ — Dossier #${state.dossierNumber}`)
    .addFields(
      { name: "Auteur", value: `<@${d.auteur}>` },
      { name: "ID", value: d.id },
      { name: "Type", value: d.type },
      { name: "Catégorie", value: d.tag || "—" },
      { name: "Prix", value: d.prix },
      { name: "Date", value: d.date },
      { name: "Photos", value: d.photos.map((p,i)=>`[Photo ${i+1}](${p})`).join(" | ") }
    )
    .setThumbnail(
      client.users.cache.get(d.auteur)?.displayAvatarURL({ dynamic: true }) ||
      thread.guild.members.cache.get(d.auteur)?.displayAvatarURL({ dynamic: true })
    )
    .setImage(d.photos[0])
    .setFooter({ text: `Dossier #${state.dossierNumber} • Auteur: ${d.auteur}` });

  const confirm = new ButtonBuilder()
    .setCustomId(`confirm::${thread.id}`)
    .setLabel("✔ Confirmer")
    .setStyle(ButtonStyle.Success);

  const modify = new ButtonBuilder()
    .setCustomId(`modify::${thread.id}`)
    .setLabel("✏ Modifier")
    .setStyle(ButtonStyle.Primary);

  const cancel = cancelBtn(thread.id);

  await thread.send({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(confirm, modify, cancel)]
  });
}

/* ---------- MENU MODIFIER ---------- */
async function showModifyMenu(thread, state) {
  const embed = new EmbedBuilder()
    .setColor(GOLD)
    .setTitle("✏ Modifier un champ");

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`mod_id::${thread.id}`).setLabel("ID").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`mod_type::${thread.id}`).setLabel("Type").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`mod_tag::${thread.id}`).setLabel("Catégorie").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`mod_prix::${thread.id}`).setLabel("Prix").setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`mod_date::${thread.id}`).setLabel("Date").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`mod_photos::${thread.id}`).setLabel("Photos").setStyle(ButtonStyle.Secondary),
  );

  const back = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`back_summary::${thread.id}`).setLabel("⬅ Retour").setStyle(ButtonStyle.Primary)
  );

  await thread.send({ embeds: [embed], components: [row1, row2, back] });
}

/* ---------- SETUPFORM (EMBED PREMIUM GOLD) ---------- */
client.once(Events.Ready, async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);

  const cmd = {
    name: "setupform",
    description: "Installe un bouton pour lancer un formulaire immobilier",
    options: [
      {
        name: "channel_button",
        description: "Salon où afficher l’embed premium + bouton",
        type: 7,
        required: true,
      },
      {
        name: "channel_receiver",
        description: "Salon où envoyer les fiches complètes",
        type: 7,
        required: true,
      }
    ]
  };

  for (const [guildId] of client.guilds.cache) {
    await client.application.commands.create(cmd, guildId).catch(()=>{});
  }
});

/* ------------ ACTIVITÉS DYNAMIQUES PREMIUM ------------ */
function getMembers() {
  return client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
}
const activities = [
  () => ({ name: `👥 ${getMembers()} membres`, type: 3 }),
  () => ({ name: `🏢 Vente d'appartement`, type: 0 }),
  () => ({ name: `🏠 Vente de maison`, type: 2 }),
  () => ({ name: `🟢 Les nouvelles ventes`, type: 3 }),
  () => ({ name: `🛡️ Sécurise ${getMembers()} membres`, type: 3 }),
  () => ({ name: `👀 les agents immobiliers`, type: 3 }),
  () => ({ name: `🏷️ Gestion de ${client.channels.cache.size} salons`, type: 3 }),
  () => ({ name: `📦 les entrepots`, type: 3 }),
  () => ({ name: `⚙️ Logs en temps réel`, type: 3 }),
];
let i = 0;
setInterval(() => {
  const activity = activities[i % activities.length]();
  client.user.setPresence({ status: "online", activities: [activity] });
  i++;
}, 20000);

/* ---------- INTERACTIONS ---------- */
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    /* ---------- SETUPFORM ---------- */
    if (interaction.isChatInputCommand() && interaction.commandName === "setupform") {
      const btnChan = interaction.options.getChannel("channel_button");
      const recvChan = interaction.options.getChannel("channel_receiver");

      const embed = new EmbedBuilder()
        .setColor("#D4AF37")
        .setTitle("🏛️ Formulaire Immobilier")
        .setThumbnail("https://i.goopics.net/li2uku.png")
        .setDescription(
          "**Bienvenue dans le service privé d’enregistrement immobilier.**\n\n" +
          "Cliquez sur le bouton ci-dessous pour lancer l’assistant guidé.\n" +
          "Chaque étape vous permettra de renseigner vos informations en toute simplicité."
        )
        .addFields(
          { name: "📌 Processus", value: "Formulaire guidé en **6 étapes**" },
          { name: "⏱️ Durée estimée", value: "Environ **1 minute**" },
          { name: "🔒 Sécurité", value: "Vos informations restent **confidentielles**" }
        )
        .setImage("https://i.goopics.net/li2uku.png")
        .setFooter({ text: "Système Premium Immobilier • Service automatisé" });

      const btn = new ButtonBuilder()
        .setCustomId(makeBtnId(recvChan.id))
        .setLabel("🚀 Remplir un formulaire")
        .setStyle(ButtonStyle.Success);

      await btnChan.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(btn)] });
      return interaction.reply({ content: "✔ Embed premium installé", ephemeral: true });
    }

    /* ---------- START FORM ---------- */
    if (interaction.isButton() && interaction.customId.startsWith("start_form::")) {
      // Vérification STAFF obligatoire
      if (STAFF_ROLE && !interaction.member.roles.cache.has(STAFF_ROLE)) {
        return interaction.reply({
          content: "❌ Vous n’avez pas le rôle requis pour utiliser ce formulaire.",
          ephemeral: true
        });
      }

      const recvId = parseBtnId(interaction.customId);
      const recv = interaction.guild.channels.cache.get(recvId);

      let thread;
      try {
        thread = await recv.threads.create({
          name: `dossier-${interaction.user.username}`,
          autoArchiveDuration: 60,
          type: ChannelType.PrivateThread
        });
        await thread.members.add(interaction.user.id);

        // ➕ Ajout staff automatiquement au thread (10 premiers membres du rôle)
        if (STAFF_ROLE) {
          const staffRole = interaction.guild.roles.cache.get(STAFF_ROLE);
          if (staffRole) {
            const staffMembers = staffRole.members.first(10); // renvoie un tableau de GuildMember
            for (const member of staffMembers) {
              try { await thread.members.add(member.id); } catch {}
            }
          }
        }
      } catch {
        return interaction.reply({ content: "❌ Impossible de créer un thread.", ephemeral: true });
      }

      const state = {
        userId: interaction.user.id,
        receiverId: recvId,
        dossierNumber: nextDossierNumber(),
        data: { 
          auteur: interaction.user.id,
          id: "",
          type: "",
          tag: "",
          prix: "",
          date: "",
          photos: []
        },
        cancelled: false,
        photoCollector: null
      };

      states.set(thread.id, state);

      await interaction.deferUpdate().catch(() => {});
await thread.send(`🧵 Formulaire démarré pour <@${interaction.user.id}>`);


      // Animation
      await playLoaderAnimation(thread);

      try {
        // 1/6 — ID
        state.data.id = await askText(thread, state, 1, 6, "ID du bien", "Entre l'identifiant du bien.", GOLD);
        // 2/6 — TYPE
        state.data.type = await askTypeChoice(thread, state, 2, 6);
        // 3/6 — TAG
        state.data.tag = await askTag(thread, state, 3, 6);
        // 4/6 — PRIX
        const prix = await askText(thread, state, 4, 6, "Prix", "Entre le prix (le $ sera ajouté).", GOLD);
        state.data.prix = `$${prix}`;
        // 5/6 — DATE
        state.data.date = await askText(thread, state, 5, 6, "Date", "Ex : 03/12/2025.", GREEN);
        // 6/6 — PHOTOS
        const photos = await collectImages(thread, state);
        if (!photos) throw new Error("cancelled");
        state.data.photos = photos;

        await showSummary(thread, state);

      } catch (err) {
        await thread.send("🛑 Formulaire annulé ou expiré.");
        states.delete(thread.id);
        await thread.setArchived(true).catch(()=>{});
      }
    }

    /* ---------- FIN PHOTOS ---------- */
    if (interaction.isButton() && interaction.customId.startsWith("photos_done::")) {
      const threadId = interaction.customId.split("::")[1];
      const state = states.get(threadId);
      if (state?.photoCollector) state.photoCollector.stop("done");
      await interaction.reply({ content: "📸 Photos sauvegardées.", ephemeral: true });
    }

    /* ---------- ANNULER ---------- */
    if (interaction.isButton() && interaction.customId.startsWith("cancel::")) {
      const threadId = interaction.customId.split("::")[1];
      const state = states.get(threadId);
      if (state) {
        state.cancelled = true;
        if (state.photoCollector) state.photoCollector.stop("cancel");
      }
      await interaction.reply({ content: "🛑 Formulaire annulé.", ephemeral: true });
      const thread = interaction.channel;
      await thread.setArchived(true).catch(()=>{});
      states.delete(threadId);
    }

    /* ---------- MODIFIER ---------- */
    if (interaction.isButton() && interaction.customId.startsWith("modify::")) {
      const threadId = interaction.customId.split("::")[1];
      const state = states.get(threadId);
      await interaction.deferUpdate();
      await showModifyMenu(interaction.channel, state);
    }

    /* ---------- RETOUR ---------- */
    if (interaction.isButton() && interaction.customId.startsWith("back_summary::")) {
      const threadId = interaction.customId.split("::")[1];
      const state = states.get(threadId);
      await interaction.deferUpdate();
      await showSummary(interaction.channel, state);
    }

    /* ---------- MODIFIER UN CHAMP ---------- */
    if (interaction.isButton() && interaction.customId.startsWith("mod_")) {
      const [ , field, threadId ] = interaction.customId.split("::");
      const state = states.get(threadId);
      const thread = interaction.channel;

      await interaction.deferUpdate();
      try {
        if (field === "id") state.data.id = await askText(thread, state, 1, 1, "Modifier : ID", "Nouvelle valeur :", GOLD);
        if (field === "type") state.data.type = await askTypeChoice(thread, state, 1, 1);
        if (field === "tag") state.data.tag = await askTag(thread, state, 1, 1);
        if (field === "prix") {
          const p = await askText(thread, state, 1, 1, "Modifier : Prix", "Nouvelle valeur :", GOLD);
          state.data.prix = `$${p}`;
        }
        if (field === "date") state.data.date = await askText(thread, state, 1, 1, "Modifier : Date", "Nouvelle date :", GREEN);
        if (field === "photos") {
          const p = await collectImages(thread, state);
          if (p) state.data.photos = p;
        }
        await showSummary(thread, state);
      } catch {}
    }

    /* ---------- CONFIRMER ENVOI ---------- */
    if (interaction.isButton() && interaction.customId.startsWith("confirm::")) {
      const threadId = interaction.customId.split("::")[1];
      const state = states.get(threadId);
      if (!state) return;

      const d = state.data; // ⬅️ définir d AVANT utilisation

      // Choix du salon selon le type
      let recv;
      if (d.type === "Vendre") {
        recv = interaction.guild.channels.cache.get(CHANNEL_VENTE);
      } else if (d.type === "Louer") {
        recv = interaction.guild.channels.cache.get(CHANNEL_LOCATION);
      }
      if (!recv) {
        return interaction.reply({
          content: "❌ Erreur : Salon de destination introuvable. Vérifie CHANNEL_VENTE et CHANNEL_LOCATION.",
          ephemeral: true
        });
      }

      // Embed principal
      const embed = new EmbedBuilder()
        .setColor(GREEN)
        .setTitle(`📄 Nouvelle fiche — Dossier #${state.dossierNumber}`)
        .addFields(
          { name: "Auteur", value: `<@${d.auteur}>` },
          { name: "ID", value: d.id },
          { name: "Type", value: d.type },
          { name: "Catégorie", value: d.tag || "—" },
          { name: "Prix", value: d.prix },
          { name: "Date", value: d.date },
          { name: "Photos", value: d.photos.map((p,i)=>`[Photo ${i+1}](${p})`).join(" | ") }
        )
        .setThumbnail(
          interaction.guild.members.cache.get(d.auteur)?.displayAvatarURL({ dynamic: true }) ||
          client.users.cache.get(d.auteur)?.displayAvatarURL({ dynamic: true })
        )
        .setImage(d.photos[0])
        .setFooter({ text: `Fiche validée — Dossier #${state.dossierNumber}` });

      await recv.send({ embeds: [embed] });
      await interaction.reply({ content: "✔ Fiche envoyée !", ephemeral: true });

      // LOGS AUTOMATIQUES (même contenu, canal différent)
      if (LOG_CHANNEL_ID) {
        const logChan = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setColor("#ffaa00")
            .setTitle(`📁 LOG — Dossier #${state.dossierNumber}`)
            .addFields(
              { name: "Auteur", value: `<@${d.auteur}>` },
              { name: "ID", value: d.id },
              { name: "Type", value: d.type },
              { name: "Catégorie", value: d.tag || "—" },
              { name: "Prix", value: d.prix },
              { name: "Date", value: d.date }
            )
            .setThumbnail(
              interaction.guild.members.cache.get(d.auteur)?.displayAvatarURL({ dynamic: true }) ||
              client.users.cache.get(d.auteur)?.displayAvatarURL({ dynamic: true })
            )
            .setImage(d.photos[0])
            .setFooter({ text: `Logs automatiques — Dossier #${state.dossierNumber}` });

          try { await logChan.send({ embeds: [logEmbed] }); } catch {}
        }
      }

      // Nettoyage
      const thread = interaction.channel;
      await thread.setArchived(true).catch(()=>{});
      states.delete(threadId);
    }

  } catch (err) {
    console.log("❌", err);
  }
});

/* ---------- LOGIN ---------- */
client.login(TOKEN);
