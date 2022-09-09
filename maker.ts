import RegisterSettings from './util/register-settings';
//import { i18n, user, wfrp4e } from './constants.ts';
import { ActorMaker } from './modules/makers/actor-maker';

Hooks.once('init', () => {
  //wfrp4e().npcGen = makeActor();

  RegisterSettings.initSettings();

  Handlebars.registerHelper('json', (context) => {
    return JSON.stringify(context);
  });

  // initTemplates([
  //   `modules/${RegisterSettings.moduleName}/templates/generation-profiles.html`
  // ]);
});

Hooks.on('renderActorDirectory', (_app: ActorSheet, html: JQuery) => {
  if (game.user.can('ACTOR_CREATE')) {
    addActorActionButton(html, 'ACTORMAKER.actor.directory.button', () => {
      await ActorMaker.makeActor();
    });
  }
});

function addActorActionButton(html: JQuery, label: string, onClick: () => void) {
  const button = document.createElement('button');
  button.style.width = '95%';
  button.innerHTML = game.i18n.localize(label);
  button.addEventListener('click', () => {
    onClick();
  });
  html.find('.header-actions').after(button);
}
