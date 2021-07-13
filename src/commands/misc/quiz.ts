import { Client, Command, UserError } from '@structures';
import { CommandInteraction, Message, MessageActionRow, MessageButton } from 'discord.js';
import { decode } from 'he';
import { User, Server, Blacklist } from '@database/models';
import { Gallery, GalleryResult } from '@api/nhentai';
import { BANNED_TAGS } from '@constants';

export default class extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'quiz',
            description:
                'Starts a quiz session: try to guess the title of the displayed doujin page.',
            cooldown: 30000,
            nsfw: true,
        });
    }

    danger = false;
    warning = false;
    iteration = 0;
    gallery: Gallery = null;
    related: Gallery[] = null;
    rawChoices: Gallery[] = [];
    blacklists: Blacklist[] = [];

    async before(interaction: CommandInteraction) {
        try {
            let user = await User.findOne({ userID: interaction.user.id }).exec();
            if (!user) {
                user = await new User({
                    blacklists: [],
                }).save();
            }
            this.blacklists = user.blacklists;
            let server = await Server.findOne({ serverID: interaction.guild.id }).exec();
            if (!server) {
                server = await new Server({
                    settings: { danger: false },
                }).save();
            }
            this.iteration = 0;
            this.gallery = null;
            this.related = null;
            this.rawChoices = [];
            this.blacklists = [];
            this.danger = server.settings.danger;
            this.warning = false;
        } catch (err) {
            this.client.logger.error(err);
            throw new Error(`Database error: ${err.message}`);
        }
    }

    async fetchRandomDoujin() {
        if (this.iteration++ >= 3) return;
        let result: void | GalleryResult = null;
        for (let i = 0; i < 5; i++) {
            result = await this.client.nhentai
                .random(true)
                .catch(err => this.client.logger.error(err.message));
            if (!result) continue;
            const tags = result.gallery.tags;
            const rip = this.client.util.hasCommon(
                tags.map(x => x.id.toString()),
                BANNED_TAGS
            );
            if (this.danger || !rip) break;
        }
        if (!result) return this.fetchRandomDoujin();
        this.gallery = result.gallery;
        this.related = result.related;
        this.related.splice(3, 5);
        this.related.push(this.gallery);
        const titles = this.rawChoices.map(({ title }) => decode(title.english).toLowerCase());
        if ([...new Set(titles)].length < titles.length) return this.fetchRandomDoujin();
    }

    async exec(interaction: CommandInteraction) {
        await this.before(interaction);
        await this.fetchRandomDoujin();
        if (!this.gallery || this.iteration > 3) {
            throw new UserError('NO_RESULT');
        }
        const page = this.client.util.random(this.client.nhentai.getPages(this.gallery));
        const quiz = this.client.embeds
            .default()
            .setTitle(`Guess which doujin is this picture from?`)
            .setDescription(
                'Use buttons to select an option. Your first choice will be your final choice. No cheating!'
            )
            .setImage(page)
            .setTimestamp();
        const choices = this.client.util
            .shuffle(this.related)
            .map(({ id, title: { english }, tags }) => {
                const title = decode(english);
                const t = new Map();
                tags.sort((a, b) => b.count - a.count);
                tags.forEach(tag => {
                    const { id, type, name, count } = tag;
                    const a = t.get(type) || [];
                    let s = `**\`${name}\`**\u2009\`(${
                        count >= 1000 ? `${Math.floor(count / 1000)}K` : count
                    })\``;
                    // let s = `**\`${name}\`** \`(${count.toLocaleString()})\``;
                    if (this.blacklists.some(bl => bl.id === id.toString())) s = `~~${s}~~`;
                    a.push(s);
                    t.set(type, a);
                });
                return {
                    id,
                    url: `https://nhentai.net/g/${id}`,
                    title,
                    artist: t.get('artist')
                        ? this.client.util.gshorten(t.get('artist'), '\u2009\u2009')
                        : 'N/A',
                };
            });
        const abcd = ['A', 'B', 'C', 'D'];
        choices.forEach((c, i) => {
            quiz.addField(`[${abcd[i]}] ${c.title}`, `Artists: ${c.artist}`);
        });
        const message = (await interaction.editReply({
            embeds: [quiz],
            components: [
                new MessageActionRow().addComponents([
                    new MessageButton().setCustomId('0').setLabel('A').setStyle('SECONDARY'),
                    new MessageButton().setCustomId('1').setLabel('B').setStyle('SECONDARY'),
                    new MessageButton().setCustomId('2').setLabel('C').setStyle('SECONDARY'),
                    new MessageButton().setCustomId('3').setLabel('D').setStyle('SECONDARY'),
                ]),
            ],
        })) as Message;
        const answer = choices.findIndex(({ id }) => this.gallery.id === id);
        const embed = this.client.embeds.default().setFooter('Quiz session ended');
        message
            .awaitMessageComponent(
                {
                    filter: i => ['0', '1', '2', '3'].includes(i.customId) && i.user.id === interaction.user.id,
                    time: 30000,
                }
            )
            .then(async i => {
                await i.deferUpdate();
                const choice = parseInt(i.customId, 10);
                const buttons = [0, 1, 2, 3].map(i =>
                    new MessageButton()
                        .setCustomId(String(i))
                        .setLabel(abcd[i])
                        .setStyle('DANGER')
                        .setDisabled(true)
                );
                buttons[answer].setStyle('SUCCESS');
                await interaction.editReply({
                    embeds: [quiz],
                    components: [new MessageActionRow().addComponents(buttons)],
                });
                if (choice === answer) {
                    return interaction.followUp({
                        embeds: [
                            embed
                                .setColor('#008000')
                                .setAuthor('✅\u2000Correct')
                                .setDescription(
                                    `Congratulations! You got it right!\nThe correct answer was **[${abcd[answer]}] [${choices[answer].title}](${choices[answer].url})**.`
                                ),
                        ],
                        ephemeral: (interaction.options.get('private')?.value as boolean) ?? false,
                    });
                }
                return interaction.followUp({
                    embeds: [
                        embed
                            .setColor('#ff0000')
                            .setAuthor('❌\u2000Wrong Answer')
                            .setDescription(
                                `Unfortunately, that was the wrong answer.\nThe correct answer was **[${abcd[answer]}] [${choices[answer].title}](${choices[answer].url})**.\nYou chose **[${abcd[choice]}] [${choices[choice].title}](${choices[choice].url})**.`
                            ),
                    ],
                    ephemeral: (interaction.options.get('private')?.value as boolean) ?? false,
                });
            })
            .catch(err => {
                if (err.reason === 'idle') {
                    return interaction.followUp({
                        embeds: [
                            embed
                                .setColor('#ffbf00')
                                .setAuthor('⌛\u2000Timed out')
                                .setDescription(
                                    `The session timed out as you did not answer within 30 seconds. The correct answer was **${abcd[answer]} [${choices[answer].title}](${choices[answer].url})**.`
                                ),
                        ],
                        ephemeral: (interaction.options.get('private')?.value as boolean) ?? false,
                    });
                }
            });
    }
}
