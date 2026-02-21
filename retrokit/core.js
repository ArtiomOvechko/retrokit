import {generateUUID, OrderedList} from "./utils.js";

export class Sprite {

    /**
     *
     * @param path file path relative to the index.html
     * @param frameWidth single frame width
     * @param frameHeight single frame width
     * @param framesPerImage how many steps (game frames) a single image (sprite frame) is displayed. The inverse of image speed.
     * 1 means each frame is changed every game step
     * @param totalFrames how many rectangles (frames) to split the image into
     */
    constructor(path, frameWidth, frameHeight, framesPerImage, totalFrames) {
        this.isLoaded = false;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.framesPerImage = framesPerImage;
        this.image = document.createElement("img");
        this.image.onload = () => {
            this.isLoaded = true;
        };
        this.image.onerror = () => {
            this.isLoaded = true;
        }
        this.image.style.display = 'none';
        document.body.appendChild(this.image);
        this.image.src = path;
        this.totalFrames = totalFrames;
        runtime.sprites.push(this);
    }
}

export class GameObject {
    x = 0;
    y = 0;
    visible = true;
    destroyed = false;
    xScale = 1;
    yScale = 1;
    depth = 0;
    imageSpeed = 1;
    frameNumber = 0;
    alpha = 1;
    gui = false;

    constructor(sprite = null) {
        try {
            this.id = generateUUID();
            if (sprite instanceof Sprite) {
                this.setSprite(sprite);
            }
            runtime.registerObject(this);
        } catch (e) {
            runtime.logger?.log(e)
            console.error(e);
        }
    }

    setScale(value) {
        this.xScale = value;
        this.yScale = value;
    }

    setAlpha(value) {
        this.alpha = value;
    }

    getImageWidth() {
        return Math.abs(this.xScale) * this.sprite?.frameWidth;
    }

    getImageHeight() {
        return Math.abs(this.yScale) * this.sprite?.frameHeight;
    }

    setDepth(value) {
        this.depth = value;
        if (!runtime.gameObjects.contains(this))
            return;

        runtime.gameObjects.remove(this);
        runtime.gameObjects.add(this);
    }

    setSprite(sprite) {
        if (this.sprite === sprite) {
            return;
        }
        this.sprite = sprite;
        this.imageIndex = 0;
        this.prevImageIndex = 0;
        this.frameNumber = 0;
    };

    onDraw() {
        if (!this.sprite)
            return;

        const framesPerImage = this.sprite.framesPerImage / this.imageSpeed;

        if (this.frameNumber++ >= 1000000)
            this.frameNumber = 1
        this.prevImageIndex = this.imageIndex;
        this.imageIndex = Math.floor((this.frameNumber / framesPerImage) % this.sprite.totalFrames);

        if (this.prevImageIndex !== this.imageIndex && this.onFrameChanged) {
            this.onFrameChanged();
        }

        if (this.imageIndex !== this.prevImageIndex && this.imageIndex === 0 && this.onAnimationEnd) {
            this.onAnimationEnd(this);
        }

        if (this.destroyed)
            return;

        if (this.visible) {
            try {
                this.drawSpriteCentered(this.sprite, this.imageIndex, this.x, this.y, this.xScale, this.yScale);
            } catch (ex) {
                throw ex;
            }

        }
    }

    beforeDraw() {}

    postDraw() {}

