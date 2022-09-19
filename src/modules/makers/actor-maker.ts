import ActorBuilder from '../builders/actorBuilder';

export class ActorMaker {

  //public static async makeActor(_event?: (model: actorModel, actorData: any, actor: any) => void) {
  public static async makeActor() {
    console.log("Button pushed!");
    const actorData = await ActorBuilder.buildActorData();

    console.log(actorData);

    const actor = await ActorBuilder.createActor(actorData);



    ui.notifications.info(
      game.i18n.format('ACTORMAKER.notification.actor.created', {
        name: actor.name,
      })
    );

      //   await WaiterUtil.hide();
      //   if (event != null) {
      //     event(model, actorData, actor);
      //   }
  }
}
