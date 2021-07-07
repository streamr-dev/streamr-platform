// @flow

import { createAction } from 'redux-actions'
import { normalize } from 'normalizr'

import { streamsSchema } from '$shared/modules/entities/schema'
import { updateEntities } from '$shared/modules/entities/actions'
import type { StreamList } from '$shared/flowtype/stream-types'
import type { ErrorInUi, ReduxActionCreator } from '$shared/flowtype/common-types'

import * as api from './services'
import {
    GET_STREAMS_REQUEST,
    GET_STREAMS_SUCCESS,
    GET_STREAMS_FAILURE,
    CLEAR_STREAM_LIST,
} from './constants'
import type {
    StreamsActionCreator,
    StreamsErrorActionCreator,
} from './types'

const getStreamsRequest: ReduxActionCreator = createAction(GET_STREAMS_REQUEST)

const getStreamsSuccess: StreamsActionCreator = createAction(GET_STREAMS_SUCCESS, (streams: StreamList) => ({
    streams,
}))

const getStreamsFailure: StreamsErrorActionCreator = createAction(GET_STREAMS_FAILURE, (error: ErrorInUi) => ({
    error,
}))

export const clearStreamList: ReduxActionCreator = createAction(CLEAR_STREAM_LIST)

export const getAllStreams = (params: Object = {}) => (dispatch: Function) => {
    dispatch(getStreamsRequest())
    return api.getAllStreams(params)
        .then((streams) => {
            const { result, entities } = normalize(streams, streamsSchema)
            dispatch(updateEntities(entities))
            dispatch(getStreamsSuccess(result))
        }, (error) => {
            dispatch(getStreamsFailure(error))
        })
}
