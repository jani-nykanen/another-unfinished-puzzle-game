import { Vector2 } from "../vector/vector.js";
import { InputState } from "./inputstate.js";


/**
 * Manages mouse movement & buttons
 */
export class Mouse {

    private states : Map<number, InputState>;
    private prevent : Array<number>;

    private oldPos : Vector2;
    private cursorPos : Vector2;
    private delta : Vector2;

    private hasFocus : boolean = false;

    private anyPressed : boolean = false;


    constructor() {

        this.oldPos = new Vector2();
        this.cursorPos = new Vector2();
        this.delta = new Vector2();

        this.states = new Map<number, InputState> ();
        this.prevent = new Array<number> ();

        // These might be redundant, but I want to make
        // sure the game window gets the focus to make the
        // controls work properly (only needed in the case of
        // iframe) 
        window.onfocus = () => {

            this.hasFocus = true;
        }
        window.onblur = () => {

            this.hasFocus = false;
        }

        window.addEventListener("mousedown", (e : MouseEvent) => {

            this.mouseButtonEvent(true, e.button);
            if (this.prevent.includes(e.button))
                e.preventDefault();

            if (!this.hasFocus) {

                window.focus();
            }
            
        });
        window.addEventListener("mouseup", (e : MouseEvent) => {

            this.mouseButtonEvent(false, e.button);
            if (this.prevent.includes(e.button))
                e.preventDefault();

            window.focus();
        }); 
        window.addEventListener("mousemove", (e : MouseEvent) => {

            this.mouseMoveEvent(e.clientX, e.clientY);

            if (!this.hasFocus) {

                window.focus();
            }
        });
        window.addEventListener("contextmenu", (e : MouseEvent) => e.preventDefault());
    }


    /**
     * Triggered when a mouse button is pressed down or released
     * @param down Is the button down
     * @param button Button index
     */
    public mouseButtonEvent(down : boolean, button : number) : void {

        if (down) {

            if (this.states.get(button) === InputState.Down)
                return;

            this.states.set(button, InputState.Pressed);
            this.anyPressed = true;
            return;
        }

        if (this.states.get(button) === InputState.Up)
            return;

        this.states.set(button, InputState.Released);
    }

    
    /**
     * Triggered when the mouse cursor is being moved
     * @param x New x coordinate
     * @param y New y coordinate
     */
    public mouseMoveEvent(x : number, y : number) : void {

        this.cursorPos.x = x;
        this.cursorPos.y = y;
    }


    /**
     * To be called each frame, updates buttons states
     */
    public update() : void {

        for (let k of this.states.keys()) {

            if (this.states.get(k) === InputState.Pressed)
                this.states.set(k, InputState.Down);
            else if (this.states.get(k) === InputState.Released)
                this.states.set(k, InputState.Up);
        }

        this.anyPressed = false;

        this.delta = Vector2.subtract(this.cursorPos, this.oldPos);
        this.oldPos = this.cursorPos.clone();
    }


    /**
     * Returns the cursor position 
     * @returns The cursor position
     */
    public getPosition = () : Vector2 => this.cursorPos.clone();


    /**
     * Scales the cursor position to the given viewport
     * @param windowWidth Window width
     * @param windowHeight Window height
     * @param viewWidth Width of the given viewport
     * @param viewHeight Height of the given viewport
     * @returns 
     */
    public scaleToViewport(windowWidth : number, windowHeight : number, 
        viewWidth : number, viewHeight : number) : Vector2 {
            
        return new Vector2(
            this.cursorPos.x / windowWidth * viewWidth,
            this.cursorPos.y / windowHeight * viewHeight
        );
    }


    /**
     * Returns the difference of cursor position between the current and the 
     * previous frame
     * @returns Delta movement (not scaled to the viewport)
     */
    public getDelta = () : Vector2 => this.delta.clone();


    /**
     * Gives the state of the given mouse button, if any
     * @param button The requested mouse button
     * @returns The button state
     */
    public getButtonState(button : number) : InputState {

        let state = this.states.get(button);
        if (state == undefined)
            return InputState.Up;

        return state;
    }


    /**
     * Tells if any button was pressed since the previous frame
     * @returns True, if any button was pressed
     */
    public isAnyPressed = () : boolean => this.anyPressed;


    /**
     * Prevents the default action of the given button
     * @param button The button to be "prevented"
     */
    public preventButton(button : number) : void {

        this.prevent.push(button);
    } 
}
