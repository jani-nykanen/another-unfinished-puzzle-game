export const tileEffectToDirection = (eff) => {
    // To get rid of Typescript errors without having to cast to any/unknowwn
    const LOOK_UP = [0, 1, 2, 3, 4];
    if (eff >= 0 /* TileEffect.None */ && eff <= 4 /* TileEffect.MoveDown */) {
        return LOOK_UP[eff];
    }
    return 0 /* Direction.None */;
};
export const isTileEffectDirection = (eff) => (eff >= 0 /* TileEffect.None */ && eff <= 4 /* TileEffect.MoveDown */);
