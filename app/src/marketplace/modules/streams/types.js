// @flow

import type { ErrorFromApi, PayloadAction } from '$shared/flowtype/common-types'
import type { StreamIdList } from '$shared/flowtype/stream-types'

export type StreamsAction = PayloadAction<{
    streams: StreamIdList,
}>
export type StreamsActionCreator = (streams: StreamIdList) => StreamsAction

export type StreamsErrorAction = PayloadAction<{
    error: ErrorFromApi
}>
export type StreamsErrorActionCreator = (error: ErrorFromApi) => StreamsErrorAction
