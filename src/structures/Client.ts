import { Command, CommandHandler, Embeds, Notifier, MusicSubscription, Paginator, Util, Logger } from './index';
import { Client as C, ClientOptions, Collection, Snowflake, User } from 'discord.js';
import { Database } from '@database/index';
import { Client as JASMRAPI } from '@api/jasmr';
import { Client as NhentaiAPI } from '@api/nhentai';
import { Client as FakkuAPI } from '@api/fakku';
import { Client as ImageAPI } from '@api/images';
const { DISCORD_TOKEN } = process.env;

export class Client extends C {
    ownerID: string;
    commands: Collection<string, Command>;
    categories: Collection<string, string[]>;
    cooldowns: Collection<string, Collection<User['id'], number>>;
    paginators: Collection<string, Paginator>;
    warned: Set<User['id']>;
    commandHandler: CommandHandler;
    db: Database;
    jasmr: JASMRAPI;
    nhentai: NhentaiAPI;
    fakku: FakkuAPI;
    images: ImageAPI;
    embeds: Embeds;
    notifier: Notifier;
    util: Util;
    logger: Logger;
    subscriptions: Collection<Snowflake, MusicSubscription>;

    constructor(options?: ClientOptions) {
        super({
            ...options,
            intents: [
                'GUILDS',
                'GUILD_MESSAGES',
                'GUILD_VOICE_STATES',
            ],
        });
        this.commands = new Collection<string, Command>();
        this.categories = new Collection<string, string[]>();
        this.cooldowns = new Collection<string, Collection<User['id'], number>>();
        this.paginators = new Collection<string, Paginator>(); 
        this.warned = new Set<User['id']>();
        this.commandHandler = new CommandHandler(this);
        this.db = new Database(this);
        this.embeds = new Embeds(this);
        this.notifier = new Notifier(this);
        this.util = new Util(this);
        this.logger = new Logger(this);
        this.jasmr = new JASMRAPI();
        this.nhentai = new NhentaiAPI();
        this.fakku = new FakkuAPI();
        this.images = new ImageAPI();
        this.subscriptions = new Collection<Snowflake, MusicSubscription>();
    }

    async start(): Promise<void> {
        await this.db.init();
        // await this.fakku.setup(); // Comment this line out if you don't want to scrape Fakku magazine page everytime the bot starts up
        await super.login(DISCORD_TOKEN);
    }
}
