// @flow

import { get } from '$shared/utils/api'
import type { ApiResult } from '$shared/flowtype/common-types'
import type { StreamId, StreamList } from '$shared/flowtype/stream-types'
import routes from '$routes'

export const getStreams = (params: Object): ApiResult<{
    streams: StreamList,
    hasMoreResults: boolean,
}> => {
    const nextParams = {
        uiChannel: false,
        operation: 'STREAM_SHARE',
        ...(params || {}),
    }

    if (nextParams.max) {
        // query 1 extra element to determine if we should show "load more" button
        nextParams.max += 1
    }

    return get({
        url: routes.api.streams.index({
            ...nextParams,
        }),
    })
        .then((streams) => ({
            streams: nextParams.max ? streams.splice(0, nextParams.max - 1) : streams,
            hasMoreResults: !!nextParams.max && streams.length > 0,
        }))
}

const STREAMS_PAGE_SIZE = 999

export async function* getPagedStreams(params: Object): any {
    let page = 0
    let hasMore = false

    do {
        // eslint-disable-next-line no-await-in-loop
        const { streams, hasMoreResults } = await getStreams({
            ...(params || {}),
            max: STREAMS_PAGE_SIZE,
            offset: page * STREAMS_PAGE_SIZE,
        })
        page += 1
        hasMore = hasMoreResults

        yield streams
    } while (hasMore)
}

export async function getAllStreams(params: Object): any {
    let streams = []

    // eslint-disable-next-line no-restricted-syntax, no-await-in-loop
    for await (const pagedStreams of getPagedStreams(params)) {
        streams = [
            ...streams,
            ...pagedStreams,
        ]
    }

    return streams
}

export const getStreamData = (streamId: StreamId, fromTimestamp: number): ApiResult<Object> => get({
    url: routes.api.streams.data.from({
        fromTimestamp,
        partition: 0,
        streamId,
    }),
})
