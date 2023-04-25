import { CoreEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { Tilemap } from "../core/tilemap.js";
import { Bitmap } from "../renderer/bitmap.js";
import { WallMap } from "./wallmap.js";
import { GameObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Crate } from "./crate.js";
import { TileEffect } from "./tileeffect.js";
import { ObjectType } from "./objecttype.js";
import { Direction } from "./direction.js";
import { Inventory } from "./inventory.js";
import { negMod } from "../math/utility.js";


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


const UNDO_BUFFER_SIZE = 64;


export class Stage {


    private baseMap : Tilemap;

    private objectPool : Array<GameObject>;

    private activeObjectLayer : Array<GameObject | undefined>;
    private activeStaticLayer : Array<number>;
    private activeInventory : Inventory;

    private initialStaticLayer : Array<number>;
    private initialObjectLayer : Array<GameObject | undefined>;

    private objectLayerBuffer : Array<Array<GameObject | undefined>>;
    private staticLayerBuffer : Array<number[]>;
    private inventoryBuffer : Array<Inventory>;
    private undoBufferPointer : number = 0;
    private undoCount : number = 0;

    private wallMap : WallMap;

    private width : number;
    private height : number;

    private tileAnimationTimer : number;

    private purpleWallState : boolean = true;

    private wasMoving : boolean = false;
    
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
        if (this.activeStaticLayer == undefined) {

            throw "Base layer missing!";
        }

        this.wallMap = new WallMap(this.activeStaticLayer, this.width, this.height);
        
        this.activeInventory = new Inventory();

        this.parseObjects();

        this.initialStaticLayer = Array.from(this.activeStaticLayer);
        this.initialObjectLayer = Array.from(this.activeObjectLayer);

        this.initUndoBuffers();

        this.tileAnimationTimer = 0.0;

        // TODO: Obtain these from the tilemap
        this.tileWidth = 16;
        this.tileHeight = 16;
    }


    private initUndoBuffers() : void {
        
        this.objectLayerBuffer = new Array<Array<GameObject | undefined>> (UNDO_BUFFER_SIZE);
        this.staticLayerBuffer = new Array<number[]> (UNDO_BUFFER_SIZE);
        this.inventoryBuffer   = new Array<Inventory> (UNDO_BUFFER_SIZE);

        this.staticLayerBuffer[0] = Array.from(this.activeStaticLayer);
        this.objectLayerBuffer[0] = Array.from(this.activeObjectLayer);
        this.inventoryBuffer[0]   = new Inventory();

        for (let i = 1; i < UNDO_BUFFER_SIZE; ++ i) {

            this.staticLayerBuffer[i] = (new Array<number> (this.width*this.height)).fill(0);
            this.objectLayerBuffer[i] = (new Array<GameObject | undefined> (this.width*this.height)).fill(undefined);
            this.inventoryBuffer[i]   = new Inventory();
        }
    }


    private copyStateToBuffer() : void {

        this.undoBufferPointer = (this.undoBufferPointer + 1) % UNDO_BUFFER_SIZE;
        this.undoCount = Math.min(UNDO_BUFFER_SIZE-1, this.undoCount+1);

        //
        // This should be faster and more memory efficient than just 
        // "Array.from"ing the current state to the buffer, which always
        // creates a new array
        //
        for (let i = 0; i < this.width*this.height; ++ i) {

            this.staticLayerBuffer[this.undoBufferPointer][i] = this.activeStaticLayer[i];
            this.objectLayerBuffer[this.undoBufferPointer][i] = this.activeObjectLayer[i];
            this.inventoryBuffer[this.undoBufferPointer].copyDataFrom(this.activeInventory);
        }
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

                    o = new Player(x, y, this.activeInventory) as GameObject; 
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

        for (let o of this.objectPool) {

            o.draw(canvas, this);
        }
    }


    private toggleWalls(state : boolean) : void {

        let tileID : number;
        for (let i = 0; i < this.initialStaticLayer.length; ++ i) {

            tileID = this.initialStaticLayer[i];

            if (tileID == 6) {

                this.activeStaticLayer[i] = state ? 7 : 6;
            }
            else if (tileID == 7) {

                this.activeStaticLayer[i] = state ? 6 : 7;
            }
            
        }
    }


    private checkWallButtons(force = false) : void {

        let freeButton = false;

        for (let i = 0; i < this.activeStaticLayer.length; ++ i) {

            if (this.activeStaticLayer[i] == 8 &&
                this.activeObjectLayer[i] == undefined) {
 
                freeButton = true;
                break;
            }
        }

        if (this.purpleWallState != freeButton || force) {

            this.toggleWalls(!freeButton);
        }
        this.purpleWallState = freeButton;
    }


    public updatePhysics(event : CoreEvent) : void {

        const ANIMATION_SPEED = 1.0/600.0;
        const TURN_TIMER = 1.0/15.0;

        this.tileAnimationTimer = (this.tileAnimationTimer + ANIMATION_SPEED*event.delta) % 1.0;

        let anythingMoving = false;
        let somethingMoved = false;

        for (let o of this.objectPool) {

            if (o.isMoving()) {

                this.wasMoving = true;
                anythingMoving = true;
                break;
            }
        }

        if (this.wasMoving && !anythingMoving) {

            this.checkWallButtons();

            this.copyStateToBuffer();
            this.wasMoving = false;
        }

        do {

            somethingMoved = false;
            for (let o of this.objectPool) {

                if (o.update(TURN_TIMER, this, event, !anythingMoving)) {

                    somethingMoved = true;
                }
            }
        } while(somethingMoved);


        // Needed because of the "arrows"
        for (let o of this.objectPool) {

            if (o != undefined && o.doesExist()) {

                o.checkConflicts(this);
            }
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


    public drawHUD(canvas : Canvas) : void {
        
        const POS_X = 4;

        let bmpTileset = canvas.getBitmap("tileset1");
        if (bmpTileset == undefined)
            return;

        let dy = canvas.height/2 - this.tileHeight/2;

        dy -= (this.activeInventory.keyCount + this.activeInventory.torchCount) * this.tileHeight/2.0;

        for (let i = 0; i < this.activeInventory.keyCount; ++ i) {

            canvas.drawBitmapRegion(bmpTileset, 
                48, 16, this.tileWidth, this.tileHeight,
                POS_X, dy);

            dy += 16;
        }

        for (let i = 0; i < this.activeInventory.torchCount; ++ i) {

            canvas.drawBitmapRegion(bmpTileset, 
                32, 32, this.tileWidth, this.tileHeight,
                POS_X, dy);

            dy += 16;
        }
    }


    public canMoveTo(x : number, y : number, type : ObjectType) : boolean {

        const SOLID_TILES = [1, 2, 6, 9, 12];
        const ITEMS = [10, 13];
        // const ARROW_FORBIDDEN_DIR = [Direction.Left, Direction.Down, Direction.Right, Direction.Up];

        // TODO: Merge all the conditions under one
        // "return this or that or etc"

        let tileID = this.getStaticTile(x, y);

        if (SOLID_TILES.includes(tileID) ||
            this.getObjectInTile(x, y) != undefined) {

            return false;
        }

        // Flame
        if (tileID == 11 && (type & ObjectType.DestroyFlames) == 0) {

            return false;
        }

        // Item
        if ((type & ObjectType.CanCollectItems) == 0 && ITEMS.includes(tileID)) {

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


    public checkUnderlyingTile(x : number, y : number) : TileEffect {

        const ARROW_DIR = [
            TileEffect.MoveRight, 
            TileEffect.MoveUp, 
            TileEffect.MoveLeft, 
            TileEffect.MoveDown
        ];

        let tileID = this.getStaticTile(x, y);

        // Arrow
        if (tileID >= 17 && tileID <= 20) {

            return ARROW_DIR[tileID-17];
        }

        // Flame
        if (tileID == 11) {

            return TileEffect.InsideFlame;
        }

        // Key
        if (tileID == 10) {

            return TileEffect.Key;
        }
        // Torch
        if (tileID == 13) {

            return TileEffect.Torch;
        }

        return TileEffect.None;
    }


    public getObjectInTile(x : number, y : number) : GameObject | undefined {

        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return undefined;

        return this.activeObjectLayer[y*this.width + x];
    }


    public getObjectInDirection(x : number, y : number, dir : Direction) : GameObject | undefined {

        const DIR_X = [0, 1, 0, -1, 0];
        const DIR_Y = [0, 0, -1, 0, 1];

        return this.getObjectInTile(x + DIR_X[dir], y + DIR_Y[dir]);
    }


    public updateObjectLayerTile(x : number, y : number, o : GameObject | undefined) : void {

        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return;

        this.activeObjectLayer[y*this.width + x] = o;
    }   


    public updateStaticLayerTile(x : number, y : number, value : number) : void {

        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return;

        this.activeStaticLayer[y*this.width + x] = value;
    }   


    public centerCamera(canvas : Canvas) : void {

        let dx = this.width * this.tileWidth / 2;
        let dy = this.height * this.tileHeight / 2;

        canvas.transform
            .translate(canvas.width/2 - dx, canvas.height/2 - dy)
            .use();
    }


    public undo() : boolean {

        if (this.undoCount == 0)
            return false;

        this.undoBufferPointer = negMod(this.undoBufferPointer-1, UNDO_BUFFER_SIZE);

        let i : number;
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                i = y * this.width + x;

                this.activeStaticLayer[i] = this.staticLayerBuffer[this.undoBufferPointer][i];
                this.activeObjectLayer[i] = this.objectLayerBuffer[this.undoBufferPointer][i];
                this.activeInventory.copyDataFrom(this.inventoryBuffer[this.undoBufferPointer]);

                if (this.activeObjectLayer[i] != undefined) {

                    this.activeObjectLayer[i].setPosition(x, y);
                }
            }
        }
        this.checkWallButtons(true);

        -- this.undoCount;

        return true;
    }


    public reset() : void {

        let i : number;
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                i = y * this.width + x;

                this.activeStaticLayer[i] = this.initialStaticLayer[i];
                this.activeObjectLayer[i] = this.initialObjectLayer[i];
                this.activeInventory.clear();

                if (this.activeObjectLayer[i] != undefined) {

                    this.activeObjectLayer[i].setPosition(x, y);
                }
            }
        }
        this.copyStateToBuffer();
    }


    public getWidth = () : number => this.width;
    public getHeight = () : number => this.height;
}
