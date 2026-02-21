import { runtime, Scene} from "../../retrokit/core.js";
import {DynamicImageButton} from "../../retrokit/io/button.js";
import {Princess} from "../gameObjects/princess.js";
import Tile from "../gameObjects/tile.js";
import {addText, positionText, Text, TextType} from "../../retrokit/io/text.js";

export class GameScene extends Scene {
    constructor() {
        super({ vpWidth: 128 }); // we define either viewport width or height here, it's approximate to achieve pixel perfect scaling

        // Write your code here, here is an example:
        this.princess = new Princess();

        // Let's position the object
        this.princess.x = 64;
        this.princess.y = 72;

        // start with camera focused on princess
        this.focus(this.princess);

        //procedurally place blocks
        this.blocks = [];
        for (let i = 0; i < 100; i+= 2) {
            this.blocks.push(new Tile(i, 79))
        }

        // this is to gate audio start
        this.audioStarted = false;

        this.guiText = addText("Welcome to \n\nRetrokit 1.0.2", TextType.MESSAGE, '#ffffff');
        positionText(this.guiText,runtime.settings.SURFACE_WIDTH * .2, runtime.settings.SURFACE_HEIGHT * .05)

        // Let's define a few buttons, we are okay with them to be invisible, so let's default these params
        this.leftButton = new DynamicImageButton(-1, -1, null,
            (button, { pressed }) => {// press is emitted every step: either on click, tap or keyboard key press
                if (pressed)
                    this.princess.commandRight();
                else
                    this.princess.commandStop();

                this.startAmbient();
            },
            () => {}, 1, 'KeyD');
        this.leftButton = new DynamicImageButton(-1, -1, null,
            (button, { pressed }) => {
                if (pressed)
                    this.princess.commandLeft();
                else
                    this.princess.commandStop();

                this.startAmbient();
            },
            () => {}, 1, 'KeyA');
    }

    startAmbient() {
        if (this.audioStarted)
            return;

        this.audioStarted = true;

        runtime.soundDefinition.ambient.burningDisco.play().then();
    }

    onViewportChanged() {
        super.onViewportChanged();

        // Text needs to be repositioned after surface dimensions change
        if (this.guiText) {
            positionText(this.guiText,runtime.settings.SURFACE_WIDTH * .2, runtime.settings.SURFACE_HEIGHT * .05);
        }
        // optional hook; override per scene if you need
    }

    destroy() {
        super.destroy();

        // You should normally destroy all inner objects upon scene destroy,
        // unless you want to keep them for some reason
        this.princess.destroy();

        this.guiText.destroy();

        this.blocks.forEach(block => block.destroy());
    }
}
