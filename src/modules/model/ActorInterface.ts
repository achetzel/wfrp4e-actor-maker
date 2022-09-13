import { ItemData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";

export interface ActorData {
    name: string,
    type: string,
    flags: {
        autoCalcRun: boolean,
        autoCalcWalk: boolean,
        autoCalcWounds: boolean,
        autoCalcCritW: boolean,
        autoCalcCorruption: boolean,
        autoCalcEnc: boolean,
        autoCalcSize: boolean
    },
    system: {
        characteristics: {
            [key: string]: {
                initial: number,
                advances: number
            }
        },
        details: {
            gender: {
                value: string
            },
            species: {
                value: species,
                subspecies?: string
            },
            move: {
                move: number,
                walk: number,
                run: number
            }
            status: {
                standing: string,
                tier: number
            }
        }
    }
    items: ItemData[]
}



