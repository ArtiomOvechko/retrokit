import {generateUUID, OrderedList} from "./utils.js";

export class Sprite {

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

    constructor(sprite) {
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
            const xSign = xScale >= 0 ? 1 : -1;
            const ySign = yScale >= 0 ? 1 : -1;
            runtime.ctx.save();
            runtime.ctx.translate(xSign < 0 ? Math.ceil(x * 2) : 0, ySign < 0 ? Math.ceil(y * 2) : 0);
            runtime.ctx.scale(xSign,ySign);
            runtime.ctx.globalAlpha = this.alpha;
            this.beforeDraw(this);
            runtime.ctx.drawImage(
                sprite.image,
                imageIndex * sprite.frameWidth,
                0,
                sprite.frameWidth,
                sprite.frameHeight,
                Math.ceil(x - (xScale * sprite.frameWidth) / 2),
                Math.ceil(y - (yScale * sprite.frameHeight) / 2),
                Math.ceil(xScale * sprite.frameWidth),
                Math.ceil(yScale * sprite.frameHeight));
            this.postDraw(this);
            runtime.ctx.restore();
        } catch (e) {
            console.log(e);
            runtime.ctx.restore();
        }
    }

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

    onResize = (event) => {

    }
}

export class Scene extends GameObject {
    // in the future there could be some logic shared between all scenes
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