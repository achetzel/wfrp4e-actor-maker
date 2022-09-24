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
        // These corner cases also have a space between parenthesis in the packs
        let testPackSkillText: Array<string> = ["Channeling()", "Art()", "Animal Training()"];

        for (let i: number = 0; i < testPackSkillText.length; i++) {
            if (skillName.startsWith(testPackSkillText[i])) {
                let startParen = skillName.indexOf("(");
                skillName = skillName.substring(0, startParen).trim();
                skillName += " ( )";
            }
        }
        return Promise.resolve(skillName);
    }

public static talentTextScrubber() {
    let addTalents = [];
    for (let talentName: string of refinedTalentList) {
        // no pack talents include any parenthesis
        let modTalentName: string = "";
        if (talentName.includes("(")) {
            let startParen: number = talentName.indexOf("(");
            modTalentName = talentName.substring(0, startParen).trim();
        }
        // find the base talent if it has been changed and give it current name
        // and new _id
        if (modTalentName.length !== 0 && modTalentName.length !== talentName) {
            if (items.some(e => e.name === modTalentName)) {
                const idx: number = items.findIndex(e => e.name === modTalentName);
                let dupe = items[idx].toObject();
                dupe.name = talentName;
                dupe._id = HelperUtility.getRandomId();
                let test: boolean = false;
            } else {
                ui.notifications.error(
                    game.i18n.format('ACTORMAKER.notification.error.talent', { name: modTalentName })
                );
            }
            // standard search
        } else {
            if (items.some(e => e.name === talentName)) {
                const idx: number = items.findIndex(e => e.name === talentName);
                addTalents.push(items[idx].toObject());
            } else {
                ui.notifications.error(
                    game.i18n.format('ACTORMAKER.notification.error.talent', { name: talentName })
                );
            }
        }
    }
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
            foundArray.add(Math.floor(Math.random() * (max - 1) + 1));
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
            await pack.getDocuments().then((content) => items = content.filter((i) => i.type == type));

            if (name.startsWith("Lore")) {
                /* Get Lore out of the way. Lore is almost always
                   populated, but doesn't always match an existing
                   skill ( i.e. Lore (Reikland) )
                */
                if (items.findIndex(e => e.name === "Lore ()") > -1) {
                    idx = items.findIndex(e => e.name === "Lore ()");
                } else {
                    continue;
                }
            } else {
                // scrubber takes care of the rest of the weirdness
                let scrubbedSkill: string = await this.skillTextScrubber(name);

                if (items.findIndex(e => e.name === scrubbedSkill) > -1) {
                    idx = items.findIndex(e => e.name === scrubbedSkill);
                } else {
                    continue;
                }
            }
            let skillCopy: Object = items[idx].toObject();
            skillCopy.name = name;
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
        const packs = game.wfrp4e.tags.getPacksWithTag(["talent"]);
        for (let pack of packs) {
            let items;
            await pack.getDocuments().then((content) => items = content.filter((i) => i.type == "talent"));
            if (items.some(e => e.name === talent)) {
                const idx: number = items.findIndex(e => e.name === talentName);
                return Promise.resolve(items[idx].toObject());
            } else {
                ui.notifications.error(
                    game.i18n.format('ACTORMAKER.notification.error.talent', { name: talent })
                );
            }
        }
        return Promise.reject();
    }

    public static checkForDuplicates(obj: Array<Object>) {

    }


}