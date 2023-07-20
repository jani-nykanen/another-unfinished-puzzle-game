import { Vector2 } from "../vector/vector.js";
/**
 * Manages mouse movement & buttons
 */
export class Mouse {
    constructor() {
        this.hasFocus = false;
        this.anyPressed = false;
        /**
         * Returns the cursor position
         * @returns The cursor position
         */
        this.getPosition = () => this.cursorPos.clone();
        /**
         * Returns the difference of cursor position between the current and the
         * previous frame
         * @returns Delta movement (not scaled to the viewport)
         */
        this.getDelta = () => this.delta.clone();
        /**
         * Tells if any button was pressed since the previous frame
         * @returns True, if any button was pressed
         */
        this.isAnyPressed = () => this.anyPressed;
        this.oldPos = new Vector2();
        this.cursorPos = new Vector2();
        this.delta = new Vector2();
        this.states = new Map();
        this.prevent = new Array();
        // These might be redundant, but I want to make
        // sure the game window gets the focus to make the
        // controls work properly (only needed in the case of
        // iframe) 
        window.onfocus = () => {
            this.hasFocus = true;
        };
        window.onblur = () => {
            this.hasFocus = false;
        };
        window.addEventListener("mousedown", (e) => {
            this.mouseButtonEvent(true, e.button);
            if (this.prevent.includes(e.button))
                e.preventDefault();
            if (!this.hasFocus) {
                window.focus();
            }
        });
        window.addEventListener("mouseup", (e) => {
            this.mouseButtonEvent(false, e.button);
            if (this.prevent.includes(e.button))
                e.preventDefault();
            window.focus();
        });
        window.addEventListener("mousemove", (e) => {
            this.mouseMoveEvent(e.clientX, e.clientY);
            if (!this.hasFocus) {
                window.focus();
            }
        });
        window.addEventListener("contextmenu", (e) => e.preventDefault());
    }
    /**
     * Triggered when a mouse button is pressed down or released
     * @param down Is the button down
     * @param button Button index
     */
    mouseButtonEvent(down, button) {
        if (down) {
            if (this.states.get(button) === 1 /* InputState.Down */)
                return;
            this.states.set(button, 3 /* InputState.Pressed */);
            this.anyPressed = true;
            return;
        }
        if (this.states.get(button) === 0 /* InputState.Up */)
            return;
        this.states.set(button, 2 /* InputState.Released */);
    }
    /**
     * Triggered when the mouse cursor is being moved
     * @param x New x coordinate
     * @param y New y coordinate
     */
    mouseMoveEvent(x, y) {
        this.cursorPos.x = x;
        this.cursorPos.y = y;
    }
    /**
     * To be called each frame, updates buttons states
     */
    update() {
        for (let k of this.states.keys()) {
            if (this.states.get(k) === 3 /* InputState.Pressed */)
                this.states.set(k, 1 /* InputState.Down */);
            else if (this.states.get(k) === 2 /* InputState.Released */)
                this.states.set(k, 0 /* InputState.Up */);
        }
        this.anyPressed = false;
        this.delta = Vector2.subtract(this.cursorPos, this.oldPos);
        this.oldPos = this.cursorPos.clone();
    }
    /**
     * Scales the cursor position to the given viewport
     * @param windowWidth Window width
     * @param windowHeight Window height
     * @param viewWidth Width of the given viewport
     * @param viewHeight Height of the given viewport
     * @returns
     */
    scaleToViewport(windowWidth, windowHeight, viewWidth, viewHeight) {
        return new Vector2(this.cursorPos.x / windowWidth * viewWidth, this.cursorPos.y / windowHeight * viewHeight);
    }
    /**
     * Gives the state of the given mouse button, if any
     * @param button The requested mouse button
     * @returns The button state
     */
    getButtonState(button) {
        let state = this.states.get(button);
        if (state == undefined)
            return 0 /* InputState.Up */;
        return state;
    }
    /**
     * Prevents the default action of the given button
     * @param button The button to be "prevented"
     */
    preventButton(button) {
        this.prevent.push(button);
    }
}
