import { InstrumentBase } from "../InstrumentBase.js";

export class NoneInstrument extends InstrumentBase {
    constructor() {
        super();
        this.hasUI = false;
        this.instrumentId = "none-25036";
    }

    init() { }
    play() { }
    genHtml(htmlElement) {
        super.genHtml(htmlElement);
    }
    tearDown() {
        super.tearDown();
    }
}
