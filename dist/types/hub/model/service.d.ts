/// <amd-dependency path="app/extensions" />
export default class Service {
    private static Services;
    Name: string;
    BaseUrl: string;
    AddressBarPrefix: string;
    static PriorServiceName: string;
    static PriorServiceUrl: string;
    static FirstPageLoad: boolean;
    private static WindowTitleService;
    GetAddressBarValueFor(fullFeatureUrl: string): string;
    constructor(args: Service);
    static registerServices(): void;
    static onNavigated(fullUrl: string, windowTitle: string): void;
    static setWindowTitle(fullUrl: string, windowTitle: string): void;
    static applyWindowTitle(windowTitle: string): void;
    static fromUrl(actualDestinationAddress: string): Service;
    static fromName(name: string): Service;
}
