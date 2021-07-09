import { FeaturesMenuFactory } from "./featuresMenu/featuresMenu";
export default class ExpandCollapse {
    button: JQuery;
    panel: JQuery;
    key: string;
    cookies: any;
    featuresMenuFactory: FeaturesMenuFactory;
    constructor(button: JQuery, panelKey: string);
    static enableExpandCollapse(buttonSelector: string, panelSelector: string): void;
    isCollapsed(): boolean;
    initialize(): void;
    toggle(): void;
    apply(): void;
    applyIcon(): void;
    syncHubTopMenu(): void;
    syncHubFrame(): void;
}
