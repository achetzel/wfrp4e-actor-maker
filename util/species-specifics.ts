import { wfrp4e } from '../constants.js';
//import { actors, i18n, initTemplates, user, wfrp4e } from '../constants';

export class SpeciesSpecifics {

  public static async getSpecies () {
    await wfrp4e().config.species;
  }

  public static async getSubSpecies (subspecies: string) {
    await wfrp4e().config.subspecies[subspecies];
  }

  public static async getSpeciesSkills (species: string, subspecies?: string) {
    await wfrp4e().utility.speciesSkillsTalents(species, subspecies)['skills'];
  }

  public static async getSpeciesTalents (species: string, subspecies?: string) {
    let talentList = await wfrp4e().utility.speciesSkillsTalents(species, subspecies)['talents'];
    let refinedTalentList: string[] = [];
    for (let talent of talentList) {
      if (!isNaN(talent)) {
        for (let i = 0; i < talent; i++) {
          refinedTalentList.push((await wfrp4e().tables.rollTable("talents")).object.text);
        }
        continue;
      } else {
        refinedTalentList.push(talent);
      }
    }
  }
}