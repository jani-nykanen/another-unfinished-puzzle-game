import { Keyboard } from "./keyboard.js";
import { Mouse } from "./mouse.js";
import { GamePad } from "./gamepad.js";
import { Vector2 } from "../vector/vector.js";
const INPUT_DIRECTION_DEADZONE = 0.1;
// Heh, "class action"
class Action {
    constructor(keys, mouseButtons, gamepadButtons) {
        this.keys = Array.from(keys);
        this.mouseButtons = Array.from(mouseButtons);
        this.gamepadButtons = Array.from(gamepadButtons);
    }
}
export class InputManager {
    constructor() {
        this.anyPressed = () => this.keyboard.isAnyPressed() || this.mouse.isAnyPressed() || this.gamepad.isAnyPressed();
        this.actions = new Map();
        this.virtualStick = new Vector2();
        this.keyboard = new Keyboard();
        this.mouse = new Mouse();
        this.gamepad = new GamePad();
    }
    get stick() {
        return this.virtualStick.clone();
    }
    updateStick() {
        const DEADZONE = 0.25;
        let stick = new Vector2();
        this.oldStick = this.stick.clone();
        if ((this.keyboard.getKeyState("ArrowLeft") & 1 /* InputState.DownOrPressed */) == 1 ||
            (this.gamepad.getButtonState(14) & 1 /* InputState.DownOrPressed */) == 1) {
            stick.x = -1;
        }
        else if ((this.keyboard.getKeyState("ArrowRight") & 1 /* InputState.DownOrPressed */) == 1 ||
            (this.gamepad.getButtonState(15) & 1 /* InputState.DownOrPressed */) == 1) {
            stick.x = 1;
        }
        if ((this.keyboard.getKeyState("ArrowUp") & 1 /* InputState.DownOrPressed */) == 1 ||
            (this.gamepad.getButtonState(12) & 1 /* InputState.DownOrPressed */) == 1) {
            stick.y = -1;
        }
        else if ((this.keyboard.getKeyState("ArrowDown") & 1 /* InputState.DownOrPressed */) == 1 ||
            (this.gamepad.getButtonState(13) & 1 /* InputState.DownOrPressed */) == 1) {
            stick.y = 1;
        }
        if (stick.length < DEADZONE) {
            stick = this.gamepad.getStick();
        }
        if (stick.length >= DEADZONE) {
            this.virtualStick = stick;
        }
        else {
            this.virtualStick.zeros();
        }
        this.stickDelta = new Vector2(this.virtualStick.x - this.oldStick.x, this.virtualStick.y - this.oldStick.y);
    }
    update() {
        this.keyboard.update();
        this.mouse.update();
        this.gamepad.update();
    }
    addAction(name, keys, mouseButtons, gamepadButtons) {
        this.actions.set(name, new Action(keys, mouseButtons, gamepadButtons));
        for (let k of keys) {
            this.keyboard.preventKey(k);
        }
        for (let b of mouseButtons) {
            this.mouse.preventButton(b);
        }
        return this;
    }
    getAction(name) {
        let action = this.actions.get(name);
        if (action == undefined)
            return 0 /* InputState.Up */;
        let state = 0 /* InputState.Up */;
        for (let k of action.keys) {
            state = this.keyboard.getKeyState(k);
            if (state != 0 /* InputState.Up */)
                return state;
        }
        for (let b of action.mouseButtons) {
            state = this.mouse.getButtonState(b);
            if (state != 0 /* InputState.Up */)
                return state;
        }
        for (let b of action.gamepadButtons) {
            state = this.gamepad.getButtonState(b);
            if (state != 0 /* InputState.Up */)
                return state;
        }
        return state;
    }
    upPress() {
        return this.stick.y < 0 &&
            this.oldStick.y >= -INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.y < -INPUT_DIRECTION_DEADZONE;
    }
    downPress() {
        return this.stick.y > 0 &&
            this.oldStick.y <= INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.y > INPUT_DIRECTION_DEADZONE;
    }
    leftPress() {
        return this.stick.x < 0 &&
            this.oldStick.x >= -INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.x < -INPUT_DIRECTION_DEADZONE;
    }
    rightPress() {
        return this.stick.x > 0 &&
            this.oldStick.x <= INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.x > INPUT_DIRECTION_DEADZONE;
    }
}
