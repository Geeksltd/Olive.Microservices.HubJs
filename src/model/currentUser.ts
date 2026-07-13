export default class CurrentUser {

    public static get isEmployee(): boolean {
        return window["isEmployee"] === true;
    }
}
