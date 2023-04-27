import { InputState } from "./inputstate.js";
import { Keyboard } from "./keyboard.js";
import { Mouse } from "./mouse.js";
import { GamePad } from "./gamepad.js";
import { Vector2 } from "../vector/vector.js";


const INPUT_DIRECTION_DEADZONE = 0.1;


// Heh, "class action"
class Action {


    public keys : Array<string>;
    public mouseButtons : Array<number>;
    public gamepadButtons : Array<number>;


    constructor(keys : Array<string>,  mouseButtons : Array<number>, gamepadButtons : Array<number>) {

        this.keys = Array.from(keys);
        this.mouseButtons = Array.from(mouseButtons);
        this.gamepadButtons = Array.from(gamepadButtons);
    }
}


export class InputManager {    


    private actions : Map<string, Action>;

    private virtualStick : Vector2;
    private oldStick : Vector2;
    private stickDelta : Vector2;
    
    public readonly keyboard : Keyboard;
    public readonly mouse : Mouse;
    public readonly gamepad : GamePad;


    constructor() {

        this.actions = new Map<string, Action> ();

        this.virtualStick = new Vector2();

        this.keyboard = new Keyboard();
        this.mouse = new Mouse();
        this.gamepad = new GamePad();
    }


    public get stick() : Vector2 {

        return this.virtualStick.clone();
    }


    public updateStick() : void {

        const DEADZONE = 0.25;

        let stick = new Vector2();
        
        this.oldStick = this.stick.clone();

        if ((this.keyboard.getKeyState("ArrowLeft") & InputState.DownOrPressed) == 1 ||
            (this.gamepad.getButtonState(14) & InputState.DownOrPressed) == 1) {

            stick.x = -1;
        }
        else if ((this.keyboard.getKeyState("ArrowRight") & InputState.DownOrPressed) == 1  ||
            (this.gamepad.getButtonState(15) & InputState.DownOrPressed) == 1) {

            stick.x = 1;
        }
        if ((this.keyboard.getKeyState("ArrowUp") & InputState.DownOrPressed) == 1  ||
            (this.gamepad.getButtonState(12) & InputState.DownOrPressed) == 1) {

            stick.y = -1;
        }
        else if ((this.keyboard.getKeyState("ArrowDown") & InputState.DownOrPressed) == 1  ||
            (this.gamepad.getButtonState(13) & InputState.DownOrPressed) == 1) {

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

        this.stickDelta = new Vector2(
            this.virtualStick.x - this.oldStick.x,
            this.virtualStick.y - this.oldStick.y);
    }


    public update() : void {

        this.keyboard.update();
        this.mouse.update();
        this.gamepad.update();
    }


    public addAction(name : string, 
        keys : Array<string>, 
        mouseButtons : Array<number>, 
        gamepadButtons : Array<number>) : InputManager {

        this.actions.set(name, new Action(keys, mouseButtons, gamepadButtons));

        for (let k of keys) {

            this.keyboard.preventKey(k);
        }

        for (let b of mouseButtons) {

            this.mouse.preventButton(b);
        }

        return this;
    }


    public getAction(name : string) : InputState {

        let action = this.actions.get(name);
        if (action == undefined)
            return InputState.Up;

        let state = InputState.Up;

        for (let k of action.keys) {

            state = this.keyboard.getKeyState(k);
            if (state != InputState.Up)
                return state;
        }

        for (let b of action.mouseButtons) {

            state = this.mouse.getButtonState(b);
            if (state != InputState.Up)
                return state;
        }

        for (let b of action.gamepadButtons) {

            state = this.gamepad.getButtonState(b);
            if (state != InputState.Up)
                return state;
        }

        return state;
    }


    public upPress() : boolean {

        return this.stick.y < 0 && 
            this.oldStick.y >= -INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.y < -INPUT_DIRECTION_DEADZONE;
    }


    public downPress() : boolean {

        return this.stick.y > 0 && 
            this.oldStick.y <= INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.y > INPUT_DIRECTION_DEADZONE;
    }


    public leftPress() : boolean {

        return this.stick.x < 0 && 
            this.oldStick.x >= -INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.x < -INPUT_DIRECTION_DEADZONE;
    }

    
    public rightPress() : boolean {

        return this.stick.x > 0 && 
            this.oldStick.x <= INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.x > INPUT_DIRECTION_DEADZONE;
    }


    public anyPressed = () : boolean => 
        this.keyboard.isAnyPressed() || this.mouse.isAnyPressed() || this.gamepad.isAnyPressed();
}
