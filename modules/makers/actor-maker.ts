import CheckDependencies from '../../check-dependencies';
import { i18n, notifications } from '../../constants';

export class ActorMaker {

  public static async makeActor(event?: (model: NpcModelBuilder, actorData: any, actor: any) => void) {
    await this.generateNpcModel(async (model) => {
      const actorData = await NpcBuilder.buildActorData(model, 'npc');
      const actor = await NpcBuilder.createActor(model, actorData);
      notifications().info(
        i18n().format('ACTORMAKER.notification.actor.created', {
          name: actor.name,
        })
      );
      await WaiterUtil.hide();
      if (event != null) {
        event(model, actorData, actor);
      }
    });
  }
}
