import { i18n, settings } from '../constants';

export default class RegisterSettings {
  public static moduleName: string;

  public static initSettings() {
    const mainModule = 'wfrp4-actor-maker';
    this.moduleName = mainModule;
    this.registerSettings(mainModule);
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
