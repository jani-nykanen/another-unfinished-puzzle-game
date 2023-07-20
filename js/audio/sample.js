import { clamp } from "../math/utility.js";
export class AudioSample {
    constructor(ctx, data) {
        this.activeBuffer = null;
        this.startTime = 0.0;
        this.pauseTime = 0.0;
        this.playVol = 0.0;
        this.loop = false;
        this.data = data;
        this.gain = ctx.createGain();
    }
    play(ctx, vol = 1.0, loop = false, startTime = 0.0) {
        this.fadeIn(ctx, vol, vol, loop, startTime, 0);
    }
    fadeIn(ctx, initial, end, loop = false, startTime = 0, fadeTime = 0) {
        if (this.activeBuffer != null) {
            this.activeBuffer.disconnect();
            this.activeBuffer = null;
        }
        let bufferSource = ctx.createBufferSource();
        bufferSource.buffer = this.data;
        bufferSource.loop = Boolean(loop);
        initial = clamp(initial, 0.0, 1.0);
        end = clamp(end, 0.0, 1.0);
        this.gain.gain.setValueAtTime(initial, startTime);
        this.startTime = ctx.currentTime - startTime;
        this.pauseTime = 0;
        this.playVol = end;
        this.loop = loop;
        bufferSource.connect(this.gain).connect(ctx.destination);
        bufferSource.start(0, startTime);
        if (fadeTime > 0) {
            this.gain.gain.exponentialRampToValueAtTime(end, startTime + fadeTime / 1000.0);
        }
        this.activeBuffer = bufferSource;
    }
    stop() {
        if (this.activeBuffer == null)
            return;
        this.activeBuffer.disconnect();
        this.activeBuffer.stop();
        this.activeBuffer = null;
    }
    pause(ctx) {
        if (this.activeBuffer == null)
            return;
        this.pauseTime = ctx.currentTime - this.startTime;
        this.stop();
    }
    resume(ctx) {
        this.play(ctx, this.playVol, this.loop, this.pauseTime);
    }
}
