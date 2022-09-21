export class HelperUtility {

    /* There are several inconsistencies in skill naming. These fixes are based on
       data in WFRP4E Core, Altdorf, and Middenheim modules
       On top of that Lore can be on a multitude of topics, and some of the basics
       are not even included in these modules ( i.e. Lore (Riekland) )
     */
    public static async skillTextScrubber(skillName: string): Promise<string> {
        // Turn any skill that gives a specialization choice into the default
        // no spec version (for GM to fill out)
        let testSkillSelectText: Array<string> = ["(any)", "(choose one)", "(any one)"];
        const containsChoice = testSkillSelectText.some(element => {
            if(skillName.toLowerCase().includes(element)) {
                return true;
            } else {
                return false;
            }
        });

        if ( containsChoice ) {
            let startParen = skillName.indexOf("(");
            skillName = skillName.substring(0, startParen).trim();
            skillName += " ()";
        }
        // These corner cases also have a space between parenthesis in the packs
        let testPackSkillText: Array<string> = ["Channeling()", "Art()", "Animal Training()"];

        for (let i: number = 0; i < testPackSkillText.length; i++) {
            if (skillName.startsWith(testPackSkillText[i])) {
                let startParen = skillName.indexOf("(");
                skillName = skillName.substring(0, startParen).trim();
                skillName += " ( )";
            }
        }
        return Promise.resolve(skillName);
    }

    public static getRandomId(): string {
        let length: number = 16;
        let chars: string = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        let result:string = "";
        for (let i: number = length; i > 0; --i) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    public static getRandomUniqueNumbers(max: number, quantity: number): Array<number> {

        if (max <= quantity) {
            return ui.notifications.error(game.i18n.localize("ACTORMAKER.notification.error.randomQuantity"));
        }

        let foundArray = new Set();

        while (foundArray.size < quantity) {
            foundArray.add(Math.floor(Math.random() * (max - 1) + 1));
        }
        return [...foundArray];
    }

    public static getRandomNumber(max: number): number {
        let result = Math.floor(Math.random() * (max - 1));

        return result;
    }



}