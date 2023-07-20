import { AudioSample } from "./sample.js";
export class AudioSystem {
    constructor(globalVolume = 1.0) {
        this.musicTrack = undefined;
        this.enabled = false;
        this.isEnabled = () => this.enabled;
        this.getStateString = () => "Audio: " + ["Off", "On"][Number(this.enabled)];
        this.ctx = new AudioContext();
        this.globalVolume = globalVolume;
    }
    playSample(sample, vol = 1.0) {
        const EPS = 0.001;
        if (!this.enabled || sample == undefined || this.globalVolume * vol <= EPS)
            return;
        sample.play(this.ctx, this.globalVolume * vol, false, 0);
    }
    playMusic(sample, vol = 1.0) {
        if (!this.enabled || sample == undefined)
            return;
        this.fadeInMusic(sample, vol, 0.0);
    }
    fadeInMusic(sample, vol = 1.0, fadeTime = 0.0) {
        const EPS = 0.001;
        if (!this.enabled || this.globalVolume <= EPS)
            return;
        if (this.musicTrack != undefined) {
            this.musicTrack.stop();
            this.musicTrack = undefined;
        }
        let v = this.globalVolume * vol;
        sample?.fadeIn(this.ctx, fadeTime == null ? v : 0.01, v, true, 0, fadeTime);
        this.musicTrack = sample;
    }
    pauseMusic() {
        if (!this.enabled || this.musicTrack == undefined)
            return;
        this.musicTrack.pause(this.ctx);
    }
    resumeMusic() {
        if (!this.enabled || this.musicTrack == undefined)
            return false;
        this.musicTrack.resume(this.ctx);
        return true;
    }
    stopMusic() {
        if (!this.enabled || this.musicTrack == undefined)
            return;
        this.musicTrack.stop();
        this.musicTrack = undefined;
    }
    toggle(state = !this.enabled) {
        return (this.enabled = state);
    }
    setGlobalVolume(vol) {
        this.globalVolume = vol;
    }
    /**
     * Decodes the given sample data and constructs an audio sample of ti
     * @param sampleData Sample data in array buffer format
     * @param callback Called when the decoding is finished
     */
    decodeSample(sampleData, callback) {
        this.ctx.decodeAudioData(sampleData, (data) => {
            callback(new AudioSample(this.ctx, data));
        });
    }
}
