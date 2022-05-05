/// <amd-dependency path="app/extensions" />
export default class Service {
    private static Services;
    Name: string;
    BaseUrl: string;
    AddressBarPrefix: string;
    static PriorServiceName: string;
    static PriorServiceUrl: string;
    static FirstPageLoad: boolean;
    GetAddressBarValueFor(fullFeatureUrl: string): string;
    constructor(args: Service);
    static registerServices(): void;
    static onNavigated(fullUrl: string, windowTitle: string): void;
    static fromUrl(actualDestinationAddress: string): Service;
    static fromName(name: string): Service;
}
