import {GameObject, runtime} from "../../retrokit/core.js";

export class Heart extends GameObject {
    constructor(x, y) {
        super(runtime.spritesDefinition.misc.heart);

        this.x = x;
        this.y = y;

        this.setScale(.5);
    }
}