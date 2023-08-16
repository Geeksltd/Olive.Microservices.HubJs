interface String {
    trimHttpProtocol(): string;
    appendIsolatedRoute(): string;
    prependIsolatedRoute(): string;
    trimIsolatedRoute(): string;
}

const getIsolatedRoute = function (): string {
    var isolatedRoute = window["isolatedRoute"];
    return isolatedRoute?.Path ?? '';
}

String.prototype.trimHttpProtocol = function (): string {
    return this.toLowerCase().trimStart("http://").trimStart("https://");
}

String.prototype.appendIsolatedRoute = function (): string {
    var isolatedRoute = getIsolatedRoute();

    if (!isolatedRoute) return this;
    if (this.contains(isolatedRoute)) return this;

    if (this.endsWith('/')) return this + isolatedRoute + '/';
    return this + '/' + isolatedRoute;
}

String.prototype.prependIsolatedRoute = function (): string {
    var isolatedRoute = getIsolatedRoute();

    if (!isolatedRoute) return this;
    if (this.contains(isolatedRoute)) return this;

    if (this.startsWith('/')) return '/' + isolatedRoute + this;
    return isolatedRoute + '/' + this;
};

String.prototype.trimIsolatedRoute = function (): string {
    var isolatedRoute = getIsolatedRoute();

    if (!isolatedRoute) return this;
    if (!this.contains(isolatedRoute)) return this;

    var startSign = this.startsWith('/');
    var endSign = this.endsWith('/');

    var result = this
        .replace("/" + isolatedRoute, "")
        .replace(isolatedRoute + "/", "")
        .replace(isolatedRoute, "");

    if (startSign && !result.startsWith('/')) result = "/" + result;
    if (!startSign && result.startsWith('/')) result = result.substring(1);
    if (endSign && !result.endsWith('/')) result = result.trimStart('/');
    if (!endSign && result.endsWith('/')) result = result.trimEnd('/');

    return result;
};
