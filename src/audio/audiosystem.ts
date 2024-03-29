import { AudioPlayer } from "./audioplayer.js";
import { AudioSample } from "./sample.js";


export class AudioSystem implements AudioPlayer {


    protected ctx : AudioContext;
    private musicTrack : AudioSample | undefined = undefined;

    private globalVolume : number;
    private enabled : boolean = false;


    constructor(globalVolume = 1.0) {

        this.ctx = new AudioContext();
        this.globalVolume = globalVolume;
    }


    public playSample(sample : AudioSample | undefined, vol = 1.0) : void {

        const EPS = 0.001;

        if (!this.enabled || sample == undefined || this.globalVolume*vol <= EPS) return;

        sample.play(this.ctx, this.globalVolume*vol, false, 0);
    }


    public playMusic(sample : AudioSample | undefined, vol = 1.0) : void {

        if (!this.enabled || sample == undefined) return;

        this.fadeInMusic(sample, vol, 0.0);
    }


    public fadeInMusic(sample : AudioSample | undefined, vol = 1.0, fadeTime = 0.0) {

        const EPS = 0.001;

        if (!this.enabled || this.globalVolume <= EPS) return;

        if (this.musicTrack != undefined) {

            this.musicTrack.stop();
            this.musicTrack = undefined;
        }

        let v = this.globalVolume*vol;
        sample?.fadeIn(this.ctx, fadeTime == null ? v : 0.01, v, true, 0, fadeTime);
        this.musicTrack = sample;
    }


    public pauseMusic() : void {

        if (!this.enabled || this.musicTrack == undefined)
            return;

        this.musicTrack.pause(this.ctx);
    }


    public resumeMusic() : boolean {

        if (!this.enabled || this.musicTrack == undefined)
            return false;

        this.musicTrack.resume(this.ctx);
        
        return true;
    }


    public stopMusic() : void {

        if (!this.enabled || this.musicTrack == undefined)
            return;

        this.musicTrack.stop();
        this.musicTrack = undefined;
    }


    public toggle(state = !this.enabled) : boolean {

        return (this.enabled = state);
    }


    public setGlobalVolume(vol : number) : void {

        this.globalVolume = vol;
    }


    public isEnabled = () : boolean => this.enabled;


    public getStateString = () : string => "Audio: " + ["Off", "On"][Number(this.enabled)]; 


    /**
     * Decodes the given sample data and constructs an audio sample of ti
     * @param sampleData Sample data in array buffer format
     * @param callback Called when the decoding is finished
     */
    public decodeSample(sampleData : ArrayBuffer, callback : (s : AudioSample) => any) : void {

        this.ctx.decodeAudioData(sampleData, (data : AudioBuffer) => {
                    
            callback(new AudioSample(this.ctx, data));
        });
    }

}