    drawSpriteCentered(sprite, imageIndex, x, y, xScale, yScale) {
        try {
            const scene = runtime.scene;
            const vp = scene?.viewport;

            // 1) Resolve screen position + final scale
            let sx = x;
            let sy = y;
            let finalXScale = xScale;
            let finalYScale = yScale;

            if (!this.gui && vp) {
                const p = vp.worldToScreen(x, y);
                sx = p.x;
                sy = p.y;

                // viewport scale multiplies object scale
                finalXScale = xScale * vp.scale;
                finalYScale = yScale * vp.scale;
            }

            // 2) Stable origin in SOURCE pixels (prevents odd/even jitter)
            const originX = Math.floor(sprite.frameWidth / 2);
            const originY = Math.floor(sprite.frameHeight / 2);

            // Snap pivot to whole screen pixels for crisp rendering
            const px = Math.round(sx);
            const py = Math.round(sy);

            // 3) Draw using pivot transform (stable mirroring)
            runtime.ctx.save();
            runtime.ctx.globalAlpha = this.alpha;

            runtime.ctx.translate(px, py);
            runtime.ctx.scale(finalXScale, finalYScale);

            this.beforeDraw(this);

            runtime.ctx.drawImage(
                sprite.image,
                imageIndex * sprite.frameWidth,
                0,
                sprite.frameWidth,
                sprite.frameHeight,
                -originX,
                -originY,
                sprite.frameWidth,
                sprite.frameHeight
            );

            this.postDraw(this);
            runtime.ctx.restore();
        } catch (e) {
            console.log(e);
            try { runtime.ctx.restore(); } catch {}
        }
    }

    on(event) {}

    onStep() {

    };

    destroy() {
        if (this.destroyed)
            return;
        this.destroyed = true;
        runtime.destroyObject(this);
    };

    onAnimationEnd = null;

    onFrameChanged = null;
}

class Logger {

    log(message) {
        const messageString = message.toString();

        console.log(messageString);
    }
}

class Runtime {

    inputHandler = null;

    sceneFactory = () => null;
    settings = null;

    constructor(onStart, settings) {
        this.onStart = onStart;
        this.settings = settings;
    }

    async start() {
        this.logger = new Logger();

        this.logger.log('loading game core...');
        this.gameObjects = new OrderedList(x => x.depth, true);
        this.sprites = [];

        setTimeout(async () => {

            this.logger.log('loading canvas...');
            this.canvas = document.getElementById("game-surface");
            this.canvas.width = this.settings.SURFACE_WIDTH;
            this.canvas.height = this.settings.SURFACE_HEIGHT;
            this.ctx = this.canvas.getContext("2d");
            this.ctx.imageSmoothingEnabled = false;

            await this.onStart();

            this.logger.log('starting game loop...');

            document.onvisibilitychange = this.onVisibilityChange;
            window.onresize = this.onResize;

            this.onResize();
            this.runGame();

        }, runtime.settings.LAUNCH_DELAY);
    }

    runGame() {
        let interval = setInterval(() => {
            let spritesLoaded = true;
            this.sprites.forEach((spr) => {
                if (!spr.isLoaded)
                    spritesLoaded = false;
            });
            if (spritesLoaded) {
                clearInterval(interval);
                this._runGame();
            }
        }, runtime.settings.LAUNCH_DELAY);
    }

    _runGame() {
        this.registerObject(this.inputHandler);

        this.sceneFactory();

        clearInterval(this.loopInterval);

        this.loopInterval = setInterval(() => this.runStep(), this.settings.GAME_STEP_SPEED);
    }

    runStep() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.gameObjects.forEach((gameObject) => {
            try {
                gameObject.onStep();
            } catch (ex) {
                this.logger.log(ex);
            }
        });
        this.gameObjects.forEach((gameObject) => {
            try {
                gameObject.onDraw();
            } catch (ex) {
                this.logger.log(ex);
            }
        });
    }

    isObjectRegistered(gameObject) {
        return this.gameObjects.contains(gameObject);
    }

    registerObject(gameObject) {
        if (!this.gameObjects.contains(gameObject))
            this.gameObjects.add(gameObject);
        return gameObject;
    }

    destroyObject(gameObject) {
        this.gameObjects.remove(gameObject);
    }

    onVisibilityChange = (event) => {

    }

    onResize = (_event) => {
        this.settings.SURFACE_HEIGHT = window.innerHeight;
        this.settings.SURFACE_WIDTH  = window.innerWidth;

        if (this.canvas) {
            this.canvas.width = this.settings.SURFACE_WIDTH;
            this.canvas.height = this.settings.SURFACE_HEIGHT;
            this.ctx = this.canvas.getContext("2d");
            this.ctx.imageSmoothingEnabled = false;
        }

        this.gameObjects.forEach((gameObject) => {
            gameObject.on('updateViewport');
        });
    }
}

