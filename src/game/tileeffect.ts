
import { Direction } from "./direction.js";


export const enum TileEffect {

    None = 0,
    MoveRight = 1,
    MoveUp = 2,
    MoveLeft = 3,
    MoveDown = 4,
    InsideFlame = 5,
    Key = 6,
    Torch = 7,
}


export const tileEffectToDirection = (eff : TileEffect) : Direction => {

    // To get rid of Typescript errors without having to cast to any/unknowwn
    const LOOK_UP = [0, 1, 2, 3, 4];

    if (eff >= TileEffect.None && eff <= TileEffect.MoveDown) {

        return LOOK_UP[eff];
    }
    return Direction.None;
}


export const isTileEffectDirection = (eff : TileEffect) : boolean => (eff >= TileEffect.None && eff <= TileEffect.MoveDown);
