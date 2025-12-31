// index.js (ESM)
import 'dotenv/config';
import {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActivityType
} from 'discord.js';

// 🔐 Variables de entorno
const ALERT_CHANNEL_ID = process.env.ALERT_CHANNEL_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// Validaciones básicas
if (!ALERT_CHANNEL_ID) {
    console.error('❌ ERROR: Falta ALERT_CHANNEL_ID en el archivo .env');
    process.exit(1);
}

if (!DISCORD_TOKEN) {
    console.error('❌ ERROR: Falta DISCORD_TOKEN en el archivo .env');
    process.exit(1);
}

// Si quieres limitar a un rol concreto, pon aquí su ID. Si no, déjalo en null.
const STREAMER_ROLE_ID = null; // ej: "123456789012345678"

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,   // para streaming externo
        GatewayIntentBits.GuildVoiceStates, // para Go Live en canales de voz
        GatewayIntentBits.GuildMessages
    ]
});

// Para no spamear mientras el usuario sigue en vivo
const activeStreams = new Set();

// Evento recomendado en v14→v15
client.once('clientReady', () => {
    console.log(`✅ Bot iniciado como ${client.user.tag}`);
});

/* ---------------------------------------------------------------------- */
/* 1) Streaming externo (Twitch/YouTube) detectado por presenceUpdate     */
/* ---------------------------------------------------------------------- */
client.on('presenceUpdate', (oldPresence, newPresence) => {
    if (!newPresence || !newPresence.member) return;
    const member = newPresence.member;

    // Ignorar bots
    if (member.user.bot) return;

    // Filtrar por rol (si se configuró)
    if (STREAMER_ROLE_ID && !member.roles.cache.has(STREAMER_ROLE_ID)) {
        return;
    }

    const activities = newPresence.activities ?? [];
    const streamingActivity = activities.find(
        (a) => a.type === ActivityType.Streaming
    );

    const userId = member.id;

    // Empezó stream externo
    if (streamingActivity && !activeStreams.has(userId)) {
        activeStreams.add(userId);
        sendStreamAlert(member, {
            type: 'external',
            activityName: streamingActivity.name || 'Transmisión',
            url: streamingActivity.url || null,
            voiceChannelName: null
        });
    }

    // Dejó de hacer streaming externo
    if (!streamingActivity && activeStreams.has(userId)) {
        // Si también usas Go Live, dejamos que voiceStateUpdate limpie cuando toque.
    }
});

/* ---------------------------------------------------------------------- */
/* 2) Go Live en canales de voz (Discord) detectado por voiceStateUpdate  */
/* ---------------------------------------------------------------------- */
client.on('voiceStateUpdate', (oldState, newState) => {
    const member = newState.member ?? oldState.member;
    if (!member || member.user.bot) return;

    // Filtrar por rol (si se configuró)
    if (STREAMER_ROLE_ID && !member.roles.cache.has(STREAMER_ROLE_ID)) {
        return;
    }

    const userId = member.id;

    const startedStreaming = !oldState.streaming && newState.streaming;
    const stoppedStreaming = oldState.streaming && !newState.streaming;

    // Empezó Go Live
    if (startedStreaming && !activeStreams.has(userId)) {
        activeStreams.add(userId);

        const voiceChannelName = newState.channel
            ? newState.channel.name
            : 'un canal de voz';

        sendStreamAlert(member, {
            type: 'golive',
            activityName: 'Go Live',
            url: null,
            voiceChannelName
        });
    }

    // Terminó Go Live
    if (stoppedStreaming && activeStreams.has(userId)) {
        activeStreams.delete(userId);
    }
});

/* ---------------------------------------------------------------------- */
/* Función común para enviar la notificación al canal de alertas          */
/* ---------------------------------------------------------------------- */
async function sendStreamAlert(member, info) {
    try {
        const channel = await member.client.channels.fetch(ALERT_CHANNEL_ID);
        if (!channel) {
            console.warn('⚠️ No encuentro el canal de alertas');
            return;
        }

        const { type, activityName, url, voiceChannelName } = info;

        let description = `👤 **${member.user.tag}** ha comenzado a transmitir.`;

        if (type === 'golive' && voiceChannelName) {
            description = `👤 **${member.user.tag}** está en vivo en **${voiceChannelName}**.`;
        }

        const fields = [
            {
                name: 'Actividad',
                value: activityName,
                inline: true
            }
        ];

        if (url) {
            fields.push({
                name: 'Enlace',
                value: url,
                inline: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('📡 ¡Nuevo stream en Discord!')
            .setDescription(description)
            .addFields(fields)
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

        await channel.send({
            content: '@everyone 📡 ¡Un miembro ha iniciado transmisión!',
            embeds: [embed],
            allowedMentions: {
                parse: ['everyone']   // Habilita @everyone de forma explícita
            }
        });

    } catch (err) {
        console.error('Error enviando alerta de streaming:', err);
    }
}

/* ---------------------------------------------------------------------- */

client.login(DISCORD_TOKEN);
