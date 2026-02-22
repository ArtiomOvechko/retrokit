import Tile from "../gameObjects/tile.js";

export function buildSteppedStories(objects, startX, startY, {
    storyWidth = 128,
    storyRiseMin = 30,
    storyRiseMax = 40,

    wallHeight = 200,
    objLift = 60,

    traceInterval = 3,

    startWall = true,
    endWall = true,

    connectStories = true,

    // NEW: “3 segments” trace shape (exactly 2 bends):
    // 1) go right first by this many pixels from previous object
    traceRightAfterPrev = 30,
    // 2) then go up to the level of the next object
    // 3) then go right to the next object
} = {}) {
    const _objs = Array.isArray(objects) ? objects.filter(Boolean) : [];

    const solidTiles = [];
    const traceTiles = [];
    const placements = [];

    if (_objs.length === 0) {
        return { solidTiles, traceTiles, placements };
    }

    const randInt = (a, b) => {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        return lo + Math.floor(Math.random() * (hi - lo + 1));
    };

    const addHLine = (x0, y, width) => {
        for (let x = x0; x < x0 + width; x += 1) solidTiles.push(new Tile(x, y));
    };

    const addVLineUpSolid = (x, y0, height) => {
        for (let y = y0; y >= y0 - height; y -= 1) solidTiles.push(new Tile(x, y));
    };

    const addVConnectorBetweenFloors = (x, yA, yB) => {
        const from = Math.min(yA, yB);
        const to = Math.max(yA, yB);
        for (let y = from; y <= to; y += 1) solidTiles.push(new Tile(x, y));
    };

    const addTracePoint = (x, y) => {
        traceTiles.push(new Tile(x, y));
    };

    // dotted H segment, inclusive
    const addTraceH = (y, x1, x2) => {
        const dir = x2 >= x1 ? 1 : -1;
        const len = Math.abs(x2 - x1);
        for (let i = 0; i <= len; i++) {
            if (i % traceInterval !== 0) continue;
            addTracePoint(x1 + i * dir, y);
        }
    };

    // dotted V segment, inclusive
    const addTraceV = (x, y1, y2) => {
        const dir = y2 >= y1 ? 1 : -1;
        const len = Math.abs(y2 - y1);
        for (let i = 0; i <= len; i++) {
            if (i % traceInterval !== 0) continue;
            addTracePoint(x, y1 + i * dir);
        }
    };

    // EXACTLY 2 bends, required order:
    // 1) horizontal first (to the right)
    // 2) vertical (to next object's y level)
    // 3) horizontal (to next object)
    const addTraceHThenVThenH = (prevX, prevY, nextX, nextY) => {
        const midX = prevX + traceRightAfterPrev;

        // segment 1: right
        addTraceH(prevY, prevX, midX);

        // segment 2: up/down to nextY
        addTraceV(midX, prevY, nextY);

        // segment 3: right/left to nextX (usually right)
        addTraceH(nextY, midX, nextX);
    };

    let floorX = startX;
    let floorY = startY;

    let firstStoryLeftX = null;
    let firstStoryFloorY = null;

    let lastStoryRightX = null;
    let lastStoryFloorY = null;

    let prevObjCenter = null;

    for (let i = 0; i < _objs.length; i++) {
        const obj = _objs[i];

        // floor
        addHLine(floorX, floorY, storyWidth);

        if (i === 0) {
            firstStoryLeftX = floorX;
            firstStoryFloorY = floorY;
        }
        if (i === _objs.length - 1) {
            lastStoryRightX = floorX + storyWidth - 1;
            lastStoryFloorY = floorY;
        }

        // object placement
        const objX = floorX + Math.floor(storyWidth / 2);
        const objY = floorY - objLift;

        obj.x = objX;
        obj.y = objY;
        placements.push({ obj, x: objX, y: objY, storyIndex: i });

        // trace between objects (2 bends: H -> V -> H)
        if (prevObjCenter) {
            addTraceHThenVThenH(prevObjCenter.x, prevObjCenter.y, objX, objY);
        }
        prevObjCenter = { x: objX, y: objY };

        // advance + solid vertical connector between floors
        if (i < _objs.length - 1) {
            const nextFloorX = floorX + storyWidth;
            const nextFloorY = floorY - randInt(storyRiseMin, storyRiseMax);

            if (connectStories) {
                const seamX = floorX + storyWidth - 1;
                addVConnectorBetweenFloors(seamX, floorY, nextFloorY);
            }

            floorX = nextFloorX;
            floorY = nextFloorY;
        }
    }

    // start/end walls only
    if (startWall && firstStoryLeftX != null) {
        addVLineUpSolid(firstStoryLeftX, firstStoryFloorY, wallHeight);
    }
    if (endWall && lastStoryRightX != null) {
        addVLineUpSolid(lastStoryRightX, lastStoryFloorY, wallHeight);
    }

    return { solidTiles, traceTiles, placements };
}
