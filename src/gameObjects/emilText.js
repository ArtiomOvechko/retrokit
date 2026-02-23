import {GameObject, runtime} from "../../retrokit/core.js";

export class EmilText extends GameObject {
    constructor(x, y) {
        super(runtime.spritesDefinition.misc.emilText);

        this.x = x;
        this.y = y;

        this.setScale(.5);
    }
}