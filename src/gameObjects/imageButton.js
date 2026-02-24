import { runtime } from "../../retrokit/core.js";
import { DynamicImageButton } from "../../retrokit/io/button.js";

export class ImageButton extends DynamicImageButton {
    constructor(x, y, sprite, onPress, onMouseMove, scale, keyCode) {
        super(x, y, sprite, onPress, onMouseMove, scale, keyCode);

        this.buttonType = "world image button";
        this.gui = false;
    }

    _screenToWorld(screenX, screenY) {
        const vp = runtime.scene?.viewport;
        if (!vp || !vp.scale) return { x: screenX, y: screenY };

        const halfW = Math.floor(vp.logicalWidth / 2);
        const halfH = Math.floor(vp.logicalHeight / 2);

        return {
            x: (screenX / vp.scale) - halfW + vp.cx,
            y: (screenY / vp.scale) - halfH + vp.cy,
        };
    }

    _pointToLocalPoint(screenX, screenY) {
        // Convert to the same coord space the button lives in
        return !this.gui ? this._screenToWorld(screenX, screenY) : { x: screenX, y: screenY };
    }

    _getBoundsAtCurrentState() {
        // Use the rendered rect (sprite size * scale). Fall back to 0 if no sprite.
        const fw = this.sprite?.frameWidth ?? 0;
        const fh = this.sprite?.frameHeight ?? 0;

        const w = fw * Math.abs(this.xScale);
        const h = fh * Math.abs(this.yScale);

        // Your drawSpriteCentered uses (x,y) as CENTER of the sprite
        const left = this.x - w / 2;
        const top = this.y - h / 2;

        return { left, top, right: left + w, bottom: top + h, w, h };
    }

    _isWithinBounds(screenX, screenY) {
        const p = this._pointToLocalPoint(screenX, screenY);
        const b = this._getBoundsAtCurrentState();

        // If sprite is missing, there is no clickable area
        if (b.w <= 0 || b.h <= 0) return false;

        // Inclusive bounds
        return (
            p.x >= b.left &&
            p.x <= b.right &&
            p.y >= b.top &&
            p.y <= b.bottom
        );
    }

    stopPropagation(screenX, screenY) {
        return this._isWithinBounds(screenX, screenY);
    }

    handleTouchEnd(screenX, screenY) {
        if (!runtime.isObjectRegistered(this)) return;

        if (this._isWithinBounds(screenX, screenY)) {
            // Do NOT call super; execute press directly (matches your request)
            return () => this.onPress(this, { pressed: false });
        }
    }

    handleMouseMove(screenX, screenY) {
        const isHover = this._isWithinBounds(screenX, screenY);

        if (isHover)
            runtime.scene.hoveredButton = this;

        if (runtime.scene.hoveredButton && runtime.scene.hoveredButton !== this)
            return;

        if (!runtime.scene.hoveredButton && !isHover)
            return;

        if (!isHover && runtime.scene.hoveredButton === this)
            runtime.scene.hoveredButton = null;

        const surface = document.getElementById("game-surface");
        if (surface) {
            surface.style.setProperty("cursor", isHover ? "pointer" : "default", "important");
        }

        // Keep parent behavior for mouse-move callback (if you use it)
        const p = this._pointToLocalPoint(screenX, screenY);
        return super.handleMouseMove(p.x, p.y);
    }
}
