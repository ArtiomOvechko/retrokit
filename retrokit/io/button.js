import {GameObject, runtime} from "../core.js";
import {distanceBetween} from "../utils.js";

export class InputHandler extends GameObject {

    listeners = [];

    constructor() {
        super();
        this.currentFrame = 0;
        this.blinkDurationFrames = 10;
        this.blinkEnabled = false;

        this.nextCommand = null;

        document.onclick = event => {
            runtime.logger.log('document click');
            this._handleClick(event);
        };
        document.onmousemove = (event) => {
            this._handleMouseMove(event);
        };
        document.ontouchstart = (event) => {
            this._handleTouch(event);
        }
        document.ontouchend = (event) => {
            event.preventDefault();
        };
        document.onkeydown = (event) => {
            this.listeners.forEach((listener) => {
                const listenerCommand = listener.handleKeyInput(event.code);
                if (listenerCommand)
                    this.nextCommand = listenerCommand;
            });
        };
    }

    _handleTouch(event) {
        let leftOffset = document.getElementById('game-surface').getBoundingClientRect().left;
        let topOffset = document.getElementById('game-surface').getBoundingClientRect().top;
        let touchSurfaceX = event.changedTouches[0].clientX - leftOffset;
        let touchSurfaceY = event.changedTouches[0].clientY - topOffset;

        this.listeners.forEach((listener) => {
            const listenerCommand = listener.handleTouchEnd(touchSurfaceX, touchSurfaceY);
            if (listenerCommand) {
                runtime.logger?.log(`generic listener button press: ${listener?.buttonType}`);
                this.nextCommand = listenerCommand;
            }
        });
    }

    _handleClick(event) {
        let leftOffset = document.getElementById('game-surface').getBoundingClientRect().left;
        let topOffset = document.getElementById('game-surface').getBoundingClientRect().top;
        let touchSurfaceX = event.clientX - leftOffset;
        let touchSurfaceY = event.clientY - topOffset;

        this.listeners.forEach((listener) => {
            runtime.logger.log(`generic listener click attempt: ${listener?.buttonType}`);
            const listenerCommand = listener.handleTouchEnd(touchSurfaceX, touchSurfaceY);
            if (listenerCommand) {
                runtime.logger?.log(`generic listener click: ${listener?.buttonType}`);
                this.nextCommand = listenerCommand;
            }
        });
    }

    _handleMouseMove(event) {
        let leftOffset = document.getElementById('game-surface').getBoundingClientRect().left;
        let topOffset = document.getElementById('game-surface').getBoundingClientRect().top;
        let touchSurfaceX = event.clientX - leftOffset;
        let touchSurfaceY = event.clientY - topOffset;

        this.listeners.forEach((listener) => {
            const listenerCommand = listener.handleMouseMove(touchSurfaceX, touchSurfaceY);
            if (listenerCommand) {
                runtime.logger?.log(`generic listener mouse move: ${listener?.buttonType}`);
                listenerCommand();
            }
        });
    }

    onStep() {
        super.onStep();
        if (this.currentFrame++ >= 100000)
            this.currentFrame = 1;
        if (this.currentFrame % this.blinkDurationFrames === 0)
            this._toggleBlink();

        if (this.nextCommand) {
            runtime.logger.log(`executing command...`);
            this.nextCommand();
            this.nextCommand = null;
        }
    }

    _toggleBlink() {
        this.blinkEnabled = !this.blinkEnabled;
    }

    addListener(dynamicButton) {
        this.listeners.push(dynamicButton);
    }

    removeListener(dynamicButton) {
        if (this.listeners.indexOf(dynamicButton) > -1)
            this.listeners.splice(this.listeners.indexOf(dynamicButton), 1);
    }
}

class DynamicButton extends GameObject {

    keyCode = '';
    buttonType = 'dynamic button';

    constructor(x, y, onPress, onMouseMove, keyCode, width, height) {
        super();

        this.x = x;
        this.y = y;

        this.width = width;
        this.height = height;

        this.keyCode = keyCode;
        this.onPress = onPress;
        this.onMouseMove = onMouseMove;

        runtime.inputHandler.addListener(this);
    }

    handleKeyInput(code) {
        if (code === this.keyCode && runtime.isObjectRegistered(this)) {
            return () => this.onPress(this);
        }
    }

    handleTouchEnd(x, y) {
        if (distanceBetween(x, y, this) < this.getClickDistance())
            return () => this.onPress(this);
    }

    getClickDistance() {
        const clickDistance = (this.width + this.height) * .375
        return clickDistance;
    }

    handleMouseMove(x, y) {
        return () => this.onMouseMove(this, x, y);
    }

    destroy() {
        super.destroy();

        runtime.inputHandler.removeListener(this);
    }
}

export class DynamicImageButton extends DynamicButton {

    constructor(x, y, sprite, onPress, onMouseMove, scale, keyCode) {
        super(x, y, onPress, onMouseMove, keyCode, 0, 0);

        this.buttonType = 'dynamic image button';

        if (sprite) {
            this.setSprite(sprite);
        }

        this.setScale(scale);
    }

    setScale(value) {
        super.setScale(value);
        this.adjustButtonDimensions();
    }

    setSprite(sprite) {
        super.setSprite(sprite);
        this.adjustButtonDimensions();
    }

    adjustButtonDimensions() {
        this.width = (this.sprite?.frameWidth ?? 0) * this.xScale;
        this.height = (this.sprite?.frameWidth ?? 0) * this.yScale;
    }
}