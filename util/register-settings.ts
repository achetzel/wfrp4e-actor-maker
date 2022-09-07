import { i18n, modules, settings } from '../constants';

export default class RegisterSettings {
  public static moduleName: string;

  public static initSettings() {
    const mainModule = 'wfrp4-actor-maker';
    const betaModule = 'wfrp4e-actor-maker-beta';

    const mainModuleActive = modules().get(mainModule)?.active;
    const betaModuleActive = modules().get(betaModule)?.active;

    if (mainModuleActive) {
      this.moduleName = mainModule;
      this.registerSettings(mainModule);
    }
    if (betaModuleActive) {
      this.moduleName = betaModule;
      this.registerSettings(betaModule);
    }
  }

  private static registerSettings(moduleName: string) {
    settings().register(moduleName, 'defaultCustomGeneration', {
      name: i18n().localize('ACTORMAKER.settings.defaultCustomGeneration.name'),
      hint: i18n().localize('ACTORMAKER.settings.defaultCustomGeneration.hint'),
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
    });
  }
}
