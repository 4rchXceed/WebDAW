// Utils class for creating a fake container, used in a Web Worker, so we are still able to use the make_screenshot() function of the screen adapter, which requires an HTML element to work.


// So we can get imageData everywhere

export const datas = {
    postMessage: null,
    datas: {
        dataURL: "",
    }
}

export class FakeDivElement {
    constructor(parent = null) {
        this.parentNode = parent;
        if (parent) {
            parent.registerChild(this);
        }
        this.children = [];
        this.childNodes = this.children;
    }


    registerChild(child) {
        this.children.push(child);
    }

    getElementByTagName(_) {
        return new FakeDivElement(this); // Return another FakeDivElement for nested divs
    }
    getContext() {
        return {
            fillRect: () => { },
            clearRect: () => { },
            // getImageData: () => ({}), // Return the stored image data or a default blank image
            putImageData: (imageData, x, y, dx, dy, b_w, b_h) => {
                // if (!datas.screen || datas.screen.length !== imageData.data.length) {
                //     datas.screen = new Uint8ClampedArray(imageData.width * imageData.height * 4); // RGBA
                //     datas.s_w = imageData.width;
                //     datas.s_h = imageData.height;
                // }
                // const pixelCount = b_w * b_h * 4;
                // for (let idx = 0; idx < pixelCount; idx += 4) {
                //     const pixelIndex = idx / 4;
                //     const i = Math.floor(pixelIndex / b_w);
                //     const j = pixelIndex % b_w;
                //     const destIndex = ((y + i) * datas.s_w + (x + j)) * 4;
                //     const srcIndex = idx;
                //     if (destIndex + 3 < datas.screen.length && srcIndex + 3 < imageData.data.length) {
                //         datas.screen[destIndex] = imageData.data[srcIndex]; // R
                //         datas.screen[destIndex + 1] = imageData.data[srcIndex + 1]; // G
                //         datas.screen[destIndex + 2] = imageData.data[srcIndex + 2]; // B
                //         datas.screen[destIndex + 3] = imageData.data[srcIndex + 3]; // A
                //     }
                // }
                postMessage({ type: "imageData", data: { imageData, x, y, dx, dy, b_w, b_h } });
            },
        };
    }


    toDataURL() {
        return datas.dataURL;
    }

    getBoundingClientRect() {
        return {
            left: 0,
            top: 0,
            width: 100,
            height: 100
        };
    }

    getElementsByTagName(_) {
        return [
            new FakeDivElement(this)
        ];
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parentNode = null;
        }
    }

    appendChild(e) {
        this.children.push(e);
        e.parentNode = this;
    }

    replaceChild(newChild, oldChild) {
        newChild.parentNode = this;
        const index = this.children.indexOf(oldChild);
        if (index !== -1) {
            this.children[index] = newChild;
        } else {
            this.children.push(newChild); // If oldChild is not found, just add the new child
        }
    }


    style = {
        display: "",
    };
    offsetLeft = 0;
    offsetTop = 0;
    offsetWidth = 0;
    offsetHeight = 0;
    classList = {
        add() { },
        remove() { },
        contains() { return false; }
    }
}

export class FakeDocument {
    createElement() {
        return new FakeDivElement();
    }
}
