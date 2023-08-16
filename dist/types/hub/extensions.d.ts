interface String {
    trimHttpProtocol(): string;
    appendIsolatedRoute(): string;
    prependIsolatedRoute(): string;
    trimIsolatedRoute(): string;
}
declare const getIsolatedRoute: () => string;
