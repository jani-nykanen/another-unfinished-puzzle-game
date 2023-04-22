import { CoreEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { Tilemap } from "../core/tilemap.js";
import { Bitmap } from "../renderer/bitmap.js";
import { WallMap } from "./wallmap.js";
import { GameObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Crate } from "./crate.js";
import { Direction } from "./direction.js";


const NON_ANIMATED_TILES = [
    4, 6, 7, 8, 9, 10, 12
];
const ANIMATED_TILES = [
    11, 13, 17, 18, 19, 20
];
const SOURCE_X = [
    0, 0, 0, 0, 
    0, 2, 3, 0, 
    2, 3, 0, 1, 
    2, 0, 0, 0,
    0, 0, 2, 2
];
const SOURCE_Y = [
    0, 0, 0, 2, 
    0, 0, 0, 1, 
    1, 1, 3, 2, 
    2, 0, 0, 0,
    4, 5, 5, 4
];
const FRAME_COUNT = [
    0, 0, 0, 0, 
    0, 0, 0, 0, 
    0, 0, 4, 0, 
    2, 0, 0, 0,
    2, 2, 2, 2
];
const FRAME_SHIFT = [
    0, 0, 0, 0, 
    0, 0, 0, 0, 
    0, 0, 2, 0, 
    1, 0, 0, 0,
    0, 0, 0, 0
];



export class Stage {


    private baseMap : Tilemap;

    private objectPool : Array<GameObject>;
    private activeObjectLayer : Array<GameObject | undefined> | undefined = undefined;
    private activeStaticLayer : Array<number> | undefined = undefined;

    private wallMap : WallMap;

    private width : number;
    private height : number;

    private tileAnimationTimer : number;
    
    public readonly tileWidth : number;
    public readonly tileHeight : number;


    constructor(event : CoreEvent) {

        let baseMap = event.assets.getTilemap("1");
        if (baseMap == undefined) {

            throw "Missing tilemap!";
        }

        this.baseMap = baseMap;
        this.width = baseMap.width;
        this.height = baseMap.height;

        this.objectPool = new Array<GameObject> ();
        this.activeObjectLayer = (new Array<GameObject> (this.width*this.height)).fill(undefined);

        this.activeStaticLayer = baseMap.cloneLayer("base");
        if (this.activeStaticLayer != undefined) {

            this.wallMap = new WallMap(this.activeStaticLayer, this.width, this.height);
            this.parseObjects();
        }

        this.tileAnimationTimer = 0.0;

        // TODO: Obtain these from the tilemap
        this.tileWidth = 16;
        this.tileHeight = 16;
    }


    private getStaticTile(x : number, y : number, def = 0) : number {

        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return def;

        return this.activeStaticLayer[y*this.width + x];
    }


    private parseObjects() : void {

        let tid : number;
        let o : GameObject;
        let index : number;

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                index = y*this.width + x;
                tid = this.activeStaticLayer[index];

                o = undefined;

                switch (tid) {

                // Player
                case 3:

                    o = new Player(x, y) as GameObject; 
                    break;

                // Crate
                case 5:

                    o = new Crate(x, y) as GameObject;
                    break;

                default:
                    break;
                }

                if (o != undefined) {

                    this.objectPool.push(o);
                    this.activeObjectLayer[index] = o; 
                }
            }
        }
    }


    private drawStaticTiles(canvas : Canvas, bmp : Bitmap) : void {

        if (this.activeStaticLayer == undefined)
            return;

        let sx : number | undefined;
        let sy : number | undefined;

        let frame : number;
        let frameCount : number | undefined;
        let frameShift : number | undefined;

        let tid : number;
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                tid = this.activeStaticLayer[y * this.width + x];

                sx = SOURCE_X[tid-1];
                sy = SOURCE_Y[tid-1];
                frameCount = FRAME_COUNT[tid-1];
                frameShift = FRAME_SHIFT[tid-1];

                if (NON_ANIMATED_TILES.includes(tid) &&
                    sx != undefined && sy != undefined) {

                    canvas.drawBitmapRegion(bmp, 
                        sx*this.tileWidth, sy*this.tileHeight, 
                        this.tileWidth, this.tileHeight,
                        x*this.tileWidth, y*this.tileHeight);
                }
                else if (ANIMATED_TILES.includes(tid) &&
                    sx != undefined && sy != undefined &&
                    frameCount != undefined) {

                    frame = Math.floor(this.tileAnimationTimer * frameCount);
                    if (frameShift != undefined) {

                        frame += Number(x % 2 == y % 2) * frameShift;
                    }
                    sx += (frame % frameCount);

                    canvas.drawBitmapRegion(bmp, 
                        sx*this.tileWidth, sy*this.tileHeight, 
                        this.tileWidth, this.tileHeight,
                        x*this.tileWidth, y*this.tileHeight);
                }
            }
        }
    }


    private drawObjectLayer(canvas : Canvas) : void {

        let o : GameObject | undefined;

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                o = this.activeObjectLayer[y*this.width + x];
                if (o == undefined)
                    continue;
                
                o.draw(canvas, this);
            }
        }
    }


    public updatePhysics(event : CoreEvent) : void {

        const ANIMATION_SPEED = 1.0/600.0;
        const TURN_TIMER = 1.0/15.0;

        this.tileAnimationTimer = (this.tileAnimationTimer + ANIMATION_SPEED*event.delta) % 1.0;

        for (let o of this.objectPool) {

            o.update(TURN_TIMER, this, event);
        }
    }


    public draw(canvas : Canvas) : void {

        canvas.setColor(0.0);
        canvas.fillRect(0, 0, this.width*this.tileWidth, this.height*this.tileHeight);
        canvas.setColor();

        let bmpTileset = canvas.getBitmap("tileset1");
        let bmpWall = canvas.getBitmap("wall1");

        if (bmpWall != undefined) {

            this.wallMap.draw(canvas, bmpWall, this.tileWidth, this.tileHeight);
        }

        if (bmpTileset != undefined) {

            this.drawStaticTiles(canvas, bmpTileset);
        }

        this.drawObjectLayer(canvas);
    }


    public canMoveTo(x : number, y : number, dir : Direction) : boolean {

        const SOLID_TILES = [1, 2, 6, 9, 12];
        // const ARROW_FORBIDDEN_DIR = [Direction.Left, Direction.Down, Direction.Right, Direction.Up];

        let tileID = this.getStaticTile(x, y);

        if (SOLID_TILES.includes(tileID)) {

            return false;
        }

        // "Arrows"
        /*
        if (tileID >= 17 && tileID <= 20 &&
            ARROW_FORBIDDEN_DIR[tileID-17] == dir) {

            return false;
        }
        */
        return true;
    }


    public checkUnderlyingTile(x : number, y : number) : Direction {

        const ARROW_DIR = [Direction.Right, Direction.Up, Direction.Left, Direction.Down];

        let tileID = this.getStaticTile(x, y);
        if (tileID >= 17 && tileID <= 20) {

            return ARROW_DIR[tileID-17];
        }
        return Direction.None;
    }


    public centerCamera(canvas : Canvas) : void {

        let dx = this.width * this.tileWidth / 2;
        let dy = this.height * this.tileHeight / 2;

        canvas.transform
            .translate(canvas.width/2 - dx, canvas.height/2 - dy)
            .use();
    }


    public getWidth = () : number => this.width;
    public getHeight = () : number => this.height;
}
