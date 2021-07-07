// @flow

declare class process {
    static env: {
        PORT: string,
        NODE_ENV: string,
        PLATFORM_ORIGIN_URL: string,
        STREAMR_API_URL: string,
        STREAMR_URL: string,
        STREAMR_WS_URL: string,
        GOOGLE_ANALYTICS_ID: string,
        THE_GRAPH_API_URL: string,
        [key: string]: ?string
    }
}
