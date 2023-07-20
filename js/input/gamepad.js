import { Vector2 } from "../vector/vector.js";
// Gamepad was taken...
export class GamePad {
    constructor() {
        this.pad = null;
        this.index = -1;
        this.anyPressed = false;
        this.isAnyPressed = () => this.anyPressed;
        this.getStick = () => this.stick.clone();
        this.stick = new Vector2();
        this.buttons = new Map();
        window.addEventListener("gamepadconnected", (ev) => {
            if (this.index < 0) {
                console.log("Gamepad with index " +
                    String(ev["gamepad"].index) +
                    " connected.");
            }
            else {
                console.log("Gamepad with index " +
                    String(ev["gamepad"].index) +
                    " connected but ignored due to some weird technical reasons.");
                return;
            }
            let gp = navigator.getGamepads()[ev["gamepad"].index];
            this.index = ev["gamepad"].index;
            this.pad = gp;
            this.updateGamepad(this.pad);
        });
    }
    pollGamepads() {
        if (navigator == null)
            return null;
        return navigator.getGamepads();
    }
    updateButtons(pad) {
        // TODO: What is the purpose of this...?
        if (pad == null) {
            for (let k in this.buttons) {
                this.buttons[k] = 0 /* InputState.Up */;
            }
            return;
        }
        for (let i = 0; i < pad.buttons.length; ++i) {
            if (this.buttons[i] == undefined) {
                this.buttons[i] = 0 /* InputState.Up */;
            }
            if (pad.buttons[i].pressed) {
                if ((this.buttons[i] & 1 /* InputState.DownOrPressed */) == 0) {
                    this.anyPressed = true;
                    this.buttons[i] = 3 /* InputState.Pressed */;
                }
                else {
                    this.buttons[i] = 1 /* InputState.Down */;
                }
            }
            else {
                if ((this.buttons[i] & 1 /* InputState.DownOrPressed */) == 1) {
                    this.buttons[i] = 2 /* InputState.Released */;
                }
                else {
                    this.buttons[i] = 0 /* InputState.Up */;
                }
            }
        }
    }
    updateStick(pad) {
        const DEADZONE = 0.25;
        if (pad == null)
            return;
        let noLeftStick = true;
        this.stick.x = 0;
        this.stick.y = 0;
        if (Math.abs(pad.axes[0]) >= DEADZONE) {
            this.stick.x = pad.axes[0];
            noLeftStick = false;
        }
        if (Math.abs(pad.axes[1]) >= DEADZONE) {
            this.stick.y = pad.axes[1];
            noLeftStick = false;
        }
        // On Firefox dpad is considered
        // axes, not buttons
        if (pad.axes.length >= 8 && noLeftStick) {
            if (Math.abs(pad.axes[6]) >= DEADZONE)
                this.stick.x = pad.axes[6];
            if (Math.abs(pad.axes[7]) >= DEADZONE)
                this.stick.y = pad.axes[7];
        }
    }
    updateGamepad(pad) {
        this.updateStick(pad);
        this.updateButtons(pad);
    }
    refreshGamepads() {
        if (this.pad == null)
            return;
        let pads = this.pollGamepads();
        if (pads == null)
            return;
        this.pad = pads[this.index];
    }
    update() {
        this.anyPressed = false;
        this.stick.x = 0.0;
        this.stick.y = 0.0;
        this.refreshGamepads();
        this.updateGamepad(this.pad);
    }
    getButtonState(button) {
        let state = this.buttons[button];
        if (state == undefined)
            return 0 /* InputState.Up */;
        return state;
    }
}
