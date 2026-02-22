import { runtime, Scene } from "../../retrokit/core.js";
import { DynamicImageButton } from "../../retrokit/io/button.js";
import { Princess } from "../gameObjects/princess.js";
import { PlatformerViewport } from "../gameObjects/platformerViewport.js";
import {buildSteppedStories} from "../helpers/levelBuilders.js";
import Tile from "../gameObjects/tile.js";
import {TouchHalfScreenButton} from "../gameObjects/touchHalfScreenButton.js";
import {Banner} from "../gameObjects/banner.js";
import {isMobile} from "../helpers/browserHelpers.js";

export class GameScene extends Scene {
    constructor() {
        super({
            viewportFactory: () => new PlatformerViewport({ vpWidth: 128 })
        });

        // --- world ---
        this.princess = new Princess();
        this.princess.commandRight();
        this.princess.commandStop();
        this.princess.depth = -1;

        this.princess.x = 64;
        this.princess.y = 0;

        const { solidTiles, traceTiles } = buildSteppedStories([
            new Banner(isMobile()
                ? runtime.spritesDefinition.banners.guideTouch
                : runtime.spritesDefinition.banners.guidePc,
                .2),
            new Banner(runtime.spritesDefinition.banners.firstProject),
            new Tile(0,0),
            new Tile(0,0),
        ], 0, 89, {
            storyWidth: 138,
            wallHeight: 200,
            objLift: 40,
            traceInterval: 3,
        });

        this.blocks = solidTiles;

        this.traceTiles = traceTiles;

        // --- camera: start at fixed point, then follow princess after 500ms ---
        this.focusedOn = null;
        this.viewport.follow(null);
        this.focus(64, 81);

        this._followTimeout = setTimeout(() => {
            // switch to following princess
            this.focusedOn = this.princess;
            this.viewport.follow(this.princess);
        }, 500);

        this.audioStarted = false;

        // --- inputs ---
        this.rightDButton = new DynamicImageButton(
            -1, -1, null,
            (_button, { pressed }) => {
                if (pressed) this.princess.commandRight();
                else this.princess.commandStop();
                this.startAmbient();
            },
            () => {}, 1, "KeyD"
        );

        this.leftAButton = new DynamicImageButton(
            -1, -1, null,
            (_button, { pressed }) => {
                if (pressed) this.princess.commandLeft();
                else this.princess.commandStop();
                this.startAmbient();
            },
            () => {}, 1, "KeyA"
        );

        this.upWButton = new DynamicImageButton(
            -1, -1, null,
            (_button, { pressed }) => {
                if (pressed) this.princess.commandJump();
                this.startAmbient();
            },
            () => {}, 1, "KeyW"
        );

        this.rightButton = new DynamicImageButton(
            -1, -1, null,
            (_button, { pressed }) => {
                if (pressed) this.princess.commandRight();
                else this.princess.commandStop();
                this.startAmbient();
            },
            () => {}, 1, "ArrowRight"
        );

        this.leftButton = new DynamicImageButton(
            -1, -1, null,
            (_button, { pressed }) => {
                if (pressed) this.princess.commandLeft();
                else this.princess.commandStop();
                this.startAmbient();
            },
            () => {}, 1, "ArrowLeft"
        );

        this.upButton = new DynamicImageButton(
            -1, -1, null,
            (_button, { pressed }) => {
                if (pressed) this.princess.commandJump();
                this.startAmbient();
            },
            () => {}, 1, "ArrowUp"
        );

        this.touchMoveButton = new TouchHalfScreenButton({
            onLeftDown: () => { this.princess.commandLeft(); this.startAmbient(); },
            onRightDown: () => { this.princess.commandRight(); this.startAmbient(); },
            onUp: () => { this.princess.commandStop(); },
            onDoubleTap: () => { this.princess.commandJump(); this.startAmbient(); },
        });

    }

    startAmbient() {
        if (this.audioStarted) return;
        this.audioStarted = true;
        runtime.soundDefinition.ambient.burningDisco.play({loop: true}).then();
    }

    onViewportChanged() {
        super.onViewportChanged();
    }

    updateViewport() {
        if (runtime.settings.SURFACE_WIDTH > runtime.settings.SURFACE_HEIGHT) {
            this.viewport.vpWidth = 256;
        } else {
            this.viewport.vpHeight = 128;
        }
        super.updateViewport();
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
        this.blocks?.forEach(b => b?.destroy());
        this.traceTiles?.forEach(t => t.destroy());

        this.leftButton.destroy();
        this.rightButton.destroy();
        this.upButton.destroy();
        this.leftAButton.destroy();
        this.rightDButton.destroy();
        this.upWButton.destroy();

        this.touchMoveButton.destroy();
    }
}