export class Scene extends GameObject {
    constructor({
                    vpWidth = null,
                    vpHeight = null,
                } = {}) {
        super(null);

        runtime.scene = this;

        this.viewport = new Viewport({ vpWidth, vpHeight });

        this.updateViewport();

        this.focusedOn = null;
    }

    focus(objOrX, y = null) {
        if (typeof objOrX === "object" && objOrX) {
            if (typeof objOrX === "object")
                this.focusedOn = objOrX;
            else
                this.focusedOn = null;

            this.viewport.focusOn(objOrX.x, objOrX.y);
        } else {
            this.focusedOn = null;

            this.viewport.focusOn(Number(objOrX) || 0, Number(y) || 0);
        }
    }

    onStep() {
        super.onStep();
        if (this.focusedOn) {
            this.viewport.focusOn(this.focusedOn.x, this.focusedOn.y);
        }
    }

    on(event) {
        super.on(event);
        if (event === 'updateViewport')
            this.updateViewport();
    }

    onViewportChanged() {
        // optional hook; override per scene if you need
    }

    updateViewport() {
        this.viewport.updateForScreen(runtime.settings.SURFACE_WIDTH, runtime.settings.SURFACE_HEIGHT);
        this.onViewportChanged();
    }

    destroy() {
        super.destroy();
    }
}

export let runtime = null;
export async function InitGame(onRuntimeStart, settingsFunc = s => s) {
    let settings = settingsFunc(new Settings());
    runtime = new Runtime(onRuntimeStart, settings);
    await runtime.start();
}

export class Settings {
   LAUNCH_DELAY = 50;
   GAME_STEP_SPEED = 50;

   SURFACE_HEIGHT = window.innerHeight;
   SURFACE_WIDTH = window.innerWidth;

   COLOR_SYSTEM = '#39426b';
}

class Viewport {
    constructor({
                    vpWidth = null,
                    vpHeight = null,
                } = {}) {
        this.vpWidth = vpWidth;
        this.vpHeight = vpHeight;

        // camera center in WORLD units
        this.cx = 0;
        this.cy = 0;

        // computed
        this.scale = 1;         // world->screen multiplier
        this.logicalWidth = 0;  // computed effective logical size
        this.logicalHeight = 0;
    }

    updateForScreen(screenW, screenH) {

        if (this.vpWidth != null && this.vpWidth > 0) {

            const rawScale = screenW / this.vpWidth;

            // integer scale that is >= rawScale
            this.scale = Math.max(1, Math.ceil(rawScale));

            // now recompute logical size using integer scale
            this.logicalWidth  = Math.floor(screenW / this.scale);
            this.logicalHeight = Math.floor(screenH / this.scale);

        }
        else if (this.vpHeight != null && this.vpHeight > 0) {

            const rawScale = screenH / this.vpHeight;

            this.scale = Math.max(1, Math.ceil(rawScale));

            this.logicalHeight = Math.floor(screenH / this.scale);
            this.logicalWidth  = Math.floor(screenW / this.scale);

        }
        else {
            this.scale = 1;
            this.logicalWidth  = screenW;
            this.logicalHeight = screenH;
        }
    }


    focusOn(x, y) {
        this.cx = x;
        this.cy = y;
    }

    worldToScreen(x, y) {
        // center camera -> center screen
        const sx =  this.scale * ((x - this.cx) + Math.floor(this.logicalWidth / 2));
        const sy = this.scale * ((y - this.cy) + Math.floor(this.logicalHeight / 2));
        return { x: sx, y: sy };
    }
}
