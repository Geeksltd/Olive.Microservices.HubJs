export default class CurrentUser {

    public static get isEmployee(): boolean {
        return window["isEmployee"] === true;
    }

    // Set by the Hub website alongside isEmployee. Services on an older Hub do not set it, so every
    // caller has to cope with an empty string rather than assume there is an address to show.
    public static get email(): string {
        return window["userEmail"] || "";
    }
}
