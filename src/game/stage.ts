import { CoreEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
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
import { Vector2 } from "../vector/vector.js";
import { AnimationSpecialEffect } from "./animationeffect.js";
import { nextObject } from "./existingobject.js";
import { LevelPack } from "../core/levelpack.js";


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


    private levels : LevelPack;

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
    private specialMoveTimer : number;

    private purpleWallState : boolean = true;
    private wasMoving : boolean = false;
    private cleared : boolean = false;

    private effects : Array<AnimationSpecialEffect>;
    

    public readonly tileWidth : number;
    public readonly tileHeight : number;


    constructor(initialStage : number, levelpack : LevelPack) {

        let baseMap = levelpack.getTilemap(String(initialStage));
        if (baseMap == undefined) {

            throw "Missing tilemap!";
        }
        this.levels = levelpack;

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
        this.specialMoveTimer = 0.0;

        this.effects = new Array<AnimationSpecialEffect> ();

        // TODO: Obtain these from the tilemap
        this.tileWidth = 16;
        this.tileHeight = 16;
    }


    private initUndoBuffers(createInventory = true) : void {
        
        this.objectLayerBuffer = new Array<Array<GameObject | undefined>> (UNDO_BUFFER_SIZE);
        this.staticLayerBuffer = new Array<number[]> (UNDO_BUFFER_SIZE);

        if (createInventory) {

            this.inventoryBuffer   = new Array<Inventory> (UNDO_BUFFER_SIZE);
        }

        this.staticLayerBuffer[0] = Array.from(this.activeStaticLayer);
        this.objectLayerBuffer[0] = Array.from(this.activeObjectLayer);
        this.inventoryBuffer[0]   = new Inventory();

        for (let i = 1; i < UNDO_BUFFER_SIZE; ++ i) {

            this.staticLayerBuffer[i] = (new Array<number> (this.width*this.height)).fill(0);
            this.objectLayerBuffer[i] = (new Array<GameObject | undefined> (this.width*this.height)).fill(undefined);

            if (createInventory) {

                this.inventoryBuffer[i]   = new Inventory();
            }
            else {

                this.inventoryBuffer[i].clear();
            }
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

        let rpos : Vector2;

        for (let o of this.objectPool) {

            o.draw(canvas, this);

            rpos = o.getRenderPosition();
            if (rpos.y < 0) {

                o.draw(canvas, this, 0, this.height);
            }
            else if (rpos.y >= this.height-1) {

                o.draw(canvas, this, 0, -this.height);
            }
            else if (rpos.x < 0) {

                o.draw(canvas, this, this.width, 0);
            }
            else if (rpos.x >= this.width-1) {

                o.draw(canvas, this, -this.width, 0);
            }
        }
    }


    private toggleWalls(state : boolean) : void {

        let tileID : number;
        for (let i = 0; i < this.initialStaticLayer.length; ++ i) {

            tileID = this.initialStaticLayer[i];
            if (this.activeObjectLayer[i] != undefined)
                continue;

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


    public update(event : CoreEvent) : void {

        const ANIMATION_SPEED = 1.0/30.0;
        const TURN_TIMER = 1.0/15.0;

        this.tileAnimationTimer = (this.tileAnimationTimer + ANIMATION_SPEED*event.step) % 1.0;

        let anythingActive = this.cleared;
        let somethingMoved = false;

        for (let e of this.effects) {

            e.update(event);
            if (e.doesExist()) {

                anythingActive = true;
            }
        }

        for (let o of this.objectPool) {

            if (o.isMoving()) {

                this.wasMoving = true;
                anythingActive = true;
                break;
            }
        }

        if (anythingActive) {

            this.specialMoveTimer = (this.specialMoveTimer + TURN_TIMER * event.step) % 1.0;
        }
        else {

            this.specialMoveTimer = 0.0;
        }

        if (this.wasMoving && !anythingActive) {

            this.checkWallButtons();

            this.copyStateToBuffer();
            this.wasMoving = false;
        }

        do {

            somethingMoved = false;
            for (let o of this.objectPool) {

                if (o.update(TURN_TIMER, this, event, !anythingActive)) {

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
        let bmpEffects = canvas.getBitmap("effects");

        if (bmpWall != undefined) {

            this.wallMap.draw(canvas, bmpWall, this.tileWidth, this.tileHeight);
        }

        if (bmpTileset != undefined) {

            this.drawStaticTiles(canvas, bmpTileset);
        }

        if (bmpEffects != undefined) {

            for (let e of this.effects) {

                e.draw(canvas, bmpEffects, this.tileWidth, this.tileHeight);
            }
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

        x = negMod(x, this.width);
        y = negMod(y, this.height);

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

        // Stairway
        if ((type & ObjectType.CanFinishStage) == 0 && tileID == 4) {

            return true;
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

        // TODO: Lookup table for all the cases,
        // or at least switch for the rest

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

        // Stairway
        if (tileID == 4) {

            return TileEffect.Stairway;
        }

        return TileEffect.None;
    }


    public interactWithTiles(x : number, y : number) : boolean {

        x = negMod(x, this.width);
        y = negMod(y, this.height);

        let tileID = this.getStaticTile(x, y);

        // Bush
        if (tileID == 12 &&
            this.activeInventory.torchCount > 0) {

            this.updateStaticLayerTile(x, y, 11);
            this.activeInventory.useTorch();

            this.spawnAnimationEffect(1, x, y);

            return true;
        }

        // Lock
        if (tileID == 9 &&
            this.activeInventory.keyCount > 0) {

            this.updateStaticLayerTile(x, y, 0);
            this.activeInventory.useKey();

            this.spawnAnimationEffect(2, x, y);

            return true;
        }

        return false;
    }


    public getObjectInTile(x : number, y : number) : GameObject | undefined {

        x = negMod(x, this.width);
        y = negMod(y, this.height);

        return this.activeObjectLayer[y*this.width + x];
    }


    public getObjectInDirection(x : number, y : number, dir : Direction) : GameObject | undefined {

        const DIR_X = [0, 1, 0, -1, 0];
        const DIR_Y = [0, 0, -1, 0, 1];

        return this.getObjectInTile(x + DIR_X[dir], y + DIR_Y[dir]);
    }


    public updateObjectLayerTile(x : number, y : number, o : GameObject | undefined) : void {

        x = negMod(x, this.width);
        y = negMod(y, this.height);

        this.activeObjectLayer[y*this.width + x] = o;
    }   


    public updateStaticLayerTile(x : number, y : number, value : number) : void {

        x = negMod(x, this.width);
        y = negMod(y, this.height);

        this.activeStaticLayer[y*this.width + x] = value;
    }   


    public spawnAnimationEffect(id : number, x : number, y : number) : void {

        const ANIM_SPEED = 4;

        let eff = nextObject<AnimationSpecialEffect>(this.effects, AnimationSpecialEffect);
        eff.spawn(x, y, id, ANIM_SPEED);
    }


    public centerCamera(canvas : Canvas) : void {

        let dx = canvas.width/2 - this.width * this.tileWidth / 2;
        let dy = canvas.height/2 - this.height * this.tileHeight / 2;

        canvas.transform
            .translate(dx, dy)
            .use();

        canvas.setViewport(dx, dy, this.width * this.tileWidth, this.height * this.tileHeight);
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

        // This is needed if the player resets the stage, then
        // undoes the move
        for (let o of this.objectPool) {

            o?.kill();
        }
        for (let o of this.activeObjectLayer) {

            if (o != undefined) {
                
                o.makeExist();
            }
        }
        return true;
    }


    public reset() : void {

        let anyMoving = false;
        do {

            anyMoving = false;
            for (let o of this.objectPool) {

                if (o.forceFinishMove(this)) {

                    anyMoving = true;
                }
            }
        } while(anyMoving);

        this.copyStateToBuffer();

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

        for (let e of this.effects) {

            e.kill();
        }
    }   


    public markCleared() : void {

        this.cleared = true;
    }


    public nextStage(index : number) : void {

        let baseMap = this.levels.getTilemap(String(index));
        if (baseMap == undefined) {

            throw "Missing tilemap!";
        }

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

        this.initUndoBuffers(false);

        for (let e of this.effects) {

            e.kill();
        }

        this.tileAnimationTimer = 0.0;
        this.cleared = false;
        this.purpleWallState = true;
        this.wasMoving = false;
        this.cleared  = false;
    }


    public getWidth = () : number => this.width;
    public getHeight = () : number => this.height;
    public isCleared = () : boolean => this.cleared;
    public getSpecialMoveTimer = () : number => this.specialMoveTimer;
}
