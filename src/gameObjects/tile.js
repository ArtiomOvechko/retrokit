import {GameObject, runtime} from "../../retrokit/core.js";

export default class Tile extends GameObject {
    constructor(x, y) {
        super(runtime.spritesDefinition.tiles.square);
        this.x = x;
        this.y = y;
    }
}