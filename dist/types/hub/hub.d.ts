/// <amd-dependency path="olive/olivePage" />
import Url from "olive/components/url";
import AjaxRedirect from "olive/mvc/ajaxRedirect";
import ResponseProcessor from 'olive/mvc/responseProcessor';
import BreadcrumbMenu from "./featuresMenu/breadcrumbMenu";
import { FeaturesMenuFactory } from "./featuresMenu/featuresMenu";
export default class Hub implements IService {
    private url;
    private ajaxRedirect;
    private featuresMenuFactory;
    private breadcrumbMenu;
    private responseProcessor;
    constructor(url: Url, ajaxRedirect: AjaxRedirect, featuresMenuFactory: FeaturesMenuFactory, breadcrumbMenu: BreadcrumbMenu, responseProcessor: ResponseProcessor);
    decodeGzipUrl(inputUrl: string): string;
    initialize(): void;
    initRightTaskMenu(): void;
    loadBoarservice(): void;
    loadTimesheetsWidget(): void;
    handleChange(): void;
    loadServiceHealthChecks(): void;
    setViewFrameHeight(height: any): void;
    setiFrameHeight(height: number): void;
    go(url: string, iframe: boolean, trigger: any): void;
    initServiceWorker(): any;
}
