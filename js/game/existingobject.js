export class ExistingObject {
    constructor() {
        this.doesExist = () => this.exist;
    }
    kill() {
        this.exist = false;
    }
    makeExist() {
        this.exist = true;
    }
}
export function nextObject(arr, type) {
    for (let o of arr) {
        if (!o.doesExist()) {
            return o;
        }
    }
    let o = new type.prototype.constructor;
    arr.push(o);
    return o;
}
