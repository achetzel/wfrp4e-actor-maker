import {ActorData} from "../modules/model/ActorInterface.ts";
import {ItemData} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";

export class SpeciesSpecifics {

  public data: ActorData;
  public species: string;
  public gender: string;

  public static async processSpeciesInfo (species: string, gender: string, type: string): ActorData {
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
      }
    }
    this.data = data;
    // species
    // await this.rollSpecies();
    // subspecies
    await this.getSubSpecies();
    // name
    await this.genSpeciesName();
    // characteristics
    await this.genSpeciesCharacteristics();
    // move stat
    await this.addSpeciesMove();
    // career
    const careerName = await this.rollCareer(this.species, this.data.system.details.species.subspecies);
    await this.addCareerData(careerName);

    return this.data;

  }

  private static async rollSpecies(): void {
    this.species = (await game.wfrp4e.tables.rollTable('species')).species;
    this.data.system.details.species.value = this.species;
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
    const name: string = await game.wfrp4e.names.generateName({species: this.species, "gender": this.gender});
    this.data.name = name;
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
    if(this.data.items) {
      this.data.items.push(careerData);
    } else {
      this.data.items = [];
      this.data.items.push(careerData);
    }

  }

  public static async getSpeciesSkills (species: string, subspecies?: string) {
    await game.wfrp4e.utility.speciesSkillsTalents(species, subspecies)['skills'];
  }

  public static async getSpeciesTalents (species: string, subspecies?: string) {
    let talentList = await game.wfrp4e.utility.speciesSkillsTalents(species, subspecies)['talents'];
    let refinedTalentList: string[] = [];
    for (let talent of talentList) {
      if (!isNaN(talent)) {
        for (let i = 0; i < talent; i++) {
          refinedTalentList.push((await game.wfrp4e.tables.rollTable("talents")).object.text);
        }
        continue;
      } else {
        refinedTalentList.push(talent);
      }
    }
  }
}