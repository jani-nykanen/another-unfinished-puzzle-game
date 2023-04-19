import { InputState } from "./inputstate.js";
import { Keyboard } from "./keyboard.js";
import { Mouse } from "./mouse.js";
import { GamePad } from "./gamepad.js";
import { Vector2 } from "../vector/vector.js";


// Heh, "class action"
class Action {


    public keys : Array<string>;
    public mouseButtons : Array<number>;
    public gamepadButtons : Array<number>;


    constructor(keys : Array<string>,  mouseButtons : Array<number>, gamepadButtons : Array<number>) {

        this.keys = Array.from(keys);
        this.mouseButtons = Array.from(mouseButtons);
    }
}


export class InputManager {    


    private actions : Map<string, Action>;

    private virtualStick : Vector2;
    
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
            return;
        }

        this.virtualStick.zeros();
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

        return state;
    }


    public anyPressed = () : boolean => 
        this.keyboard.isAnyPressed() || this.mouse.isAnyPressed() || this.gamepad.isAnyPressed();
}
