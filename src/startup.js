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
        misc: {
            heart: new Sprite('./sprites/heart.png', 16, 16, 4, 6),
            emilText: new Sprite('./sprites/emil-text.png', 204 , 33, 1, 1),
            buttonToLearnMore: new Sprite('./sprites/button-learn-more.png', 148 , 27, 1, 1),
            buttonToLearnThenSome: new Sprite('./sprites/button-learn-then-some.png', 148 , 27, 1, 1),
        },
        yuliia: {
            idle: new Sprite('./sprites/yuliia-idle.png', 32, 48, 6, 5),
        },
        artem: {
            idle: new Sprite('./sprites/artem-idle.png', 32, 48, 6, 4),
        },
        emil: {
            idle: new Sprite('./sprites/emil-idle.png', 32, 32, 6, 4),
            walking: new Sprite('./sprites/emil-walking.png', 32, 32, 6, 4),
        },
        princess: { // A sample sprite, feel free to define your own nesting structure
            walking: new Sprite('./sprites/princess.png', 15, 15, 10, 2),
            jumping: new Sprite('./sprites/princess_left_jumping.png', 15, 15, 1, 1),
        }, tiles: {
            square: new Sprite('./sprites/square-tile.png', 1, 1, 1, 1),
        }, banners: {
            firstProject: new Sprite('./sprites/first-job-projects.png', 122, 72, 1, 1),
            guidePc: new Sprite('./sprites/guide_pc.png', 296, 144, 1, 1),
            guideTouch: new Sprite('./sprites/guide_touch.png', 296, 144, 1, 1),
            itsMe: new Sprite('./sprites/itsme.png', 296, 159, 1, 1),
            aws: new Sprite('./sprites/aws.png', 296, 144, 1, 1),
            ideals: new Sprite('./sprites/ideals.png', 296, 144, 1, 1),
            retrogotchi: new Sprite('./sprites/retrogotchi.png', 549, 228, 16, 2),
            font: new Sprite('./sprites/font.png', 296, 144, 1, 1),
            votum: new Sprite('./sprites/votum.png', 294, 144, 1, 1),
            purolator: new Sprite('./sprites/purolator.png', 148, 72, 1, 1),
            princessventure: new Sprite('./sprites/princessventure.png', 448, 340, 1, 1),
            goodlang: new Sprite('./sprites/gl.png', 294, 144, 1, 1),
            retrokit: new Sprite('./sprites/retrokit.png', 294, 172, 1, 1),
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