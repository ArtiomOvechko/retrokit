import {GameObject, runtime} from "../../retrokit/core.js";

export class Princess extends GameObject {
    constructor() { // Each game object optionally has a default starting sprite
        super(runtime.spritesDefinition.princess.walking);

        // We can define custom object state variables here
        this.isMoving = false;
        this.speed = 1;

        // setting this will keep the object within screen coordinates/scale instead of the viewport
        //this.gui = true
    }

    commandRight() {
        this.isMoving = true;
        this.xScale = -1 * Math.abs(this.xScale);// how we mirror the sprite and can track X direction
    }

    commandLeft() {
        this.isMoving = true;
        this.xScale = Math.abs(this.xScale);
    }

    commandStop() {
        this.isMoving = false;
    }

    handleMovement() {
        if (this.isMoving) {
            this.x += -this.xScale * this.speed;
            this.imageSpeed = 1; // reset image speed
        } else {
            this.imageSpeed = 0;
        }
    }

    onStep() {
        super.onStep();

        // This is how we process object state every step
        this.handleMovement();
    }
}