import { runtime } from "../../retrokit/core.js";
import { DynamicImageButton } from "../../retrokit/io/button.js";

export class TouchHalfScreenButton extends DynamicImageButton {
    constructor({
                    onLeftDown,
                    onRightDown,
                    onUp,
                    onDoubleTap,

                    doubleTapMs = 260,
                    doubleTapMaxMovePx = 20,

                    releaseAfterSteps = 1,
                } = {}) {
        super(
            runtime.settings.SURFACE_WIDTH / 2,
            runtime.settings.SURFACE_HEIGHT / 2,
            () => {},        // unused (we override handleTouchEnd)
            () => {},        // unused (we override handleMouseMove if needed)
            "",              // no key binding
            runtime.settings.SURFACE_WIDTH,
            runtime.settings.SURFACE_HEIGHT
        );

        this.buttonType = "touch half screen button";
        this.gui = true; // input coords are in screen-space

        this.onLeftDown = onLeftDown || (() => {});
        this.onRightDown = onRightDown || (() => {});
        this.onUp = onUp || (() => {});
        this.onDoubleTap = onDoubleTap || (() => {});

        this.doubleTapMs = doubleTapMs;
        this.doubleTapMaxMovePx = doubleTapMaxMovePx;

        this.releaseAfterSteps = Math.max(0, releaseAfterSteps);

        this._lastTapAt = 0;
        this._lastTapX = null;
        this._lastTapY = null;

        this._releaseInSteps = 0;
    }

    on(event) {
        if (event === "updateViewport") {
            this.x = runtime.settings.SURFACE_WIDTH / 2;
            this.y = runtime.settings.SURFACE_HEIGHT / 2;
            this.width = runtime.settings.SURFACE_WIDTH;
            this.height = runtime.settings.SURFACE_HEIGHT;
        }
    }

    _isRightHalf(x) {
        return x >= runtime.settings.SURFACE_WIDTH / 2;
    }

    onDraw() {}

    _isDoubleTap(now, x, y) {
        if (!this._lastTapAt) return false;

        const dt = now - this._lastTapAt;
        if (dt > this.doubleTapMs) return false;

        if (this._lastTapX == null || this._lastTapY == null) return false;

        const dx = x - this._lastTapX;
        const dy = y - this._lastTapY;
        const dist = Math.hypot(dx, dy);

        return dist <= this.doubleTapMaxMovePx;
    }

    handleTouchEnd(x, y) {
        this.onUp();
        return super.handleTouchEnd(x, y);
    }

    handleTouch(x, y) {
        const now = Date.now();
        const isDouble = this._isDoubleTap(now, x, y);

        this._lastTapAt = now;
        this._lastTapX = x;
        this._lastTapY = y;

        if (this._isRightHalf(x)) {
            this.onRightDown();
        } else {
            this.onLeftDown();
        }

        if (isDouble) {
            this.onDoubleTap();
        }

        return () => {};
    }

    destroy() {
        super.destroy();
    }
}
