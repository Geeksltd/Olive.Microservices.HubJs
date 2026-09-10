/// <amd-dependency path='app/extensions' />
export default class Service {

    private static Services: Service[] = [];

    Name: string;
    BaseUrl: string;
    AddressBarPrefix: string;
    public static PriorServiceName: string;
    public static PriorServiceUrl: string;
    public static FirstPageLoad: boolean = true;

    // "Repositories" for a page of the repositories service, and so on. Kept because a view
    // change inside a page re-titles the window from the page alone, with no address to say
    // which service that page belongs to.
    private static WindowTitleService: string = "";

    public GetAddressBarValueFor(fullFeatureUrl: string): string {
        let relativePath = fullFeatureUrl.trimStart(this.BaseUrl);

        if (relativePath.startsWith("/under") || relativePath.startsWith("/hub")) {
            return relativePath.trim();
        }

        return this.AddressBarPrefix.trimEnd("/") + "/" + relativePath.trimStart("/");
    }

    constructor(args: Service) {
        if (args) {
            this.BaseUrl = args.BaseUrl;
            this.Name = args.Name;
            this.AddressBarPrefix = this.Name.toLowerCase().withPrefix("/");
        }

        if (!this.BaseUrl)
            throw new Error("BaseUrl cannot be undefined");

        if (!this.Name)
            throw new Error("Name cannot be undefined");
    }

    public static registerServices(): void {
        let services = window["services"];
        if (services === undefined) return

        for (var serviceInfo of services) {
            this.Services.push(new Service(serviceInfo));
        }
    }

    public static onNavigated(fullUrl: string, windowTitle: string): void {
        let service = this.fromUrl(fullUrl);

        var url = service.GetAddressBarValueFor(fullUrl);

        var ajaxTarget = document.activeElement.getAttribute("ajax-target");
        var ajaxhref = document.activeElement.getAttribute("href");

        //if (ajaxTarget == undefined || ajaxhref == undefined) {
        //    const documentUrl = document.URL;
        //    if (documentUrl != undefined && documentUrl != null) {
        //        if (documentUrl.contains("?$")) {
        //            var ajaxTarget = documentUrl.substring(documentUrl.indexOf("$") + 1, documentUrl.indexOf("="));
        //            var ajaxhref = documentUrl.substring(documentUrl.indexOf("=") + 1);
        //        }
        //    }
        //}

        //if (!this.FirstPageLoad)
        if (ajaxTarget == undefined || ajaxhref == undefined)
            window.history.pushState(null, windowTitle, url);

        if (this.FirstPageLoad)
            this.FirstPageLoad = false;

        this.setWindowTitle(fullUrl, windowTitle);
    }

    // The window title for a page of a service, named the way every other page in the hub
    // names it. Split out of onNavigated because the first load of a service page has no
    // address to push - the browser is already on it - but still needs its title.
    public static setWindowTitle(fullUrl: string, windowTitle: string): void {
        // fromUrl throws for an address that belongs to no registered service. A window title
        // is not worth failing a page load over, so fall back to the title on its own.
        try { this.WindowTitleService = this.fromUrl(fullUrl).Name; }
        catch (e) { this.WindowTitleService = ""; }

        this.applyWindowTitle(windowTitle);
    }

    // Titles a window from a page that carries no address of its own - a module reloaded in
    // place, a modal - putting the service the page belongs to at the head of the trail the title
    // already reads as, so that one hub tab can be told from another. Most service titles open
    // with their own service ("OpenAI > some page"), and those are left alone rather than saying
    // it twice. A page that declares no title still replaced the one before it, so the window
    // falls back to the service alone rather than going on naming a page the user can no longer see.
    public static applyWindowTitle(windowTitle: string): void {
        if (!windowTitle) { document.title = this.WindowTitleService; return; }

        document.title = this.leadsWithService(windowTitle)
            ? windowTitle
            : this.WindowTitleService + " > " + windowTitle;
    }

    // Whether the title already opens with the service the page belongs to. Only the head of the
    // title counts: a title is a trail read left to right, so a service named further along it
    // ("Search results > People") is part of what the page is about rather than a statement of
    // where the page lives, and the trail still wants its root. The name has to end on a word
    // boundary, because a short one is otherwise found at the head of a longer word - "AI" opens
    // "Airports" - and would suppress a prefix the title actually needed. A title for no known
    // service is treated as leading with it, there being nothing to put in front of it.
    private static leadsWithService(windowTitle: string): boolean {
        if (!this.WindowTitleService) return true;

        const title = windowTitle.toLowerCase();
        const name = this.WindowTitleService.toLowerCase();

        if (title.indexOf(name) !== 0) return false;

        const after = title[name.length];
        return !after || !/[a-z0-9]/.test(after);
    }

    public static fromUrl(actualDestinationAddress: string): Service {

        for (var service of this.Services) {
            if (actualDestinationAddress.trimHttpProtocol().startsWith(service.BaseUrl.trimHttpProtocol()))
                return service;
        }

        throw new Error("Could not find a service for [" + actualDestinationAddress + "] url");
    }

    public static fromName(name: string): Service {
        
        name = name.toLowerCase();
        for (var service of this.Services) {
            if (name === service.Name.toLowerCase()) return service;
        }

        throw new Error("Could not find a service named '" + name + "'");
    }
}