import {ActorData} from "../modules/model/ActorInterface.ts";
import {ItemData} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import {HelperUtility} from "./HelperUtil.ts";
import kill = Deno.kill;

export class SpeciesSpecifics {

  public data: ActorData;
  public species: string;
  public subspecies: string;
  public gender: string;

  public static async processSpeciesInfo (species: string, gender: string, type: string, basicSkills: ItemData): ActorData {
    this.species = species;
    this.gender = gender;
    let data: ActorData = {
      type: type,
      system: {
        details: {
          gender: {
            value: gender
          },
          species: {
            value: species
          }
        }
      },
      items: basicSkills
    }
    this.data = data;

    // subspecies
    await this.getSubSpecies();
    // name
    await this.genSpeciesName();
    // characteristics
    await this.genSpeciesCharacteristics();
    // move stat
    await this.addSpeciesMove();
    // species skills
    await this.addSpeciesSkills();
    // career
    const careerName = await this.rollCareer(this.species, this.data.system.details.species.subspecies);
    await this.addCareerData(careerName);

    return this.data;

  }

  private static async getSubSpecies (): void {
    let subspecies: string | null = null;
    if(game.wfrp4e.config.subspecies[this.species]) {
      let subspeciesList = Object.keys(game.wfrp4e.config.subspecies[this.species]);
      subspecies = subspeciesList[Math.floor(Math.random() * subspeciesList.length)]
    }
    this.data.system.details.species.subspecies = subspecies;
  }

  private static async genSpeciesName (): void {
    this.data.name = await game.wfrp4e.names.generateName({species: this.species, "gender": this.gender});
  }

  private static async genSpeciesCharacteristics (): void {
    let characteristics = {};
    let characteristicFormulae = game.wfrp4e.config.speciesCharacteristics[this.species];

    for (let char in game.wfrp4e.config.characteristics) {
      let roll = await new Roll(characteristicFormulae[char]).roll();
      characteristics[char] = { initial: roll.total, advances: 0 };
    }
    // characteristics value
    this.data.system.characteristics = characteristics;
  }

  private static async addSpeciesMove (): void {
    const move: number = await game.wfrp4e.config.speciesMovement[this.species];
    // move object
    this.data.system.details.move = {
      value: move,
      walk: move * 2,
      run: move * 3
    };
  }

  private static async addSpeciesSkills (): void {
    let addSkills = [];
    let allSpeciesSkills: Array<string> = await game.wfrp4e.utility.speciesSkillsTalents(this.species, this.data.system.details.species.subspecies)['skills'];
    let keepSpeciesSkills: Array<string> = [];
    let skillsToAdv: number = 6;
    let keepSkills: Array<number> = HelperUtility.getRandomUniqueNumbers(allSpeciesSkills.length, skillsToAdv);


    for (let i: number of keepSkills) {
      keepSpeciesSkills.push(allSpeciesSkills[i]);
    }
    const packs = game.wfrp4e.tags.getPacksWithTag(["money", "skill"]);

    if (!packs.length) {
      return ui.notifications.error(game.i18n.localize("ACTORMAKER.notification.error.packs"));
    }

    for (let pack of packs) {
      let packSkills;
      await pack.getDocuments().then((content) => packSkills = content.filter((i) => i.type == "skill"));

      for (let s: string of keepSpeciesSkills) {

        for (let p: ItemData of packSkills) {
          /* Get Lore out of the way. Lore is almost always
             populated, but doesn't always match an existing
             skill ( i.e. Lore (Reikland) )
           */
          if (s.startsWith("Lore") && p.name == "Lore ()") {
            let dupe = p.toObject();
            dupe.name = s;
            dupe._id = HelperUtility.getRandomId();
            dupe.system.advances.value = skillsToAdv > 3 ? 5 : 3;
            skillsToAdv--;
            addSkills.push(dupe);
          } else if (s.startsWith("Lore") && p.name != "Lore ()") {
            continue;
          } else {
            let scrubbedSkill: string = await HelperUtility.skillTextScrubber(s, p.name);

            if (scrubbedSkill == p.name) {
              if (p.system.grouped.value != "noSpec") {
                let skill = p.toObject();
                if (addSkills.filter((x) => x.name.includes(skill.name)).length <= 0)
                  skill.system.advances.value = skillsToAdv > 3 ? 5 : 3;
                  skillsToAdv--;
                  addSkills.push(skill);
              } else {
                let dupe = p.toObject();
                dupe.system.advances.value = skillsToAdv > 3 ? 5 : 3;
                skillsToAdv--;
                addSkills.push(dupe);
              }
            }
          }
        }
      }
    }
    for (let i: number = 0; i < addSkills.length; i++) {
      if (this.data.items.some(e => e._id === addSkills[i]._id)) {
        const idx: number = this.data.items.findIndex(e => e._id === addSkills[i]._id);
        this.data.items.splice(idx, 1);
        this.data.items.push(addSkills[i]);
      } else {
        this.data.items.push(addSkills[i]);
      }
    }
  }

  private static async getSpeciesTalents (): void {
    let talentList = await game.wfrp4e.utility.speciesSkillsTalents(species, subspecies)['talents'];
    let refinedTalentList: string[] = [];
    for (let talent of talentList) {
      if (!isNaN(talent)) {
        for (let i: number = 0; i < talent; i++) {
          refinedTalentList.push((await game.wfrp4e.tables.rollTable("talents")).object.text);
        }
        continue;
      } else {
        refinedTalentList.push(talent);
      }
    }
  }

  private static async rollCareer(species: string, subspecies?: string) {

    let tableName: string;

    if (species == "human" && subspecies === null) {
      subspecies = "reiklander";
    }

    if (subspecies !== null) {
      tableName = species + "-" + subspecies;
    } else {
      tableName = species;
    }
    // TODO: Try / Catch
    let roll = await game.wfrp4e.tables.rollTable("career", {}, tableName);
    return roll.object.text;
  }

  private static async addCareerData(careerName: string): void {
    let packResults = game.wfrp4e.tags.getPacksWithTag("career");
    let itemResults = game.items.filter((i) => i.type == "career");
    let careerData;
    for (let pack of packResults) {
      itemResults = itemResults.concat((await pack.getDocuments()).filter((i) => i.type == "career"));
    }
    for (let career of itemResults) {
      if (career.system.careergroup.value == careerName && career.system.level.value == 1)
        careerData = career.toObject();
      if (careerData)
        break;
    }
    if (!careerData) {
      ui.notifications.error(`Career ${careerName} not found`);
    }
    // oddly enough it comes back with codes, but "description" has go through config
    const status = careerData.system.status;
    careerData.system.status = game.wfrp4e.config.statusTiers[status.tier] + " " + status.standing;
    // TODO: Can do this because only 1 career atm. Need to iterate obj when option for
    // TODO: multiple careers is implemented (like skills)
    if(this.data.items) {
      this.data.items.push(careerData);
    } else {
      this.data.items = [];
      this.data.items.push(careerData);
    }
  }
}