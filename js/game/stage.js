import { WallMap } from "./wallmap.js";
import { Player } from "./player.js";
import { Crate } from "./crate.js";
import { Inventory } from "./inventory.js";
import { negMod } from "../math/utility.js";
import { AnimationSpecialEffect } from "./animationeffect.js";
import { nextObject } from "./existingobject.js";
const NON_ANIMATED_TILES = [
    4, 6, 7, 8,
    9, 10, 12, 14,
    15, 21, 22, 23
];
const ANIMATED_TILES = [
    11, 13, 17, 18,
    19, 20
];
const SOURCE_X = [
    0, 0, 0, 0,
    0, 2, 3, 0,
    2, 3, 0, 1,
    2, 0, 1, 0,
    0, 0, 2, 2,
    0, 1, 2,
];
const SOURCE_Y = [
    0, 0, 0, 2,
    0, 0, 0, 1,
    1, 1, 3, 2,
    2, 6, 6, 0,
    4, 5, 5, 4,
    7, 7, 7,
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
    constructor(initialStage, levelpack) {
        this.undoBufferPointer = 0;
        this.undoCount = 0;
        this.purpleWallState = true;
        this.wasMoving = false;
        this.cleared = false;
        this.getWidth = () => this.width;
        this.getHeight = () => this.height;
        this.isCleared = () => this.cleared;
        this.getSpecialMoveTimer = () => this.specialMoveTimer;
        let baseMap = levelpack.getTilemap(String(initialStage));
        if (baseMap == undefined) {
            throw "Missing tilemap!";
        }
        this.levels = levelpack;
        this.width = baseMap.width;
        this.height = baseMap.height;
        this.objectPool = new Array();
        this.activeObjectLayer = (new Array(this.width * this.height)).fill(undefined);
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
        this.effects = new Array();
        // TODO: Obtain these from the tilemap
        this.tileWidth = 16;
        this.tileHeight = 16;
    }
    initUndoBuffers(createInventory = true) {
        this.objectLayerBuffer = new Array(UNDO_BUFFER_SIZE);
        this.staticLayerBuffer = new Array(UNDO_BUFFER_SIZE);
        if (createInventory) {
            this.inventoryBuffer = new Array(UNDO_BUFFER_SIZE);
        }
        this.staticLayerBuffer[0] = Array.from(this.activeStaticLayer);
        this.objectLayerBuffer[0] = Array.from(this.activeObjectLayer);
        this.inventoryBuffer[0] = new Inventory();
        for (let i = 1; i < UNDO_BUFFER_SIZE; ++i) {
            this.staticLayerBuffer[i] = (new Array(this.width * this.height)).fill(0);
            this.objectLayerBuffer[i] = (new Array(this.width * this.height)).fill(undefined);
            if (createInventory) {
                this.inventoryBuffer[i] = new Inventory();
            }
            else {
                this.inventoryBuffer[i].clear();
            }
        }
    }
    copyStateToBuffer() {
        this.undoBufferPointer = (this.undoBufferPointer + 1) % UNDO_BUFFER_SIZE;
        this.undoCount = Math.min(UNDO_BUFFER_SIZE - 1, this.undoCount + 1);
        //
        // This should be faster and more memory efficient than just 
        // "Array.from"ing the current state to the buffer, which always
        // creates a new array
        //
        for (let i = 0; i < this.width * this.height; ++i) {
            this.staticLayerBuffer[this.undoBufferPointer][i] = this.activeStaticLayer[i];
            this.objectLayerBuffer[this.undoBufferPointer][i] = this.activeObjectLayer[i];
            this.inventoryBuffer[this.undoBufferPointer].copyDataFrom(this.activeInventory);
        }
    }
    getStaticTile(x, y, def = 0) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return def;
        return this.activeStaticLayer[y * this.width + x];
    }
    parseObjects() {
        let tid;
        let o;
        let index;
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                index = y * this.width + x;
                tid = this.activeStaticLayer[index];
                o = undefined;
                switch (tid) {
                    // Player
                    case 3:
                        o = new Player(x, y, this.activeInventory);
                        break;
                    // Crate
                    case 5:
                        o = new Crate(x, y);
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
    drawStaticTiles(canvas, bmp) {
        if (this.activeStaticLayer == undefined)
            return;
        let sx;
        let sy;
        let frame;
        let frameCount;
        let frameShift;
        let tid;
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                tid = this.activeStaticLayer[y * this.width + x];
                sx = SOURCE_X[tid - 1];
                sy = SOURCE_Y[tid - 1];
                frameCount = FRAME_COUNT[tid - 1];
                frameShift = FRAME_SHIFT[tid - 1];
                if (NON_ANIMATED_TILES.includes(tid) &&
                    sx != undefined && sy != undefined) {
                    canvas.drawBitmapRegion(bmp, sx * this.tileWidth, sy * this.tileHeight, this.tileWidth, this.tileHeight, x * this.tileWidth, y * this.tileHeight);
                }
                else if (ANIMATED_TILES.includes(tid) &&
                    sx != undefined && sy != undefined &&
                    frameCount != undefined) {
                    frame = Math.floor(this.tileAnimationTimer * frameCount);
                    if (frameShift != undefined) {
                        frame += Number(x % 2 == y % 2) * frameShift;
                    }
                    sx += (frame % frameCount);
                    canvas.drawBitmapRegion(bmp, sx * this.tileWidth, sy * this.tileHeight, this.tileWidth, this.tileHeight, x * this.tileWidth, y * this.tileHeight);
                }
            }
        }
    }
    drawObjectLayer(canvas) {
        let rpos;
        for (let o of this.objectPool) {
            o.draw(canvas, this);
            rpos = o.getRenderPosition();
            if (rpos.y < 0) {
                o.draw(canvas, this, 0, this.height);
            }
            else if (rpos.y >= this.height - 1) {
                o.draw(canvas, this, 0, -this.height);
            }
            else if (rpos.x < 0) {
                o.draw(canvas, this, this.width, 0);
            }
            else if (rpos.x >= this.width - 1) {
                o.draw(canvas, this, -this.width, 0);
            }
        }
    }
    toggleWalls(state) {
        let tileID;
        for (let i = 0; i < this.initialStaticLayer.length; ++i) {
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
    checkChangingTiles(force = false) {
        let freeButton = false;
        for (let i = 0; i < this.activeStaticLayer.length; ++i) {
            if (this.activeStaticLayer[i] == 8 &&
                this.activeObjectLayer[i] == undefined) {
                freeButton = true;
            }
            else if (this.activeStaticLayer[i] == 22 &&
                this.activeObjectLayer[i] == undefined) {
                this.activeStaticLayer[i] = 23;
            }
        }
        if (this.purpleWallState != freeButton || force) {
            this.toggleWalls(!freeButton);
        }
        this.purpleWallState = freeButton;
    }
    update(event) {
        const ANIMATION_SPEED = 1.0 / 30.0;
        const MOVE_SPEED = 1.0 / 12.0;
        this.tileAnimationTimer = (this.tileAnimationTimer + ANIMATION_SPEED * event.step) % 1.0;
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
            this.specialMoveTimer = (this.specialMoveTimer + MOVE_SPEED * event.step) % 1.0;
        }
        else {
            this.specialMoveTimer = 0.0;
        }
        if (this.wasMoving && !anythingActive) {
            this.checkChangingTiles();
            this.copyStateToBuffer();
            this.wasMoving = false;
        }
        do {
            somethingMoved = false;
            for (let o of this.objectPool) {
                if (o.update(MOVE_SPEED, this, event, !anythingActive)) {
                    somethingMoved = true;
                }
            }
        } while (somethingMoved);
        // Needed because of the "arrows"
        for (let o of this.objectPool) {
            if (o != undefined && o.doesExist()) {
                o.checkConflicts(this);
            }
        }
    }
    draw(canvas) {
        canvas.setColor(0.0);
        canvas.fillRect(0, 0, this.width * this.tileWidth, this.height * this.tileHeight);
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
    drawHUD(canvas) {
        const POS_X = 4;
        let bmpTileset = canvas.getBitmap("tileset1");
        if (bmpTileset == undefined)
            return;
        let dy = canvas.height / 2 - this.tileHeight / 2;
        dy -= (this.activeInventory.keyCount + this.activeInventory.torchCount) * this.tileHeight / 2.0;
        for (let i = 0; i < this.activeInventory.keyCount; ++i) {
            canvas.drawBitmapRegion(bmpTileset, 48, 16, this.tileWidth, this.tileHeight, POS_X, dy);
            dy += 16;
        }
        for (let i = 0; i < this.activeInventory.torchCount; ++i) {
            canvas.drawBitmapRegion(bmpTileset, 32, 32, this.tileWidth, this.tileHeight, POS_X, dy);
            dy += 16;
        }
    }
    canMoveTo(x, y, type) {
        const SOLID_TILES = [1, 2, 6, 9, 12, 14, 15, 23];
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
        if (tileID == 11 && (type & 2 /* ObjectType.DestroyFlames */) == 0) {
            return false;
        }
        // Item
        if ((type & 4 /* ObjectType.CanCollectItems */) == 0 && ITEMS.includes(tileID)) {
            return false;
        }
        // Stairway
        if ((type & 8 /* ObjectType.CanFinishStage */) == 0 && tileID == 4) {
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
    checkUnderlyingTile(x, y) {
        // TODO: Lookup table for all the cases,
        // or at least switch for the rest
        const ARROW_DIR = [
            1 /* TileEffect.MoveRight */,
            2 /* TileEffect.MoveUp */,
            3 /* TileEffect.MoveLeft */,
            4 /* TileEffect.MoveDown */
        ];
        let tileID = this.getStaticTile(x, y);
        // Arrow
        if (tileID >= 17 && tileID <= 20) {
            return ARROW_DIR[tileID - 17];
        }
        // Flame
        if (tileID == 11) {
            return 5 /* TileEffect.InsideFlame */;
        }
        // Key
        if (tileID == 10) {
            return 6 /* TileEffect.Key */;
        }
        // Torch
        if (tileID == 13) {
            return 7 /* TileEffect.Torch */;
        }
        // Stairway
        if (tileID == 4) {
            return 8 /* TileEffect.Stairway */;
        }
        // Cross block
        if (tileID == 21) {
            return 9 /* TileEffect.CrossBlock */;
        }
        return 0 /* TileEffect.None */;
    }
    interactWithTiles(x, y) {
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
        // Bolt
        if (tileID == 14) {
            this.swapArrows();
            this.updateStaticLayerTile(x, y, 15);
            return true;
        }
        return false;
    }
    getObjectInTile(x, y) {
        x = negMod(x, this.width);
        y = negMod(y, this.height);
        return this.activeObjectLayer[y * this.width + x];
    }
    getObjectInDirection(x, y, dir) {
        const DIR_X = [0, 1, 0, -1, 0];
        const DIR_Y = [0, 0, -1, 0, 1];
        return this.getObjectInTile(x + DIR_X[dir], y + DIR_Y[dir]);
    }
    updateObjectLayerTile(x, y, o) {
        x = negMod(x, this.width);
        y = negMod(y, this.height);
        this.activeObjectLayer[y * this.width + x] = o;
    }
    updateStaticLayerTile(x, y, value) {
        x = negMod(x, this.width);
        y = negMod(y, this.height);
        this.activeStaticLayer[y * this.width + x] = value;
    }
    spawnAnimationEffect(id, x, y) {
        const ANIM_SPEED = 4;
        let eff = nextObject(this.effects, AnimationSpecialEffect);
        eff.spawn(x, y, id, ANIM_SPEED);
    }
    centerCamera(canvas) {
        let dx = canvas.width / 2 - this.width * this.tileWidth / 2;
        let dy = canvas.height / 2 - this.height * this.tileHeight / 2;
        canvas.transform
            .translate(dx, dy)
            .use();
        canvas.setViewport(dx, dy, this.width * this.tileWidth, this.height * this.tileHeight);
    }
    swapArrows() {
        const SWAP_ARROW = [19, 20, 17, 18];
        let tileId;
        for (let i = 0; i < this.width * this.height; ++i) {
            tileId = this.activeStaticLayer[i];
            if (tileId >= 17 && tileId <= 20) {
                this.activeStaticLayer[i] = SWAP_ARROW[tileId - 17];
            }
            else if (tileId == 15) {
                this.activeStaticLayer[i] = 14;
            }
        }
    }
    undo() {
        if (this.undoCount == 0)
            return false;
        this.undoBufferPointer = negMod(this.undoBufferPointer - 1, UNDO_BUFFER_SIZE);
        let i;
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                i = y * this.width + x;
                this.activeStaticLayer[i] = this.staticLayerBuffer[this.undoBufferPointer][i];
                this.activeObjectLayer[i] = this.objectLayerBuffer[this.undoBufferPointer][i];
                this.activeInventory.copyDataFrom(this.inventoryBuffer[this.undoBufferPointer]);
                if (this.activeObjectLayer[i] != undefined) {
                    this.activeObjectLayer[i].setPosition(x, y);
                }
            }
        }
        this.checkChangingTiles(true);
        --this.undoCount;
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
    reset() {
        let anyMoving = false;
        do {
            anyMoving = false;
            for (let o of this.objectPool) {
                if (o.forceFinishMove(this)) {
                    anyMoving = true;
                }
            }
        } while (anyMoving);
        this.copyStateToBuffer();
        let i;
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
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
    markCleared() {
        this.cleared = true;
    }
    nextStage(index) {
        let baseMap = this.levels.getTilemap(String(index));
        if (baseMap == undefined) {
            throw "Missing tilemap!";
        }
        this.width = baseMap.width;
        this.height = baseMap.height;
        this.objectPool = new Array();
        this.activeObjectLayer = (new Array(this.width * this.height)).fill(undefined);
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
        this.cleared = false;
    }
}
