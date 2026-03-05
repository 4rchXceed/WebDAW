import ViewsIndex from "./ViewsIndex.js";

export class WindowManager {
    constructor(winContainer) {
        this.winContainer = winContainer;
    }

    openWindow(title, contentElement) {
        new WinBox(title, {
            root: this.winContainer,
            mount: contentElement,
        });
    }

    openVMView(viewName) {
        const viewClass = ViewsIndex[viewName];
        if (!viewClass) {
            window.error(false, `View ${viewName} not found`);
            return;
        }
        const viewElement = document.createElement("div");
        const view = new viewClass();
        view.genHtml(viewElement);
        view.registerEvents();
        this.openWindow(viewName, viewElement);
        window.webDaw.app__registerView(viewName, view);
    }
}