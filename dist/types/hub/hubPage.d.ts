/// <reference path="../olive.mvc/typings-lib/jquery/jquery.d.ts" />
/// <reference path="../olive.mvc/typings-lib/moment/moment-node.d.ts" />
import OlivePage from 'olive/olivePage';
import { ServiceContainer } from 'olive/di/serviceContainer';
import BoardComponents from './boardComponents';
import 'jquery';
import 'jquery-ui-all';
import 'jquery-validate';
import 'jquery-validate-unobtrusive';
import 'underscore';
import 'alertify';
import 'smartmenus';
import 'file-upload';
import 'jquery-typeahead';
import 'combodate';
import 'js-cookie';
import 'handlebars';
import 'hammerjs';
import 'jquery-mentions';
import 'chosen';
import 'jquery-elastic';
import 'jquery-events-input';
import 'popper';
import 'bootstrap';
import 'validation-style';
import 'file-style';
import 'spinedit';
import 'password-strength';
import 'slider';
import 'moment';
import 'moment-locale';
import 'datepicker';
import 'bootstrapToggle';
import 'bootstrap-select';
import 'flickity';
export default class HubPage extends OlivePage {
    static IsFirstPageLoad: boolean;
    board: BoardComponents;
    constructor();
    configureServices(services: ServiceContainer): void;
    revive(): void;
    getPathName(): {
        pathname: string;
        pathnameWithBrackets: string;
        pathnameWithoutHub: string;
    };
    initialize(): void;
}
