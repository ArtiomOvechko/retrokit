import { GameObject, runtime } from "../../retrokit/core.js";

function spriteOrigin(sprite) {
    return {
        ox: Math.floor(sprite.frameWidth / 2),
        oy: Math.floor(sprite.frameHeight / 2),
    };
}

function aabbForObjectAt(obj, x, y) {
    const spr = obj.sprite;
    const { ox, oy } = spriteOrigin(spr);

    const sx = Math.abs(obj.xScale);
    const sy = Math.abs(obj.yScale);

    const w = spr.frameWidth * sx;
    const h = spr.frameHeight * sy;

    // origin-based (matches draw pivot logic)
    const left = x - ox * sx;
    const top = y - oy * sy;

    return {
        left,
        top,
        right: left + w,
        bottom: top + h,
        w,
        h,
        ox,
        oy,
        sx,
        sy
    };
}

export class Princess extends GameObject {
    constructor() {
        super(runtime.spritesDefinition.princess.walking);

        this.isMoving = false;
        this.speed = 1.5;

        // --- Jump / physics ---
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;

        // tune gravity in world-units per step^2
        this.gravity = 0.6;

        // Apex about 55px:
        // h = v^2 / (2g)  =>  v = sqrt(2*g*h)
        // sqrt(2 * 0.6 * 55) ~= 8.12
        this.jumpVelocity = 8.2;

        // keep 0 for flush contact; any padding creates visible gap
        this.hitPad = 0;
    }

    // --- Commands ---
    commandRight() {
        this.isMoving = true;
        this.xScale = -1 * Math.abs(this.xScale);
    }

    commandLeft() {
        this.isMoving = true;
        this.xScale = Math.abs(this.xScale);
    }

    commandStop() {
        this.isMoving = false;
    }

    commandJump() {
        if (!this.onGround) return;
        this.onGround = false;
        this.vy = -this.jumpVelocity;
    }

    // --- Helpers ---
    _getBlocks() {
        return runtime?.scene?.blocks ?? [];
    }

    _getAabbAt(nx, ny) {
        return aabbForObjectAt(this, nx, ny);
    }

    _getTileAabb(tile) {
        return aabbForObjectAt(tile, tile.x, tile.y);
    }

    _intersects(a, b) {
        return !(
            a.right <= b.left ||
            a.left >= b.right ||
            a.bottom <= b.top ||
            a.top >= b.bottom
        );
    }

    // --- Movement + collisions ---
    handleMovement() {
        if (this.isMoving) {
            this.vx = -this.xScale * this.speed;
            this.imageSpeed = 1;
        } else {
            this.vx = 0;
            this.imageSpeed = 0;
        }

        if (!this.onGround) {
            this.sprite = runtime.spritesDefinition.princess.jumping;
            return;
        }
        this.sprite = runtime.spritesDefinition.princess.walking;
    }

    applyPhysicsAndCollide() {
        const blocks = this._getBlocks();

        // gravity
        this.vy += this.gravity;

        // --- Horizontal step (origin-based resolution) ---
        let nx = this.x + this.vx;
        let ny = this.y;

        if (this.vx !== 0) {
            const me = this._getAabbAt(nx, ny);

            for (const t of blocks) {
                if (!t?.sprite) continue;

                const tb = this._getTileAabb(t);
                if (!this._intersects(me, tb)) continue;

                if (this.vx > 0) {
                    // moving right: my right touches tile left
                    // me.right = (nx - ox*sx) + w
                    // want me.right = tb.left
                    // nx = tb.left + ox*sx - w
                    const spr = this.sprite;
                    const sx = Math.abs(this.xScale);
                    const { ox } = spriteOrigin(spr);
                    const w = spr.frameWidth * sx;
                    nx = tb.left + ox * sx - w + this.hitPad;
                } else {
                    // moving left: my left touches tile right
                    // me.left = nx - ox*sx
                    // want me.left = tb.right
                    const spr = this.sprite;
                    const sx = Math.abs(this.xScale);
                    const { ox } = spriteOrigin(spr);
                    nx = tb.right + ox * sx - this.hitPad;
                }
                break;
            }
        }

        // --- Vertical step (origin-based resolution) ---
        ny = this.y + this.vy;
        this.onGround = false;

        if (this.vy !== 0) {
            const me = this._getAabbAt(nx, ny);

            for (const t of blocks) {
                if (!t?.sprite) continue;

                const tb = this._getTileAabb(t);
                if (!this._intersects(me, tb)) continue;

                if (this.vy > 0) {
                    const spr = this.sprite;
                    const sy = Math.abs(this.yScale);
                    const { oy } = spriteOrigin(spr);
                    const h = spr.frameHeight * sy;

                    const targetY = tb.top + oy * sy - h;

                    if (Math.abs(ny - targetY) <= 1) {
                        ny = targetY;
                    } else {
                        ny = targetY;
                    }

                    this.vy = 0;
                    this.onGround = true;
                } else {
                    // rising: my top touches tile bottom
                    const spr = this.sprite;
                    const sy = Math.abs(this.yScale);
                    const { oy } = spriteOrigin(spr);
                    ny = tb.bottom + oy * sy - this.hitPad;

                    this.vy = 0;
                }
                break;
            }
        }

        this.x = nx;
        this.y = ny;
    }

    onStep() {
        super.onStep();
        this.handleMovement();
        this.applyPhysicsAndCollide();
    }
}
