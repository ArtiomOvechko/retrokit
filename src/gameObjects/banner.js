import {GameObject} from "../../retrokit/core.js";

export class Banner extends GameObject {
    constructor(sprite, scale = .6) {
        super(sprite);
        this.depth = -1;
        this.setScale(scale);
    }
}