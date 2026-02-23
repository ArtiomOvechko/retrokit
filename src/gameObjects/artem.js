import {GameObject, runtime} from "../../retrokit/core.js";

export class Artem extends GameObject {
    constructor(x, y) {
        super(runtime.spritesDefinition.artem.idle);

        this.x = x;
        this.y = y;
    }

    onStep() {
        super.onStep();
        if (runtime.scene.princess.x > this.x) {
            this.xScale = (-Math.abs(this.xScale));
        } else {
            this.xScale = (Math.abs(this.xScale))
        }
    }
}