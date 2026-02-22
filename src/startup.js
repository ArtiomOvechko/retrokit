import {InitGame, runtime, Sprite} from "../retrokit/core.js";
import {GameScene} from "./scenes/gameScene.js";
import {InputHandler} from "../retrokit/io/button.js";
import {Sound} from "../retrokit/io/sound.js";

// This is the starting point of the game
await InitGame(async () => {
    // A boilerplate to init inputs handling like keyboard/mouse/screen event listeners
    runtime.inputHandler = new InputHandler();

    // This is how we define the first scene
    // Scenes serve the purpose of viewports and game objects aggregators
    // You may as well have a single scene for the whole game
    runtime.sceneFactory = () => new GameScene();

    // You may switch to another scene by simply calling:
    // .destroy() method of the scene
    // calling a constructor of any other scene anywhere

    // Define sprites and sound assets here to reuse them later anywhere (when using them by game objects)
    runtime.spritesDefinition = {
        princess: { // A sample sprite, feel free to define your own nesting structure
            walking: new Sprite('./sprites/princess.png', 15, 15, 10, 2),
            jumping: new Sprite('./sprites/princess_left_jumping.png', 15, 15, 1, 1),
        }, tiles: {
            square: new Sprite('./sprites/square-tile.png', 1, 1, 1, 1),
        }, banners: {
            firstProject: new Sprite('./sprites/first-job-projects.png', 122, 72, 1, 1),
            guidePc: new Sprite('./sprites/guide_pc.png', 296, 144, 1, 1),
            guideTouch: new Sprite('./sprites/guide_touch.png', 296, 144, 1, 1),
        }
    };

    // You must also include them in the sprites pool which will manage their loading
    runtime.sprites = [
        runtime.spritesDefinition.princess.walking,
    ];

    // For audio, simply add it here
    runtime.soundDefinition = {
        ambient: {
            burningDisco: new Sound('./audio/sound_ambient_burning_disco.wav'),
        }
    }
}, (settings) => {
    settings.GAME_STEP_SPEED = 20; // inverse of how fast the whole game is running (in ms, how often each game refresh happens)

    return settings;
});