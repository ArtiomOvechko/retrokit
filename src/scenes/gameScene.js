import { runtime, Scene } from "../../retrokit/core.js";
import { DynamicImageButton } from "../../retrokit/io/button.js";
import { Princess } from "../gameObjects/princess.js";
import { PlatformerViewport } from "../gameObjects/platformerViewport.js";
import {buildSteppedStories} from "../helpers/levelBuilders.js";
import {TouchHalfScreenButton} from "../gameObjects/touchHalfScreenButton.js";
import {Banner} from "../gameObjects/banner.js";
import {isMobile} from "../helpers/browserHelpers.js";
import {Artem} from "../gameObjects/artem.js";
import {Heart} from "../gameObjects/heart.js";
import {Yuliia} from "../gameObjects/yuliia.js";
import {EmilText} from "../gameObjects/emilText.js";

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
            new Banner(runtime.spritesDefinition.banners.itsMe, .4),
            new Banner(runtime.spritesDefinition.banners.firstProject),
            new Banner(runtime.spritesDefinition.banners.aws, .22),
            new Banner(runtime.spritesDefinition.banners.font, .22),
            new Banner(runtime.spritesDefinition.banners.purolator, .48),
            new Banner(runtime.spritesDefinition.banners.ideals, .22),
            new Banner(runtime.spritesDefinition.banners.retrogotchi, .24),
            new Banner(runtime.spritesDefinition.banners.votum, .22),
            new Banner(runtime.spritesDefinition.banners.princessventure, .22),
            new Banner(runtime.spritesDefinition.banners.retrokit, .24),
            new Banner(runtime.spritesDefinition.banners.goodlang, .24),
        ], 0, 89, {
            storyWidth: 158,
            wallHeight: 200,
            objLift: 40,
            traceInterval: 3,
        });

        this.blocks = solidTiles;

        this.objects = [];
        this.objects = this.objects.concat(traceTiles);

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
        this.objects = this.objects.concat([
            new EmilText(55, 70),

            new Heart(190, -1),
            new Heart(190, 5),
            new Heart(190, 12),
            new Heart(190, 18),
            new Heart(190, 24),
            new Heart(190, 30),

            new Artem(250, 25),
            new Yuliia(1362, -255),

            new DynamicImageButton(
                -1, -1, null,
                (_button, { pressed }) => {
                    if (pressed) this.princess.commandRight();
                    else this.princess.commandStop();
                    this.startAmbient();
                },
                () => {}, 1, "KeyD"
            ),
            new DynamicImageButton(
                -1, -1, null,
                (_button, { pressed }) => {
                    if (pressed) this.princess.commandLeft();
                    else this.princess.commandStop();
                    this.startAmbient();
                },
                () => {}, 1, "KeyA"
            ),
            new DynamicImageButton(
                -1, -1, null,
                (_button, { pressed }) => {
                    if (pressed) this.princess.commandJump();
                    this.startAmbient();
                },
                () => {}, 1, "KeyW"
            ),
            new DynamicImageButton(
                -1, -1, null,
                (_button, { pressed }) => {
                    if (pressed) this.princess.commandRight();
                    else this.princess.commandStop();
                    this.startAmbient();
                },
                () => {}, 1, "ArrowRight"
            ),
            new DynamicImageButton(
                -1, -1, null,
                (_button, { pressed }) => {
                    if (pressed) this.princess.commandLeft();
                    else this.princess.commandStop();
                    this.startAmbient();
                },
                () => {}, 1, "ArrowLeft"
            ),
            new DynamicImageButton(
                -1, -1, null,
                (_button, { pressed }) => {
                    if (pressed) this.princess.commandJump();
                    this.startAmbient();
                },
                () => {}, 1, "ArrowUp"
            ),
            new TouchHalfScreenButton({
                onLeftDown: () => { this.princess.commandLeft(); this.startAmbient(); },
                onRightDown: () => { this.princess.commandRight(); this.startAmbient(); },
                onUp: () => { this.princess.commandStop(); },
                onDoubleTap: () => { this.princess.commandJump(); this.startAmbient(); },
            })
        ]);
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
        this.objects?.forEach(b => b?.destroy());
    }
}
