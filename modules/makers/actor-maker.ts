import CheckDependencies from '../../check-dependencies';
import { i18n, notifications } from '../../constants';

export class actorMaker {

  public static async makeActor(callback?: (model: NpcModelBuilder, actorData: any, actor: any) => void) {
    await this.referential.initReferential(async () => {
      await this.generateNpcModel(async (model) => {
        const actorData = await NpcBuilder.buildActorData(model, 'npc');
        const actor = await NpcBuilder.createActor(model, actorData);
        notifications().info(
          i18n().format('ACTORMAKER.notification.actor.created', {
            name: actor.name,
          })
        );
        await WaiterUtil.hide();
        if (callback != null) {
          callback(model, actorData, actor);
        }
      });
    });
  }
}
