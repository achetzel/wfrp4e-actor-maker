import {ItemData} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";

export class HelperUtility {

    /* There are several inconsistencies in skill naming. These fixes are based on
       data in WFRP4E Core, Altdorf, and Middenheim modules
       On top of that Lore can be on a multitude of topics, and some of the basics
       are not even included in these modules ( i.e. Lore (Riekland) )
     */
    public static async skillTextScrubber(skillName: string): Promise<string> {
        // Turn any skill that gives a specialization choice into the default
        // no spec version (for GM to fill out)
        let testSkillSelectText: Array<string> = ["(any)", "(choose one)", "(any one)"];
        const containsChoice = testSkillSelectText.some(element => {
            return skillName.toLowerCase().includes(element);
        });

        if ( containsChoice ) {
            let startParen = skillName.indexOf("(");
            skillName = skillName.substring(0, startParen).trim();
            skillName += " ()";
        }

        // Other fixes that are provided in race config, but don't match compendium
        let otherFixes: Array<Object> = [
            { value: "Channeling()", fix: "Channeling ( )" },
            { value: "Art()", fix: "Art ( )" },
            { value: "Animal Training", fix: "Animal Training ( )" },
            { value: "Entertain (Sing)", fix: "Entertain (Singing)" },
            { value: "Sail", fix: "Sail ()" },
            { value: "Language (Eltharin)", fix:"Language (Elthárin)" }
        ];

        for (let i: number = 0; i < otherFixes.length; i++) {
            if (skillName === otherFixes[i].value) {
                skillName = otherFixes[i].fix;
            }
        }
        return Promise.resolve(skillName);
    }

