let CFG: CFG = {
  module: 'wfrp4e-actor-maker',
  SETTINGS: {
    customize: { id: 'customMake', default: true },
    classTrappings: { id: "includeClassTrappings", default: false },
    careerTrappings: { id: "includeCareerTrappings", default: false },
    coin: { id: "includeCoin", default: true },
    weapon: { id: "includeWeapon", default: true },
    mutations: { id: "includeMutations", default: false },
    magic: { id: "includeMagic", default: false }
  }
}

// TODO: number of careers, max career level, Alt race randomization

export class RegisterSettings {

  public static initSettings() {
    this.registerSettings(CFG.module);
  }

  private static registerSettings(moduleName: string) {

    for (const key in CFG.SETTINGS) {
      game.settings.register(CFG.module, CFG.SETTINGS[key].id, {
        name: game.i18n.localize(`ACTORMAKER.settings.${CFG.SETTINGS[key].id}.name`),
        hint: game.i18n.localize(`ACTORMAKER.settings.${CFG.SETTINGS[key].id}.hint`),
        scope: 'world',
        config: true,
        type: Boolean,
        default: CFG.SETTINGS[key].default
      });
    }
  }
}

type SETTING = {
  id: string,
  default: boolean
}

export type CFG = {
  module: string,
  SETTING: {
    customize: SETTING,
    classTrappings: SETTING,
    careerTrappings: SETTING,
    money: SETTING,
    weapon: SETTING,
    mutations: SETTING,
    magic: SETTING
  }
}