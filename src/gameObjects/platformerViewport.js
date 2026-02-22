import { Viewport } from "../../../retrokit/core.js";

// PlatformerViewport: smooth camera follow with bottom-ish anchor.
// FULL FIXES INCLUDED:
// 1) Grounded state is read LIVE each step (no stale _targetIsGrounded).
// 2) Handles "logicalWidth/Height not ready yet" (0) safely.
// 3) Adds optional "snap to target" for instant camera changes (useful when switching focus).
// 4) Adds optional maxSpeed clamp to avoid slow drifting / huge catch-up spikes.
// 5) Keeps cx/cy in world space (no screen-space rounding here).

export class PlatformerViewport extends Viewport {
    constructor({
                    vpWidth = null,
                    vpHeight = null,

                    // where the target should appear in logical viewport space
                    anchorX = 0.5,
                    anchorY = 0.72,

                    // follow tuning
                    followUp = 0.01,        // target goes up (jump)
                    followDown = 0.10,      // target goes down (fall)
                    followAfterLand = 0.25, // target is grounded (catch up nicely)

                    // dead zones (world pixels)
                    deadZoneY = 2,
                    deadZoneX = 0,

                    // max camera movement per step (world pixels); null = unlimited
                    maxSpeedX = null,
                    maxSpeedY = null,
                } = {}) {
        super({ vpWidth, vpHeight });

        this.anchorX = anchorX;
        this.anchorY = anchorY;

        this.followUp = followUp;
        this.followDown = followDown;
        this.followAfterLand = followAfterLand;

        this.deadZoneY = deadZoneY;
        this.deadZoneX = deadZoneX;

        this.maxSpeedX = maxSpeedX;
        this.maxSpeedY = maxSpeedY;

        this._target = null;

        // optional: additional offsets in world pixels
        this.offsetX = 0;
        this.offsetY = 0;
    }

    /**
     * Set follow target.
     * If you pass `snap: true`, camera will instantly jump to the anchored position.
     */
    follow(target, { snap = false } = {}) {
        this._target = target || null;
        if (snap && this._target) {
            const d = this._desiredCenterForTarget(this._target);
            if (d) {
                this.cx = d.cx;
                this.cy = d.cy;
            }
        }
    }

    _desiredCenterForTarget(t) {
        // If viewport isn't initialized yet (updateForScreen not called), do nothing.
        if (!Number.isFinite(this.logicalWidth) || !Number.isFinite(this.logicalHeight) || this.logicalWidth <= 0 || this.logicalHeight <= 0)
            return null;

        // Keep the same mapping as base Viewport.worldToScreen:
        // sx = scale * ((x - cx) + floor(logicalW/2))
        // We want the target to appear at logical position (logicalW*anchorX, logicalH*anchorY)
        // => (x - cx) + floor(logicalW/2) = logicalW*anchorX
        // => cx = x + floor(logicalW/2) - logicalW*anchorX
        const halfW = Math.floor(this.logicalWidth / 2);
        const halfH = Math.floor(this.logicalHeight / 2);

        const cx = (t.x + this.offsetX) + (halfW - this.logicalWidth * this.anchorX);
        const cy = (t.y + this.offsetY) + (halfH - this.logicalHeight * this.anchorY);

        return { cx, cy };
    }

    _clampDelta(d, maxAbs) {
        if (maxAbs == null) return d;
        if (!Number.isFinite(maxAbs) || maxAbs <= 0) return d;
        if (d > maxAbs) return maxAbs;
        if (d < -maxAbs) return -maxAbs;
        return d;
    }

    /**
     * Call every step to smoothly move camera towards target.
     * IMPORTANT: This does nothing if you never call follow(target).
     */
    step() {
        const t = this._target;
        if (!t) return;

        const desired = this._desiredCenterForTarget(t);
        if (!desired) return;

        const desiredCx = desired.cx;
        const desiredCy = desired.cy;

        // --- Y smoothing ---
        let dy = desiredCy - this.cy;
        const grounded = !!t?.onGround;

        // dead zone Y
        if (Math.abs(dy) <= this.deadZoneY) dy = 0;

        // pick smoothing constant
        const kY = grounded ? this.followAfterLand : (dy < 0 ? this.followUp : this.followDown);

        // apply smoothing (world space)
        let moveY = dy * kY;
        moveY = this._clampDelta(moveY, this.maxSpeedY);
        this.cy += moveY;

        // --- X smoothing (gentler) ---
        let dx = desiredCx - this.cx;

        if (Math.abs(dx) <= this.deadZoneX) dx = 0;

        // use a stable, gentle factor derived from Y factor
        const kX = Math.min(0.2, Math.max(0.05, kY));
        let moveX = dx * kX;
        moveX = this._clampDelta(moveX, this.maxSpeedX);
        this.cx += moveX;
    }

    // Keep base mapping (no rounding here; rounding belongs in draw pipeline)
    worldToScreen(x, y) {
        const sx = this.scale * ((x - this.cx) + Math.floor(this.logicalWidth / 2));
        const sy = this.scale * ((y - this.cy) + Math.floor(this.logicalHeight / 2));
        return { x: sx, y: sy };
    }
}
