define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    class FullMenuFiltering {
        ShowHideItems(container = '.full-menu-container') {
            const $container = container ? $(container) : undefined;
            const divElements = $container.get(0).getElementsByTagName("div");
            for (let divElement of divElements) {
                if (this.hasChildren(divElement)) {
                    this.SetChildrenLiElementsHidden(divElement, 2);
                    divElement.hidden = !this.IsAnyChildVisible(divElement, 2);
                }
                else {
                    const liElement = divElement.getElementsByTagName("ul")[0].getElementsByTagName("li")[0];
                    const aElement = liElement.getElementsByTagName("a")[0];
                    divElement.hidden = liElement.hidden = !this.IsSearchResult(aElement);
                }
            }
        }
        IsSearchResult(aElement) {
            const search = $('#InstantSearch').val();
            const keywords = search.toUpperCase().split(" ");
            return keywords.every(v => aElement.id.toUpperCase().includes(v));
        }
        hasChildren(item) {
            return item && item.getElementsByTagName("ul")[0] && item.getElementsByTagName("ul")[0].getElementsByTagName("li").length > 0;
        }
        SetChildrenLiElementsHidden(element, checkingLevel) {
            const liElements = element.getElementsByTagName("ul")[0].children;
            for (let liElement of liElements) {
                const aElement = liElement.getElementsByTagName("a")[0];
                if (checkingLevel == 1 || !this.hasChildren(liElement)) {
                    liElement.hidden = !this.IsSearchResult(aElement);
                }
                else if (checkingLevel > 1 && this.hasChildren(liElement)) {
                    this.SetChildrenLiElementsHidden(liElement, checkingLevel - 1);
                    liElement.hidden = !this.IsSearchResult(aElement) && !this.IsAnyChildVisible(liElement, checkingLevel - 1);
                }
            }
        }
        IsAnyChildVisible(element, checkingLevel) {
            const liElements = element.getElementsByTagName("ul")[0].children;
            for (let liElement of liElements) {
                if (!liElement.hidden)
                    return true;
                else if (checkingLevel > 1 && this.hasChildren(liElement) && this.IsAnyChildVisible(liElement, checkingLevel - 1))
                    return true;
            }
            return false;
        }
    }
    exports.default = FullMenuFiltering;
    $('#InstantSearch').keyup(function () {
        new FullMenuFiltering().ShowHideItems();
    });
});
//# sourceMappingURL=fullMenuFiltering.js.map