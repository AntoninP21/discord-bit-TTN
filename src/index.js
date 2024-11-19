require('dotenv').config();
const { Client, IntentsBitField, ChannelType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, entersState } = require('@discordjs/voice');
const path = require('path');
const gTTs = require('gtts');
const MP3_PATH = path.join(__dirname, 'ttn.mp3');
const guildID = process.env.GUILD_ID;
console.log(MP3_PATH);
const tmpPath = path.join(__dirname, 'tmp.mp3');
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildVoiceStates
    ]
});

client.once('ready', () => {
    console.log(`${client.user.tag} is online`);

    const checkTimeAndJoinChannel = async () => {
        const now = new Date();
        const currentHour = (now.getHours() + 2) % 24;
        const currentMinute = now.getMinutes();

        const isTargetTime = currentHour === currentMinute;

        if (isTargetTime) {
            const guild = client.guilds.cache.get(guildID);
            if (guild) {
                const voiceChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildVoice);
                if (voiceChannels.size > 0) {

                    let maxUsers = 0;
                    let maxChannels = [];
                    voiceChannels.forEach(channel => {
                        const userCount = channel.members.size;
                        if (userCount > maxUsers) {
                            maxUsers = userCount;
                            maxChannels = [channel];
                        } else if ((userCount === maxUsers) && userCount > 0) {
                            maxChannels.push(channel);
                        }
                    });

                    if (maxChannels.length > 0) {

                        const chosenChannel = maxChannels[Math.floor(Math.random() * maxChannels.length)];
                        const connection = joinVoiceChannel({
                            channelId: chosenChannel.id,
                            guildId: guild.id,
                            adapterCreator: guild.voiceAdapterCreator,
                        });
                        const resource = createAudioResource(MP3_PATH);
                        const player = createAudioPlayer();

                        connection.subscribe(player);
                        player.play(resource);

                        const gtts = new gTTs(`il est ${currentHour} heures et ${currentMinute} minutes`, 'fr');
                        await new Promise((resolve, reject) => {
                            gtts.save(tmpPath, function (err, result) {
                                if (err) return reject(err);
                                resolve(result);
                            });
                        });
                        await entersState(player, AudioPlayerStatus.Idle, 30e3);
                        const resource2 = createAudioResource(tmpPath);
                        player.play(resource2);
                        player.on(AudioPlayerStatus.Idle, () => {
                            console.log('Lecture audio terminée. Déconnexion dans 5 secondes.');
                            setTimeout(() => {
                                if (player.state.status === AudioPlayerStatus.Idle) {
                                    connection.disconnect();
                                    console.log('Déconnexion du salon vocal.');
                                }
                            }, 4000); // 5000 ms = 5 secondes
                        });

                        console.log('Rejoint le salon vocal et joue le son!');
                    } else {
                        console.log('Aucun salon vocal trouvé avec des utilisateurs connectés.');
                    }
                } else {
                    console.log('Aucun salon vocal trouvé.');
                }
            } else {
                console.log('Guilde non trouvée !.');
            }
        }
    };


    setInterval(checkTimeAndJoinChannel, 60000); // 60000ms = 1 minute
});
client.login(process.env.TOKEN);
