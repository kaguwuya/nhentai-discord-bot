import { AkairoClient, ClientUtil } from 'discord-akairo';

export class Util extends ClientUtil {
    constructor(client: AkairoClient) {
        super(client);
    }

    base64(text: string, mode = 'encode') {
        if (mode === 'encode') return Buffer.from(text).toString('base64');
        if (mode === 'decode') return Buffer.from(text, 'base64').toString('utf8') || null;
        throw new TypeError(`${mode} is not a supported base64 mode.`);
    }

    chunkify<T>(a: T[], chunk: number) {
        return Array.from(Array(Math.ceil(a.length / chunk)), (_, i) => a.slice(i * chunk,i * chunk + chunk));
    }

    formatMilliseconds(ms: number) {
        let x = Math.floor(ms / 1000);
        const s = x % 60;

        x = Math.floor(x / 60);
        const m = x % 60;

        x = Math.floor(x / 60);
        const h = x % 24;

        const d = Math.floor(x / 24);

        const seconds = `${'0'.repeat(2 - s.toString().length)}${s}`;
        const minutes = `${'0'.repeat(2 - m.toString().length)}${m}`;
        const hours = `${'0'.repeat(2 - h.toString().length)}${h}`;
        const days = `${'0'.repeat(Math.max(0, 2 - d.toString().length))}${d}`;

        return `${days === '00' ? '' : `${days}:`}${hours}:${minutes}:${seconds}`;
    }

    /**
     * https://github.com/rigoneri/indefinite-article.js
     * @author: Rodrigo Neri (rigoneri)
     */
    indefiniteArticle(phrase: string) {
        // Getting the first word
        const match = /\w+/.exec(phrase);
        let word = 'an';
        if (match) word = match[0];
        else return word;

        const l_word = word.toLowerCase();
        // Specific start of words that should be preceeded by 'an'
        const alt_cases = ['honest', 'hour', 'hono'];
        for (const i in alt_cases) {
            if (l_word.indexOf(alt_cases[i]) === 0) return 'an';
        }

        // Single letter word which should be preceeded by 'an'
        if (l_word.length === 1) {
            if ('aedhilmnorsx'.indexOf(l_word) >= 0) return 'an';
            else return 'a';
        }

        // Capital words which should likely be preceeded by 'an'
        if (
            word.match(
                /(?!FJO|[HLMNS]Y.|RY[EO]|SQU|(F[LR]?|[HL]|MN?|N|RH?|S[CHKLMNPTVW]?|X(YL)?)[AEIOU])[FHLMNRSX][A-Z]/
            )
        ) {
            return 'an';
        }

        // Special cases where a word that begins with a vowel should be preceeded by 'a'
        const regexes = [/^e[uw]/, /^onc?e\b/, /^uni([^nmd]|mo)/, /^u[bcfhjkqrst][aeiou]/];
        for (const i in regexes) {
            if (l_word.match(regexes[i])) return 'a';
        }

        // Special capital words (UK, UN)
        if (word.match(/^U[NK][AIEO]/)) {
            return 'a';
        } else if (word === word.toUpperCase()) {
            if ('aedhilmnorsx'.indexOf(l_word[0]) >= 0) return 'an';
            else return 'a';
        }

        // Basic method of words that begin with a vowel being preceeded by 'an'
        if ('aeiou'.indexOf(l_word[0]) >= 0) return 'an';

        // Instances where y follwed by specific letters is preceeded by 'an'
        if (l_word.match(/^y(b[lor]|cl[ea]|fere|gg|p[ios]|rou|tt)/)) return 'an';

        return 'a';
    }

    capitalize(text: string) {
        return text.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    escapeMarkdown(text: string) {
        let unescaped = text.replace(/\\(\*|_|`|~|\\)/g, '$1');
        let escaped = unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1');
        return escaped;
    }

    escapeRegExp(text: string) {
        return text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    }

    /**
     * Shorten a `string[]` to conform to 1024-character limit
     * @param {string[]}} tags
     */
    gshorten(tags: Array<string>) {
        let res = '';
        for (const tag of tags) res += res.length + tag.length + 1 <= 1020 ? tag + ' ' : '';
        return res + (tags.join(' ').length > 1024 ? '...' : '');
    }

    hasCommon<T>(a: T[], b: T[]) {
        return [...new Set(a)].some(x => new Set(b).has(x));
    }

    pad(text: string, width: number, char = '0') {
        return String(text).length >= width
            ? String(text)
            : new Array(width - String(text).length + 1).join(char) + String(text);
    }

    random(array: Array<any>) {
        return array[Math.floor(Math.random() * array.length)];
    }

    shorten(text: string, split = ' ', maxLen = 2000) {
        if (text.length <= maxLen) return text;
        return text.substring(0, text.lastIndexOf(split, maxLen) + 1) + '`...`';
    }

    toTitleCase(text: string) {
        return text
            .toLowerCase()
            .replace(/guild/g, 'Server')
            .replace(/_/g, ' ')
            .replace(/\b[a-z]/g, t => t.toUpperCase());
    }
}
