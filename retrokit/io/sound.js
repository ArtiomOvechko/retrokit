import {runtime} from "../core.js";

export class Sound {
    constructor(soundFilePath) {
        this.soundFilePath = soundFilePath;

        this.buffer = null;
        this.isLoaded = false;
    }

    async load() {
        if (this.isLoaded)
            return;

        runtime.logger.log(`loading sound: ${this.soundFilePath}`);

        try {
            await new Promise((resolve, reject) => {
                setTimeout(async ()=> {
                    if (!this.context) {
                        this.context = new AudioContext();
                    }
                    const request = new XMLHttpRequest();

                    request.open('GET', this.soundFilePath, true);
                    request.responseType = 'arraybuffer';

                    const timeout = setTimeout(() => {
                        runtime.logger.log(`sound loading timeout: ${this.soundFilePath}`)
                        reject();
                    },1000);

                    request.onload = ()=> {
                        clearTimeout(timeout);
                        this.context.decodeAudioData(request.response, (buffer) => {
                            this.buffer = buffer;
                            this.isLoaded = true;
                            resolve();
                        }, (err) => {
                            runtime.logger.log(err);
                            reject(err);
                        }).then(_ => {});
                    }
                    request.send();
                },100);
            });
        } catch (ex) {
            this.onSoundFailed(ex);
        }
    }

    onSoundFailed(reason) {
        runtime.logger.log(`${this.soundFilePath}: Sound failed. Reason: ${reason}`);
    }

    async play() {
        try {
            await this.load();

            const source = this.context.createBufferSource(); // creates a sound source
            source.buffer = this.buffer;                    // tell the source which sound to play
            source.connect(this.context.destination);       // connect the source to the context's destination (the speakers)
            source.start(0);                          // play the source now

            runtime.logger.log('sound played');
        } catch (ex) {
            this.onSoundFailed(ex);
        }
    }
}