import {ItemData} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import ActorData from "../model/ActorInterface.ts";
import {SpeciesSpecifics} from "../../util/species-specifics.ts";

export default class ActorBuilder {

    public static async buildActorData() {
        // TODO: differentiate types
        const type: string = "npc";
        const species: string = (await game.wfrp4e.tables.rollTable('species')).species;
        let gender: string = "Male";
        if (Math.random() < 0.5) {
            gender = "Female";
        }
        let data: ActorData = await SpeciesSpecifics.processSpeciesInfo(species, gender, type);
        // basic skills
        let skills: ItemData = await this.allBasicSkills();

        if (data.items) {
            for (let i = 0; i < skills.length; i++)
            data.items.push(skills[i]);
        } else {
            data.items = [];
            data.items.push(skills);
        }

        return Promise.resolve(data);
    }

    public static async createActor(data){
        let actor: Actor = <Actor>await Actor.create(data);
        return Promise.resolve(actor);
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
                    } else {
                        returnSkills.push(i.toObject());
                    }
                }
            }
        }
        returnSkills.push({name: "Lore (Cookies)", type: "skill"});

        //console.log(returnSkills);

        return returnSkills;
    }
}