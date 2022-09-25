import {ActorData} from "../modules/model/ActorInterface.ts";
import {ItemData} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import {HelperUtility} from "./HelperUtil.ts";

export class SpeciesSpecifics {

  public data: ActorData;
  public species: string;
  public subspecies: string;
  public gender: string;
  public items: ItemData;

  public static async processSpeciesInfo (species: string, gender: string, type: string, basicSkills: ItemData): ActorData {
    this.species = species;
    this.gender = gender;
    this.items = basicSkills;

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
      items: this.items
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
    // species talents
    await this.addSpeciesTalents();
    // career
    await this.addCareerData();

    this.data.items = this.items;

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
    let allSpeciesSkills: Array<string> = await game.wfrp4e.utility.speciesSkillsTalents(this.species, this.data.system.details.species.subspecies)['skills'];
    let keepSpeciesSkills: Array<string> = [];
    let skillsToAdv: number = 6;
    let sixRandomElements: Array<number> = HelperUtility.getRandomUniqueNumbers(allSpeciesSkills.length, skillsToAdv);

    for (let i: number of sixRandomElements) {
      keepSpeciesSkills.push(allSpeciesSkills[i]);
    }

    for (let skill: string of keepSpeciesSkills) {
      const skillObj = await HelperUtility.findSkillObject(skill, skillsToAdv);
      if (this.items.some(e => e.name.toLowerCase() === skillObj.name.toLowerCase())) {
        const idx: number = this.items.findIndex(e => e.name.toLowerCase() === skillObj.name.toLowerCase());
        this.items.splice(idx, 1);
      }
      this.items.push(skillObj);
      skillsToAdv--;
    }
  }

  private static async addSpeciesTalents (): void {
    let talentList = await game.wfrp4e.utility.speciesSkillsTalents(this.species, this.data.system.details.species.subspecies)['talents'];

    for (let talent of talentList) {
      let talentObj: Object;
      // number provided in talent array
      // process multiple talents at once (potentially)
      if (!isNaN(talent)) {
        for (let i: number = 0; i < talent; i++) {
          talentObj = await HelperUtility.getRandomTalentObject();
          await this.processTalentObject(talentObj);
        }
        continue;
      // choice + Middenheim mod has text that could have just been a number
      } else if (talent.includes(",")) {
        let talentChoice: Array<string> = talent.split(",");
        const random = HelperUtility.getRandomUniqueNumbers(talentChoice.length, 1);
        let pickedTalent = talentChoice[random].trim();
        // choose and then see if it's a middenheim text rando talent
        if (pickedTalent.includes("Additional Random Talent")) {
          talentObj = await HelperUtility.getRandomTalentObject();
        } else {
          talentObj = await HelperUtility.findTalentObject(talentChoice[random].trim());
        }
      // Middenheim mod has text that could have just been a number
      } else if (talent.includes("Additional Random Talent")) {
        talentObj = await HelperUtility.getRandomTalentObject();
      // the rest
      } else {
        talentObj = await HelperUtility.findTalentObject(talent)
      }
      if (talentObj) {
        await this.processTalentObject(talentObj);
      } else {
        ui.notifications.error(
            game.i18n.format('ACTORMAKER.notification.error.talent', { name: talent })
        );
      }
    }
  }

  private static async processTalentObject(talentObj: Object) {
    let isDupe = true;
    while (isDupe) {
      let checkDupe = this.checkForItemDupe(talentObj);

      if (!checkDupe) {
        // not a dupe, push to unique array and leave
        this.items.push(talentObj);
        isDupe = false;
      } else if (checkDupe) {
        // is a dupe -> let's check stat bonus or max rank
        let stat: string | number = talentObj.system.max.value;
        let maxRank: number = isNaN(stat) ? this.data.system.characteristics[stat].initial.toString().charAt(0) : stat;
        if (talentObj.system.advances.value < maxRank) {
          // can be ranked up
          talentObj.system.advances.value += 1;
          this.items.push(talentObj);
          isDupe = false;
        } else {
          // max rank, get a new talent
          talentObj = await HelperUtility.getRandomTalentObject();
        }
      }
    }
  }

  private static checkForItemDupe (item: Object): boolean {
    return !!this.items.some(e => e.name == item.name);
  }

  private static async addCareerData(): void {
    let careerData = await this.getRandomCareerObject();
    // TODO: Can do this because only 1 career atm. Need to iterate obj when option for
    // TODO: multiple careers is implemented
    this.items.push(careerData);
    // TODO: Starting Trappings
    // TODO: Starter monies
    // TODO: Starter skill increases
  }

  private static async getRandomCareerObject(): Promise<Object> {
    const career = await this.rollCareer(this.species, this.data.system.details.species.subspecies);
    return await this.findCareerObject(career);
  }

  private static async rollCareer(species: string, subspecies?: string): string {

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

  public static async findCareerObject(career: string): Promise<Object> {
    let tags: Array<string> = ["career"];
    let type: string = "career"
    let packs = game.wfrp4e.tags.getPacksWithTag(tags);
    let items = game.items.filter((i) => i.type == type);
    let careerData;

    for (let pack of packs) {
      items = items.concat((await pack.getDocuments()).filter((i) => i.type == type));
    }

    for (let i of items) {
      if (i.system.careergroup.value == career && i.system.level.value == 1) { careerData = i.toObject(); }
      if (careerData) { break; }
    }
    if (!careerData) {
      ui.notifications.error(`Career ${career} not found`);
      return Promise.reject();
    }

    // oddly enough it comes back with codes, but "description" has go through config
    const status = careerData.system.status;
    //careerData.system.status.value = game.wfrp4e.config.statusTiers[status.tier] + " " + status.standing;

    careerData.system.current.value = true;

    return Promise.resolve(careerData);
  }
}