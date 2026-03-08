import PlayAudioStreamable from "../../VstWeb/src/PlayAudioStreamable.js";
import { EffectBase } from "../API/EffectBase.js";

/**
 * A Streamable that is used for audio effects processing.
 * This is a version of PlayAudioStreamable that is intended to be used as the output stream for audio effects processing.
 */
class EffectsAudioStreamable extends PlayAudioStreamable {
    constructor() {
        super();
    }
    async _decodeWav(wavArrayBuffer) {
        return new Promise((resolve, reject) => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(wavArrayBuffer, (audioBuffer) => {
                const channels = audioBuffer.numberOfChannels;
                const length = audioBuffer.length * channels;
                const sampleRate = audioBuffer.sampleRate;

                const interleaved = new Float32Array(length);
                for (let ch = 0; ch < channels; ch++) {
                    const channelData = audioBuffer.getChannelData(ch);
                    for (let i = 0; i < channelData.length; i++) {
                        interleaved[i * channels + ch] = channelData[i];
                    }
                }
                resolve(interleaved);
            }, (error) => {
                reject(error);
            });
        });
    }

    /**
     * Write a wav file (or any other audio format) to the stream. This will decode the wav file and then call write() with the decoded audio data.
     * @param {ArrayBuffer} wavArrayBuffer 
     * @param {number} volume 
     * @param {Array<EffectBase>} effects 
     */
    async writeWav(wavArrayBuffer, volume = 1.0, effects = []) {
        const audioBuffer = this._decodeWav(wavArrayBuffer);
        this.write(audioBuffer, volume, effects);
    }

    /**
     * Override the write method to bypass the scheduling logic. This won't call super().write().
     * @param {*} data - The audio data to write, can be a Blob, ArrayBuffer, or TypedArray.
     * @param {number} volume - The volume level to apply to the audio data (0.0 to 1.0).
     * @param {Array<EffectBase>} effects - An array of audio effects to apply to the audio data before writing.
     */
    async write(data, volume = 1.0, effects = []) {
        // window.webDaw.audioManager.bufferTime is globally set by the user and can be changed at any time, so we read it every time instead of caching it. 
        try {
            if (this.masterGain.gain.value !== volume) {
                this.masterGain.gain.value = volume;
            }
            if (this.audioContext.state === "suspended") {
                await this.audioContext.resume();
                if (this.debug) console.log("[VstWeb][audio] context resumed:", this.audioContext.state);
            }

            const audioData = await this._toFloat32Array(data);
            const frameCount = (audioData.length / this.channels) | 0;
            if (frameCount <= 0) return;

            const { peak, rms } = this._measureSignal(audioData);
            if (peak < 1e-5) this._dbgSilentChunks++;

            let audioBuffer = this.audioContext.createBuffer(
                this.channels,
                frameCount,
                this.streamSampleRate
            );

            for (let ch = 0; ch < this.channels; ch++) {
                const channelData = audioBuffer.getChannelData(ch);
                for (let i = 0; i < frameCount; i++) {
                    channelData[i] = audioData[i * this.channels + ch];
                }
            }

            const now = this.audioContext.currentTime;
            const chunkDuration = frameCount / this.streamSampleRate;

            let startAt = this.scheduledUntil || (now + window.webDaw.audioManager.bufferTime);
            const queued = startAt - now;

            if (queued < this.minQueuedSeconds) {
                if (this.scheduledUntil !== 0) {
                    console.warn(
                        `[VstWeb][audio] underrun recovery: queued=${(queued * 1000).toFixed(1)}ms -> reset to ${(window.webDaw.audioManager.bufferTime * 1000).toFixed(1)}ms`
                    );
                    this._dbgGaps++;
                }
                startAt = now + window.webDaw.audioManager.bufferTime;
            } else if (queued > this.maxQueuedSeconds) {
                console.warn(
                    `[VstWeb][audio] queue clamp: queued=${(queued * 1000).toFixed(1)}ms -> reset to ${(window.webDaw.audioManager.bufferTime * 1000).toFixed(1)}ms`
                );
                startAt = now + window.webDaw.audioManager.bufferTime;
            }

            for (const effect of effects) {
                audioBuffer = await effect.process(audioBuffer);
            }

            const src = this.audioContext.createBufferSource();
            src.buffer = audioBuffer;
            src.connect(this.masterGain);
            src.start(startAt);

            this.scheduledUntil = startAt + chunkDuration;
        } catch (err) {
            console.error("[VstWeb][audio] error processing audio chunk:", err);
        }
    }
}

export default EffectsAudioStreamable;