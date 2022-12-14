
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
        const name: string = await game.wfrp4e.names.generateName({species: species, gender: gender})
        const skills = await this.allBasicSkills();
        const career = await this.generateCareer(species, subspecies);
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
                    }
                },
            },
            items: skills
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

    // straight out stolen from wfrp4e.js cause no exports
    private static async generateCareer(species: string, subspecies: string) {
        let returnCareers = [];
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
}