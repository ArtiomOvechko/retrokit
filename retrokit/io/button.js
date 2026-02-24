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
            this._handleClick(event, true);
        };
        document.onpointerdown = event => {
            runtime.logger.log('document pointer down');
            this._handleClick(event, false);
        };
        document.onmousemove = (event) => {
            this._handleMouseMove(event);
        };
        document.ontouchend = (event) => {
            this._handleTouchEnd(event);
            event.preventDefault();
        }
        document.onkeydown = (event) => {
            this.listeners.forEach((listener) => {
                const listenerCommand = listener.handleKeyInput(event.code, { pressed: true });
                if (listenerCommand)
                    this.nextCommand = listenerCommand;
            });
        };
        document.onkeyup = (event) => {
            this.listeners.forEach((listener) => {
                const listenerCommand = listener.handleKeyInput(event.code, { pressed: false });
                if (listenerCommand)
                    this.nextCommand = listenerCommand;
            });
        };
    }

    _handleTouchEnd(event) {
        let leftOffset = document.getElementById('game-surface').getBoundingClientRect().left;
        let topOffset = document.getElementById('game-surface').getBoundingClientRect().top;
        let touchSurfaceX = event.changedTouches[0].clientX - leftOffset;
        let touchSurfaceY = event.changedTouches[0].clientY - topOffset;

        try {
            this.listeners.forEach((listener) => {
                const listenerCommand = listener.handleTouchEnd(touchSurfaceX, touchSurfaceY);
                if (listenerCommand) {
                    runtime.logger?.log(`generic listener button press: ${listener?.buttonType}`);
                    this.nextCommand = listenerCommand;
                }

                if (listener.stopPropagation(touchSurfaceX, touchSurfaceY))
                    throw 'stop propagation';
            });
        } catch {}
    }

    _handleClick(event, end = false) {
        let leftOffset = document.getElementById('game-surface').getBoundingClientRect().left;
        let topOffset = document.getElementById('game-surface').getBoundingClientRect().top;
        let touchSurfaceX = event.clientX - leftOffset;
        let touchSurfaceY = event.clientY - topOffset;

        try {
            this.listeners.forEach((listener) => {
                runtime.logger.log(`generic listener click attempt: ${listener?.buttonType}`);

                const listenerCommand = end
                    ? listener.handleTouchEnd(touchSurfaceX, touchSurfaceY)
                    : listener.handleTouch(touchSurfaceX, touchSurfaceY);

                if (listenerCommand) {
                    runtime.logger?.log(`generic listener click: ${listener?.buttonType}`);
                    this.nextCommand = listenerCommand;
                }

                if (listener.stopPropagation(touchSurfaceX, touchSurfaceY))
                    throw 'stop propagation';
            });
        } catch {}
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

    handleKeyInput(code, { pressed }) {
        if (code === this.keyCode && runtime.isObjectRegistered(this)) {
            return () => this.onPress(this, { pressed });
        }
    }

    stopPropagation(x, y) {
        return false;
    }

    handleTouch(x, y) {
        if (distanceBetween(x, y, this) < this.getClickDistance())
            return () => this.onPress(this,  {pressed: true});
    }

    handleTouchEnd(x, y) {
        if (distanceBetween(x, y, this) < this.getClickDistance())
            return () => this.onPress(this,  {pressed: false});
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