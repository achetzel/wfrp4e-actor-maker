import {ItemData} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import stat = Deno.stat;

export default class ActorBuilder {
    public static async buildActorData() {
        //const model = game.system.model.Actor['npc'];
        const species: string = (await game.wfrp4e.tables.rollTable('species')).species;
        let subspecies: string = null;
        if(game.wfrp4e.config.subspecies[species]) {
            let subspeciesList = Object.keys(game.wfrp4e.config.subspecies[species]);
            subspecies = subspeciesList[Math.floor(Math.random() * subspeciesList.length)]
        }
        let gender: string = "Male";
        if ( (Math.round(Math.random()) + 1) == 1 ) {
            gender = "Female";
        }
        const characteristics = await this.speciesCharacteristics(species);
        const move: number = await game.wfrp4e.config.speciesMovement[species];
        const name: string = await game.wfrp4e.names.generateName({species: species, gender: gender});

        let itemData: ItemData[] = [];
        const skills = await this.allBasicSkills();
        itemData.push(...skills);
        const careerName = await this.rollCareer(species, subspecies);
        const careerData = await this.getCareerData(careerName);
        const status = careerData.system.status;
        status.value = game.wfrp4e.config.statusTiers[status.tier] + " " + status.standing;
        itemData.push(careerData);
        const actorData = {
            name: name,
            type: 'npc',
            flags: {
                autoCalcRun: true,
                autoCalcWalk: true,
                autoCalcWounds: true,
                autoCalcCritW: true,
                autoCalcCorruption: true,
                autoCalcEnc: true,
                autoCalcSize: true,
            },
            system: {
                characteristics: characteristics,
                details: {
                    gender: {
                        value: gender
                    },
                    species: {
                        value: species,
                        subspecies: null
                    },
                    move: {
                        value: move,
                        walk: move * 2,
                        run: move * 4
                    },
                    status: status
                },
            },
            items: itemData
        }
        if (subspecies !== null) {
            actorData.system.details.species.subspecies = subspecies;
        }

        return Promise.resolve(actorData);
    }

    public static async createActor(data){
        let actor: Actor = <Actor>await Actor.create(data);
        return Promise.resolve(actor);
    }

    private static async speciesCharacteristics(species: string, subspecies?: string) {
        let characteristics = {};
        let characteristicFormulae = game.wfrp4e.config.speciesCharacteristics[species];

        for (let char in game.wfrp4e.config.characteristics) {
            let roll = await new Roll(characteristicFormulae[char]).roll();
            characteristics[char] = { initial: roll.total, advances: 0 };
        }
        return characteristics;
    }

    // straight out stolen from wfrp4e.js cause no exports
    private static async allBasicSkills() {
        let returnSkills = [];
        const packs = game.wfrp4e.tags.getPacksWithTag(["money", "skill"]);
        if (!packs.length)
            return ui.notifications.error(game.i18n.localize("ACTORMAKER.notification.error.packs"));
        for (let pack of packs) {
            let items;
            await pack.getDocuments().then((content) => items = content.filter((i) => i.type == "skill"));
            for (let i of items) {
                if (i.system.advanced.value == "bsc") {
                    if (i.system.grouped.value != "noSpec") {
                        let skill = i.toObject();
                        let startParen = skill.name.indexOf("(");
                        skill.name = skill.name.substring(0, startParen).trim();
                        if (returnSkills.filter((x) => x.name.includes(skill.name)).length <= 0)
                            returnSkills.push(skill);
                    } else
                        returnSkills.push(i.toObject());
                }
            }
        }
        return returnSkills;
    }

    private static async rollCareer(species: string, subspecies?: string) {
        if (species == "human" && !subspecies) {
            subspecies = "reiklander";
        }
        // TODO: Try / Catch
        let roll = await game.wfrp4e.tables.rollTable("career", {}, species + "-" + subspecies);
        return roll.object.text;
    }

    private static async getCareerData(careerName: string) {
        let packResults = game.wfrp4e.tags.getPacksWithTag("career");
        let itemResults = game.items.filter((i) => i.type == "career");
        let careerFound;
        for (let pack of packResults) {
            itemResults = itemResults.concat((await pack.getDocuments()).filter((i) => i.type == "career"));
        }
        for (let career of itemResults) {
            if (career.system.careergroup.value == careerName && career.system.level.value == 1)
                careerFound = career.toObject();
            if (careerFound)
                break;
        }
        if (!careerFound) {
            return ui.notifications.error(`Career ${careerName} not found`);
        } else {
            return careerFound;
        }
    }
}