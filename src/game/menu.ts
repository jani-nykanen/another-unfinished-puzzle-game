import { CoreEvent } from "../core/event.js";
import { InputState } from "../input/inputstate.js";
import { negMod } from "../math/utility.js";
import { Canvas, TextAlign } from "../renderer/canvas.js";
import { MenuButton } from "./menubutton.js";

export class Menu {


    private buttons : Array<MenuButton>;

    private cursorPos : number = 0;
    private active : boolean = false;
    
    private maxLength : number;


    constructor(buttons : Array<MenuButton>, makeActive = false) {

        this.buttons = buttons.map((_, i) => buttons[i].clone());
        this.maxLength = Math.max(...this.buttons.map(b => b.getText().length));

        this.active = makeActive;
    }


    public activate(cursorPos = this.cursorPos) : void {

        this.cursorPos = cursorPos % this.buttons.length;
        this.active = true;
    }


    public update(event : CoreEvent) : void {

        if (!this.active) return;

        let oldPos = this.cursorPos;

        if (event.input.upPress()) {

            -- this.cursorPos;
        }
        else if (event.input.downPress()) {

            ++ this.cursorPos;
        }

        if (oldPos != this.cursorPos) {

            this.cursorPos = negMod(this.cursorPos, this.buttons.length);
            
            event.audio.playSample(event.assets.getSample("choose"), 0.60);
        }

        let activeButton = this.buttons[this.cursorPos];
        
        if (activeButton != null && (
            event.input.getAction("select") == InputState.Pressed ||
            event.input.getAction("start") == InputState.Pressed)) {

            activeButton.evaluateCallback(event);
            
            event.audio.playSample(event.assets.getSample("select"), 0.60);
        }
    }


    public draw(canvas : Canvas, x = 0, y = 0, box = true) : void {

        const BOX_OFFSET_X = 8;
        const BOX_OFFSET_Y = 8;
        const XOFF = 0;
        const YOFF = 12;

        if (!this.active) return;

        let font = canvas.getBitmap("font");
        if (font == undefined)
            return;

        let w = this.maxLength * (8 + XOFF);
        let h = this.buttons.length * YOFF;

        let dx = x + canvas.width/2 - w/2;
        let dy = y + canvas.height/2 - h/2; 

        if (box) {

            canvas.setColor(0);
            canvas.fillRect(
                dx - BOX_OFFSET_X, dy - BOX_OFFSET_Y,
                w + BOX_OFFSET_X*2, h + BOX_OFFSET_Y*2);

            canvas.setColor(1.0);
            canvas.fillRect(
                dx - BOX_OFFSET_X+1, dy - BOX_OFFSET_Y+1,
                w + BOX_OFFSET_X*2 - 2, h + BOX_OFFSET_Y*2 - 2);
        
            canvas.setColor(0);
            canvas.fillRect(
                dx - BOX_OFFSET_X + 2, dy - BOX_OFFSET_Y + 2,
                w + BOX_OFFSET_X*2 - 4, h + BOX_OFFSET_Y*2 - 4);
        }


        canvas.setColor();
        for (let i = 0; i < this.buttons.length; ++ i) {

            if (i == this.cursorPos) {

                canvas.setColor(1.0, 1.0, 0.0);
            }
            else {

                canvas.setColor();
            }

            canvas.drawText(font, this.buttons[i].getText(),
                canvas.width/2, dy + i * YOFF, 
                XOFF, 0, TextAlign.Center);
        } 
    }


    public isActive = () : boolean => this.active;


    public deactivate() : void {

        this.active = false;
    }


    public changeButtonText(index : number, text : string) : void {

        this.buttons[index].changeText(text);
    }
}
