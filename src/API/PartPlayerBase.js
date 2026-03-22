/**
 * Base class for part player plugins.
 * This plugin will be responsible for playing the part data when the play button is pressed.
 * This is typically used alongside a view that allows the user to edit the part data or an instrument's settings
 * The plugin should be able to be instantiated multiple times (at the same time) for different parts. So do not store any part-specific data in a static way, but rather in the instance of the plugin.
 */
export class PartPlayerBase {
    constructor() {
        this.dataType = "raw"; // The type of the data that this plugin can play. This should be set by the subclass, and it should match the dataType that the view sets when calling app__setSelectedPartData. This way, the plugin will know which data it can play.
        this.isPlaying = false; // Whether the plugin is currently playing a part
        this.currentDatas = null; // The data of the currently playing part
    }

    /**
     * !! CALL super.startPlaying(datas) IF YOU OVERRIDE THIS METHOD IN YOUR PLUGIN, OTHERWISE THE PLAYING STATE WON'T BE UPDATED CORRECTLY !!
     * This is called whenever the playback arrives to the start of a part that this plugin is responsible for playing.
     * !! You shouldn't start any async playing work here (no setInterval, ...) you will use the update() method for that. Don't override this method if you don't need to do anything when the part starts playing !!
     * This will be called only once.
     * @param {any} datas The datas of the part that is being played.
     * @param {object} instrument The instrument that this part belongs to. This is useful if the plugin needs to access the instrument's settings or other parts of the instrument.
     */
    startPlaying(datas, instrumentId) {
        this.isPlaying = true;
        this.currentDatas = datas;
    }

    /**
     * This is called periodically during playback to update the plugin's state. (The frequency of the updates is determined by the application, and it might not be consistent, so don't rely on it being called at a specific interval)
     * @param {number} currentTime The current time in the playback IN MS. !! Relative to the start of the part !! So if the part starts at 10 seconds, and the current time is 12 seconds, this parameter will be 2 seconds.
     * @param {number} currentBeat The current beat in the playback. (Same as currentTime, it's relative to the start of the part)
     * For now, we only support 4/4 time signature. This means that if you need to convert the currentBeat to bars, you can use the formula: currentBar = Math.floor(currentBeat / 4)
     */
    update(currentTime, currentBeat) {
    }

    /**
     * !! CALL super.stopPlaying() IF YOU OVERRIDE THIS METHOD IN YOUR PLUGIN, OTHERWISE THE PLAYING STATE WON'T BE UPDATED CORRECTLY !!
     * This is called whenever the playback arrives to the end of a part that this plugin is responsible for playing.
     */
    stopPlaying() {
        this.isPlaying = false;
        this.currentDatas = null;
    }
}