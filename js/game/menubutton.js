export class MenuButton {
    constructor(text, callback) {
        this.getText = () => this.text;
        this.evaluateCallback = (event) => this.callback(event);
        this.text = text;
        this.callback = callback;
    }
    clone() {
        return new MenuButton(this.text, this.callback);
    }
    changeText(newText) {
        this.text = newText;
    }
}
