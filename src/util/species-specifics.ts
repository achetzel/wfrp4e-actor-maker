export class SpeciesSpecifics {

  public static async getSpecies () {
    await wfrp4e().config.species;
  }

  public static async getSubSpecies (subspecies: string) {
    await wfrp4e().config.subspecies[subspecies];
  }

  public static async getSpeciesName (species: string, gender?: string): string {
    return await game.wfrp4e.names.generateName({species: species, gender: gender});
  }

  public static async getSpeciesCharacteristics (species: string, subspecies?: string | null) {
    let characteristics = {};
    let characteristicFormulae = game.wfrp4e.config.speciesCharacteristics[species];

    for (let char in game.wfrp4e.config.characteristics) {
      let roll = await new Roll(characteristicFormulae[char]).roll();
      characteristics[char] = { initial: roll.total, advances: 0 };
    }
    return characteristics;
  }

  public static async getSpeciesMove (species: string, subspecies?: string): number {
    return await game.wfrp4e.config.speciesMovement[species];
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

  public static async getSpeciesCareer (species: string, subspecies?: string) {
    await wfrp4e().utility.speciesSkillsTalents(species, subspecies)['skills'];
  }


}