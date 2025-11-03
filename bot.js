const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const cron = require('node-cron');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const queues = new Map();
const pauseTimers = new Map();

// ----------------- Data diária -----------------
client.once('clientReady', () => {
    console.log(`Bot ligado como ${client.user.tag}`);

    const canal = client.channels.cache.get(CHANNEL_ID);
    if (canal) canal.send(`⚡ BotCerveja está online e pronto!`);

    cron.schedule('0 9 * * *', () => {
        const hoje = new Date();
        const dataFormatada = hoje.toLocaleDateString('pt-PT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const canal = client.channels.cache.get(CHANNEL_ID);
        if (canal) canal.send(`📅 Hoje é **${dataFormatada}**.`);
    }, {
        timezone: "Europe/Lisbon"
    });
});

// ----------------- Comandos de música -----------------
client.on('messageCreate', async (message) => {
    if (!message.guild || message.channel.id !== CHANNEL_ID || !message.content.startsWith('-')) return;

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    if (command === '-p') {
        const url = args[0];
        if (!url || !ytdl.validateURL(url)) return message.reply('Por favor, envie um link válido do YouTube.');

        const memberVoiceChannel = message.member.voice.channel;
        if (!memberVoiceChannel) return message.reply('Entre em um canal de voz primeiro.');

        let queue = queues.get(message.guild.id);
        if (!queue) {
            queue = { songs: [], player: createAudioPlayer(), connection: null, current: null, textChannel: message.channel, nowPlayingMessage: null };
            queues.set(message.guild.id, queue);

            queue.player.on(AudioPlayerStatus.Idle, () => {
                queue.songs.shift();
                if (queue.songs.length > 0) {
                    playSong(message.guild.id, queue.songs[0]);
                } else {
                    startIdleTimer(message.guild.id);
                    if (queue.nowPlayingMessage) queue.nowPlayingMessage.edit({ content: '🎶 Fila acabou.', embeds: [] });
                }
            });
        }

        queue.songs.push(url);
        message.channel.send({ embeds: [new EmbedBuilder()
            .setTitle(`✅ Música adicionada à fila (#${queue.songs.length})`)
            .setDescription(url)
            .setColor('Blue')
        ]});

        if (!queue.current) {
            if (!queue.connection) {
                queue.connection = joinVoiceChannel({
                    channelId: memberVoiceChannel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator
                });
                queue.connection.subscribe(queue.player);
            }
            playSong(message.guild.id, url);
        }

    } else if (command === '-pause') {
        const queue = queues.get(message.guild.id);
        if (!queue || !queue.current) return message.reply('Nenhuma música está tocando.');
        queue.player.pause();
        message.channel.send({ embeds: [new EmbedBuilder().setTitle('⏸ Música pausada').setColor('Yellow')] });
        startIdleTimer(message.guild.id);

    } else if (command === '-resume') {
        const queue = queues.get(message.guild.id);
        if (!queue || !queue.current) return message.reply('Nenhuma música está pausada.');
        queue.player.unpause();
        message.channel.send({ embeds: [new EmbedBuilder().setTitle('▶ Música resumida').setColor('Green')] });
        clearIdleTimer(message.guild.id);

    } else if (command === '-stop') {
        stopMusic(message.guild.id);
        message.channel.send({ embeds: [new EmbedBuilder().setTitle('⏹ Música parada e fila limpa').setColor('Red')] });

    } else if (command === '-queue') {
        const queue = queues.get(message.guild.id);
        if (!queue || queue.songs.length === 0) return message.reply('A fila está vazia.');

        const queueEmbed = new EmbedBuilder()
            .setTitle('🎶 Fila de músicas')
            .setColor('Blue')
            .setDescription(queue.songs.map((song, i) => `${i + 1}. ${song}`).join('\n'));
        message.channel.send({ embeds: [queueEmbed] });
    }
});

// ----------------- Funções auxiliares -----------------
async function playSong(guildId, url) {
    const queue = queues.get(guildId);
    if (!queue) return;

    if (pauseTimers.get(guildId)) clearTimeout(pauseTimers.get(guildId));

    const stream = ytdl(url, { filter: 'audioonly', highWaterMark: 1 << 25 });
    const resource = createAudioResource(stream);
    queue.current = url;
    queue.player.play(resource);

    // Embed "Agora tocando" com fila
    const embed = new EmbedBuilder()
        .setTitle('🎶 Agora tocando')
        .setDescription(url)
        .setColor('Purple');

    if (queue.nowPlayingMessage) {
        queue.nowPlayingMessage.edit({ embeds: [embed] });
    } else {
        queue.textChannel.send({ embeds: [embed] }).then(msg => queue.nowPlayingMessage = msg);
    }
}

function startIdleTimer(guildId) {
    if (pauseTimers.get(guildId)) clearTimeout(pauseTimers.get(guildId));
    const timer = setTimeout(() => stopMusic(guildId), 20 * 60 * 1000);
    pauseTimers.set(guildId, timer);
}

function clearIdleTimer(guildId) {
    if (pauseTimers.get(guildId)) {
        clearTimeout(pauseTimers.get(guildId));
        pauseTimers.delete(guildId);
    }
}

function stopMusic(guildId) {
    const queue = queues.get(guildId);
    if (!queue) return;

    queue.player.stop();
    if (queue.connection) queue.connection.destroy();
    queues.delete(guildId);
    clearIdleTimer(guildId);
}

// ----------------- Login -----------------
client.login(TOKEN);