    public static getRandomId(): string {
        let length: number = 16;
        let chars: string = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        let result:string = "";
        for (let i: number = length; i > 0; --i) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    public static getRandomUniqueNumbers(max: number, quantity: number): Array<number> {

        if (max <= quantity) {
            return ui.notifications.error(game.i18n.localize("ACTORMAKER.notification.error.randomQuantity"));
        }

        let foundArray = new Set();

        while (foundArray.size < quantity) {
            foundArray.add(Math.round(Math.random() * (max - 1)));
        }

        return [...foundArray];
    }

    public static async getRandomSkillObject(name: string, table: string): Promise<Object> {
        const skill = (await game.wfrp4e.tables.rollTable(table)).object.text;
        return await this.findSkillObject(skill);
    }

    public static async findSkillObject(name: string, skillsToAdv: number): Promise<Object> {
        const tags: Array<string> = ["money", "skill"];
        const type: string = "skill";
        const packs = await game.wfrp4e.tags.getPacksWithTag(tags);

        if (!packs.length) {
            ui.notifications.error(game.i18n.format("ACTORMAKER.notification.error.packs", { tags: tags }));
        }

        for (let pack of packs) {
            let items;
            let idx: number;
            let skillCopy: Object;
            await pack.getDocuments().then((content) => items = content.filter((i) => i.type == type));

            if (name.startsWith("Lore")) {
                /* Get Lore out of the way. Lore is almost always
                   populated, but doesn't always match an existing
                   skill ( i.e. Lore (Reikland) )
                */
                if (items.findIndex(e => e.name === "Lore ()") > -1) {
                    idx = items.findIndex(e => e.name === "Lore ()");
                    skillCopy = items[idx].toObject();
                    skillCopy.name = name;
                } else {
                    continue;
                }
            } else {
                // scrubber takes care of the rest of the weirdness
                let scrubbedSkill: string = await this.skillTextScrubber(name);

                if (items.findIndex(e => e.name === scrubbedSkill) > -1) {
                    idx = items.findIndex(e => e.name === scrubbedSkill);
                    skillCopy = items[idx].toObject();
                    skillCopy.name = scrubbedSkill;
                } else {
                    continue;
                }
            }
            skillCopy._id = this.getRandomId();
            skillCopy.system.advances.value = skillsToAdv > 3 ? 5 : 3;
            return Promise.resolve(skillCopy);
        }
        ui.notifications.error(game.i18n.format("ACTORMAKER.notification.error.skills", { name: name }))
        return Promise.reject();
    }

    public static async getRandomTalentName(): Promise<string> {
        const talent = (await game.wfrp4e.tables.rollTable("talents")).object.text;
        return Promise.resolve(talent);
    }

    public static async getRandomTalentObject(): Promise<Object> {
        const talent = await this.getRandomTalentName();
        return await this.findTalentObject(talent);
    }

    public static async findTalentObject(talent: string): Promise<Object> {
        const tags: Array<string> = ["talent"];
        const type: string = "talent";
        let talentNameFixed: string | null = null;

        if ( talent.includes("(") ) {
            // no pack talents have parenthesis (2022-09-24)
            let startParen: number = talent.indexOf("(");
            talentNameFixed = talent.substring(0, startParen).trim();
        }
        const packs = game.wfrp4e.tags.getPacksWithTag(tags);

        if (!packs.length) {
            ui.notifications.error(game.i18n.format("ACTORMAKER.notification.error.packs", { tags: tags }));
        }

        for (let pack of packs) {
            let items;
            await pack.getDocuments().then((content) => items = content.filter((i) => i.type == type));
            if (talentNameFixed === null && items.some(e => e.name === talent)) {
                const idx: number = items.findIndex(e => e.name === talent);
                return Promise.resolve(items[idx].toObject());
            } else if (items.some(e => e.name === talentNameFixed)) {
                const idx: number = items.findIndex(e => e.name === talentNameFixed);
                let talentDupe = items[idx].toObject();
                talentDupe.name = talent;
                talentDupe._id = this.getRandomId();
                return Promise.resolve(talentDupe)
            }
        }
        ui.notifications.error(
            game.i18n.format('ACTORMAKER.notification.error.talent', { name: talent })
        );
        return Promise.reject();
    }

    public static async findTrappingObject(trapping: string): Promise<Object> {
        const tags: Array<string> = ["trapping", "armour", "weapon"];

        const packs = game.wfrp4e.tags.getPacksWithTag(tags);

        if (!packs.length) {
            ui.notifications.error(game.i18n.format("ACTORMAKER.notification.error.packs", { tags: tags }));
        }

        for (let pack of packs) {
            let items;
            await pack.getDocuments().then((content) => items = content.filter((i) => i.type == "trapping" || i.type == "armour" || i.type == "weapon"));
            if (items.some(e => e.name === trapping)) {
                const idx: number = items.findIndex(e => e.name === trapping);
                let trappingDupe = items[idx].toObject();
                return Promise.resolve(trappingDupe)
            }
        }
        ui.notifications.warn(
            game.i18n.format('ACTORMAKER.notification.warn.trapping', { name: trapping })
        );
        return Promise.resolve();
    }

    public static async findCoinObject(coinType: string): Promise<Object> {
        const tags: Array<string> = ["money"];
        const type: string = "money";
        const coinTypeRef: Object = {
            gold: "Gold Crown",
            silver: "Silver Shilling",
            brass: "Brass Penny"
        }
        const coin: string = coinTypeRef[coinType.toLowerCase()];

        const packs = game.wfrp4e.tags.getPacksWithTag(tags);

        if (!packs.length) {
            ui.notifications.error(game.i18n.format("ACTORMAKER.notification.error.packs", { tags: tags }));
        }

        for (let pack of packs) {
            let items;
            await pack.getDocuments().then((content) => items = content.filter((i) => i.type == type));
            if (items.some(e => e.name === coin)) {
                const idx: number = items.findIndex(e => e.name === coin);
                let coinDupe = items[idx].toObject();
                return Promise.resolve(coinDupe)
            }
        }
        ui.notifications.warn(
            game.i18n.format('ACTORMAKER.notification.warn.coin', { name: coinType })
        );
        return Promise.reject();
    }

    public static checkForDuplicates(obj: Array<Object>) {

    }


}