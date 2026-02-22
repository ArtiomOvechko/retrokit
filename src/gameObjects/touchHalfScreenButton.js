import { runtime, GameObject } from "../../retrokit/core.js";

export class TouchHalfScreenButton extends GameObject {
    constructor({
                    onLeftDown,
                    onRightDown,
                    onUp,
                    onDoubleTap,

                    // double-tap config
                    doubleTapMs = 260,
                    doubleTapMaxMovePx = 20,

                    // if true: uses pointer events if available (recommended)
                    usePointerEvents = true,
                } = {}) {
        super(null);

        this.buttonType = "touch half screen button";

        this.onLeftDown = onLeftDown || (() => {});
        this.onRightDown = onRightDown || (() => {});
        this.onUp = onUp || (() => {});
        this.onDoubleTap = onDoubleTap || (() => {});

        this.doubleTapMs = doubleTapMs;
        this.doubleTapMaxMovePx = doubleTapMaxMovePx;

        this._lastTapAt = 0;
        this._lastTapX = null;
        this._lastTapY = null;

        this._isDown = false;
        this._downSide = null; // "left" | "right"

        this._boundDown = (e) => this._handleDown(e);
        this._boundUp = (e) => this._handleUp(e);
        this._boundCancel = (e) => this._handleUp(e);

        this._bind(usePointerEvents);
    }

    _bind(usePointerEvents) {
        const canvas = document.getElementById("game-surface");
        if (!canvas) return;

        this._canvas = canvas;

        if (usePointerEvents && "onpointerdown" in window) {
            canvas.addEventListener("pointerdown", this._boundDown, { passive: false });
            window.addEventListener("pointerup", this._boundUp, { passive: false });
            window.addEventListener("pointercancel", this._boundCancel, { passive: false });

            this._unbind = () => {
                canvas.removeEventListener("pointerdown", this._boundDown);
                window.removeEventListener("pointerup", this._boundUp);
                window.removeEventListener("pointercancel", this._boundCancel);
            };
            return;
        }

        // fallback: touch + mouse
        canvas.addEventListener("touchstart", this._boundDown, { passive: false });
        window.addEventListener("touchend", this._boundUp, { passive: false });
        window.addEventListener("touchcancel", this._boundCancel, { passive: false });

        canvas.addEventListener("mousedown", this._boundDown, { passive: false });
        window.addEventListener("mouseup", this._boundUp, { passive: false });

        this._unbind = () => {
            canvas.removeEventListener("touchstart", this._boundDown);
            window.removeEventListener("touchend", this._boundUp);
            window.removeEventListener("touchcancel", this._boundCancel);

            canvas.removeEventListener("mousedown", this._boundDown);
            window.removeEventListener("mouseup", this._boundUp);
        };
    }

    _eventToCanvasXY(e) {
        const canvas = this._canvas || document.getElementById("game-surface");
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;

        if (e.changedTouches && e.changedTouches.length) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else if (e.touches && e.touches.length) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        return { x, y };
    }

    _isRightHalf(x) {
        // use runtime surface width (matches your existing logic)
        return x >= runtime.settings.SURFACE_WIDTH / 2;
    }

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

    _handleDown(e) {
        try { e.preventDefault(); } catch {}
        if (!runtime?.isObjectRegistered?.(this)) return;

        const { x, y } = this._eventToCanvasXY(e);
        const now = Date.now();

        const isDouble = this._isDoubleTap(now, x, y);

        // record tap info
        this._lastTapAt = now;
        this._lastTapX = x;
        this._lastTapY = y;

        this._isDown = true;

        // Always handle movement on down (even for double tap)
        if (this._isRightHalf(x)) {
            this._downSide = "right";
            this.onRightDown();
        } else {
            this._downSide = "left";
            this.onLeftDown();
        }

        // Additionally fire jump on double tap
        if (isDouble) {
            this.onDoubleTap();
        }
    }


    _handleUp(e) {
        try { e.preventDefault(); } catch {}

        if (!runtime?.isObjectRegistered?.(this)) return;
        if (!this._isDown) return;

        this._isDown = false;
        this._downSide = null;

        this.onUp();
    }

    destroy() {
        super.destroy();
        try { this._unbind?.(); } catch {}
    }
}
