

export const enum Direction {

    None = 0,
    Right = 1,
    Up = 2,
    Left = 3,
    Down = 4
};


export const inverseDirection = (dir : Direction) => [
        Direction.None,
        Direction.Left,
        Direction.Down,
        Direction.Right,
        Direction.Up
    ][dir];
