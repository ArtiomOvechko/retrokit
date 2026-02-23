import {GameObject} from "../../retrokit/core.js";

export class Banner extends GameObject {
    constructor(sprite, scale = .6) {
        super(sprite);
        this.setDepth(50);
        this.setScale(scale);
    }
}