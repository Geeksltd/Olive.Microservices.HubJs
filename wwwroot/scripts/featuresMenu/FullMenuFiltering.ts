export default class FullMenuFiltering {
    public ShowHideItems(container: string = '.full-menu-container') {
        const $container = container ? $(container) : undefined;

        const divElements: any = $container.get(0).getElementsByTagName("div");
        for (let divElement of divElements) {
            if (this.hasChildren(divElement)) {
                this.SetChildrenLiElementsHidden(divElement, 2);
                divElement.hidden = !this.IsAnyChildVisible(divElement, 2);
            }
            else {
                const liElement: any = divElement.getElementsByTagName("ul")[0].getElementsByTagName("li")[0];
                const aElement = liElement.getElementsByTagName("a")[0];
                divElement.hidden = liElement.hidden = !this.IsSearchResult(aElement);
            }
        }
    }

    private IsSearchResult(aElement: any) {
        const search = $('#InstantSearch').val();
        const keywords = search.toUpperCase().split(" ");
        return keywords.every(v => aElement.id.toUpperCase().includes(v));
    }

    private hasChildren(item: any) {
        return item && item.getElementsByTagName("ul")[0] && item.getElementsByTagName("ul")[0].getElementsByTagName("li").length > 0;
    }

    private SetChildrenLiElementsHidden(element: any, checkingLevel: number) {
        const liElements: any = element.getElementsByTagName("ul")[0].children;
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

    private IsAnyChildVisible(element: any, checkingLevel: number) {
        const liElements: any = element.getElementsByTagName("ul")[0].children;
        for (let liElement of liElements) {
            if (!liElement.hidden)
                return true;
            else if (checkingLevel > 1 && this.hasChildren(liElement) && this.IsAnyChildVisible(liElement, checkingLevel - 1))
                return true;
        }
        return false;
    }
}

$('#InstantSearch').keyup(function () {
    new FullMenuFiltering().ShowHideItems();
});