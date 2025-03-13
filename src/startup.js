import {InitGame, runtime} from "../retrokit/core.js";
import {InputHandler} from "../retrokit/io/button.js";
import {GameScene} from "./scenes/gameScene.js";

await InitGame(async () => {
    runtime.inputHandler = new InputHandler();
    runtime.sceneFactory = () => new GameScene();

    runtime.onResize = _ => {
        runtime.settings.SURFACE_HEIGHT = window.innerHeight;
        runtime.settings.SURFACE_WIDTH = window.innerWidth;
        runtime.canvas.width = runtime.settings.SURFACE_WIDTH;
        runtime.canvas.height = runtime.settings.SURFACE_HEIGHT;

        runtime.ctx = runtime.canvas.getContext("2d");
        runtime.ctx.imageSmoothingEnabled = false;
    }
});