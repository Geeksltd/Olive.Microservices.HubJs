export default class HubSettings {

    public static get supportEmail(): string {
        return window["supportEmail"] || "";
    }
}
