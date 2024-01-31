import Url from "olive/components/url";
export default class HubUrl extends Url {
    goBack: (target: any) => void;
    effectiveUrlProvider: (url: string, trigger?: JQuery) => string;
}
