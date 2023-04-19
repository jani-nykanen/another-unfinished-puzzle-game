import { AudioSample } from "./sample.js";


export interface AudioPlayer {


    playSample(sample : AudioSample | undefined, vol? : number) : void;

    playMusic(sample : AudioSample | undefined, vol? : number) : void;
    fadeInMusic(sample : AudioSample | undefined, vol? : number, fadeTime? : number) : void;
    pauseMusic() : void;
    resumeMusic() : boolean;
    stopMusic() : void;

    toggle(state? : boolean) : boolean;

    setGlobalVolume(vol : number) : void;
    isEnabled() : boolean;

    getStateString() : string;
}

