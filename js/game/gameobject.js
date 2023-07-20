import { negMod } from "../math/utility.js";
import { Vector2 } from "../vector/vector.js";
import { ExistingObject } from "./existingobject.js";
import { tileEffectToDirection } from "./tileeffect.js";
export class GameObject extends ExistingObject {
    constructor(x, y, exist = true) {
        super();
        this.type = 0;
        this.moving = false;
        this.moveTimer = 0.0;
        this.automatedMovement = false;
        this.dir = 0 /* Direction.None */;
        this.getPosition = () => this.pos.clone();
        this.getRenderPosition = () => this.renderPos.clone();
        this.getType = () => this.type;
        this.doesExist = () => this.exist;
        this.isMoving = () => this.moving;
        this.pos = new Vector2(x, y);
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();
        this.exist = true;
    }
    updateMovement(moveSpeed, stage, event, resetTimer = true) {
        if (!this.moving)
            return;
        this.moveTimer -= moveSpeed * event.step;
        if (this.moveTimer <= 0.0) {
            this.target.x = negMod(this.target.x, stage.getWidth());
            this.target.y = negMod(this.target.y, stage.getHeight());
            stage.updateObjectLayerTile(this.target.x, this.target.y, this);
            this.pos = this.target.clone();
            this.renderPos = this.pos.clone();
            this.moving = false;
            if (resetTimer) {
                this.moveTimer = 0.0;
            }
        }
        this.renderPos = Vector2.lerp(this.pos, this.target, 1.0 - this.moveTimer);
    }
    updateAnimation(event) { }
    ;
    tileEffectEvent(stage, eff) { return false; }
    resetEvent() { }
    handleTileEffect(stage, eff) {
        if (eff >= 1 /* TileEffect.MoveRight */ && eff <= 4 /* TileEffect.MoveDown */) {
            if (this.moveTo(tileEffectToDirection(eff), stage)) {
                this.automatedMovement = true;
                return true;
            }
            return false;
        }
        else if (eff == 9 /* TileEffect.CrossBlock */) {
            stage.updateStaticLayerTile(this.pos.x, this.pos.y, 22);
            return false;
        }
        return this.tileEffectEvent(stage, eff);
    }
    moveTo(dir, stage) {
        const DIR_X = [1, 0, -1, 0];
        const DIR_Y = [0, -1, 0, 1];
        if (dir == 0 /* Direction.None */) {
            this.target = this.pos.clone();
            this.moving = true;
            this.moveTimer += 1.0;
            this.dir = dir;
            return true;
        }
        let dirx = DIR_X[dir - 1];
        let diry = DIR_Y[dir - 1];
        if ((dirx != 0 || diry != 0) &&
            stage.canMoveTo(this.pos.x + dirx, this.pos.y + diry, this.type)) {
            this.target = Vector2.add(this.pos, new Vector2(dirx, diry));
            this.moving = true;
            this.moveTimer += 1.0;
            this.dir = dir;
            stage.updateObjectLayerTile(this.pos.x, this.pos.y, undefined);
            return true;
        }
        return false;
    }
    update(moveSpeed, stage, event, canControl) {
        if (!this.exist)
            return false;
        this.updateAnimation(event);
        if (this.moving) {
            this.updateMovement(moveSpeed, stage, event, false);
            if (this.moving) {
                return false;
            }
        }
        let eff = stage.checkUnderlyingTile(this.pos.x, this.pos.y);
        if (this.handleTileEffect(stage, eff)) {
            return true;
        }
        if (canControl) {
            if (!this.checkMovement(stage, event)) {
                this.moveTimer = 0;
            }
            else {
                this.automatedMovement = false;
                return true;
            }
        }
        return false;
    }
    forceFinishMove(stage) {
        if (!this.moving)
            return false;
        this.target.x = negMod(this.target.x, stage.getWidth());
        this.target.y = negMod(this.target.y, stage.getHeight());
        stage.updateObjectLayerTile(this.target.x, this.target.y, this);
        this.pos = this.target.clone();
        this.renderPos = this.pos.clone();
        this.moving = false;
        this.moveTimer = 0.0;
        let eff = stage.checkUnderlyingTile(this.pos.x, this.pos.y);
        return this.handleTileEffect(stage, eff);
    }
    checkConflicts(stage) {
        if (!this.moving)
            return;
        let o = stage.getObjectInTile(this.target.x, this.target.y);
        if (o != undefined && o != this) {
            this.moving = false;
            this.moveTimer = 0.0;
            this.target = this.pos.clone();
            this.renderPos = this.pos.clone();
            stage.updateObjectLayerTile(this.pos.x, this.pos.y, this);
        }
    }
    setPosition(x, y) {
        this.pos.x = x;
        this.pos.y = y;
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();
        this.moving = false;
        this.moveTimer = 0;
        this.exist = true;
        this.resetEvent();
    }
}
