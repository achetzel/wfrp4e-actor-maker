export default class RegisterSettings {
  public static moduleName: string;

  public static initSettings() {
    const mainModule = 'wfrp4-actor-maker';
    this.moduleName = mainModule;
    this.registerSettings(mainModule);
  }

  private static registerSettings(moduleName: string) {
    game.settings.register(moduleName, 'defaultCustomGeneration', {
      name: game.i18n.localize('ACTORMAKER.settings.defaultCustomGeneration.name'),
      hint: game.i18n.localize('ACTORMAKER.settings.defaultCustomGeneration.hint'),
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
    });
  }
}
