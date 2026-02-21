import { runtime, Scene } from "../../retrokit/core.js";
import { DynamicImageButton } from "../../retrokit/io/button.js";
import { Princess } from "../gameObjects/princess.js";
import Tile from "../gameObjects/tile.js";
import { addText, positionText, TextType } from "../../retrokit/io/text.js";
import { PlatformerViewport } from "../gameObjects/PlatformerViewport.js";

export class GameScene extends Scene {
    constructor() {
        super({
            viewportFactory: () => new PlatformerViewport({ vpWidth: 128 })
        });

        // --- world ---
        this.princess = new Princess();
        this.princess.commandRight();
        this.princess.commandStop();

        this.princess.x = 64;
        this.princess.y = 0;

        // blocks
        this.blocks = [];
        for (let i = 0; i < 100; i += 1) {
            this.blocks.push(new Tile(i, 89));
        }

        for (let i = 100; i < 200; i += 1) {
            this.blocks.push(new Tile(i, 49));
        }

        // --- camera: start at fixed point, then follow princess after 500ms ---
        this.focusedOn = null;
        this.viewport.follow(null);                 // stop follow if your viewport supports it
        this.focus(64, 81);                         // initial camera point

        this._followTimeout = setTimeout(() => {
            // switch to following princess
            this.focusedOn = this.princess;
            this.viewport.follow(this.princess);
        }, 500);

        // --- gui ---
        this.audioStarted = false;

        //this.guiText = addText("Welcome to \n\nRetrokit 1.0.2", TextType.MESSAGE, "#ffffff");
        //positionText(this.guiText, runtime.settings.SURFACE_WIDTH * 0.2, runtime.settings.SURFACE_HEIGHT * 0.05);

        // --- inputs ---
        this.rightButton = new DynamicImageButton(
            -1, -1, null,
            (_button, { pressed }) => {
                if (pressed) this.princess.commandRight();
                else this.princess.commandStop();
                this.startAmbient();
            },
            () => {}, 1, "KeyD"
        );

        this.leftButton = new DynamicImageButton(
            -1, -1, null,
            (_button, { pressed }) => {
                if (pressed) this.princess.commandLeft();
                else this.princess.commandStop();
                this.startAmbient();
            },
            () => {}, 1, "KeyA"
        );

        this.upButton = new DynamicImageButton(
            -1, -1, null,
            (_button, { pressed }) => {
                if (pressed) this.princess.commandJump();
                this.startAmbient();
            },
            () => {}, 1, "KeyW"
        );
    }

    startAmbient() {
        if (this.audioStarted) return;
        this.audioStarted = true;
        runtime.soundDefinition.ambient.burningDisco.play().then();
    }

    onViewportChanged() {
        super.onViewportChanged();
        // if (this.guiText) {
        //     positionText(this.guiText, runtime.settings.SURFACE_WIDTH * 0.2, runtime.settings.SURFACE_HEIGHT * 0.05);
        // }
    }

    onStep() {
        // DO NOT call super.onStep() if Scene.onStep snaps the camera
        // super.onStep();

        if (this.focusedOn) {
            this.viewport.follow(this.focusedOn);
        }
        this.viewport.step();
    }


    destroy() {
        super.destroy();

        if (this._followTimeout) {
            clearTimeout(this._followTimeout);
            this._followTimeout = null;
        }

        this.princess?.destroy();
        this.guiText?.destroy();
        this.blocks?.forEach(b => b?.destroy());
    }
}
