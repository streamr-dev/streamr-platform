// @flow

import { handleActions } from 'redux-actions'

import type { StreamsState } from '../../flowtype/store-state'

import {
    GET_STREAMS_REQUEST,
    GET_STREAMS_SUCCESS,
    GET_STREAMS_FAILURE,
    CLEAR_STREAM_LIST,
} from './constants'
import type {
    StreamsAction,
    StreamsErrorAction,
} from './types'

export const initialState: StreamsState = {
    ids: [],
    fetching: false,
    error: null,
}

const reducer: (StreamsState) => StreamsState = handleActions({
    [GET_STREAMS_REQUEST]: (state: StreamsState): StreamsState => ({
        ...state,
        fetching: true,
    }),

    [GET_STREAMS_SUCCESS]: (state: StreamsState, action: StreamsAction) => {
        const ids = [
            ...new Set(( // ensure no duplicates in ids list
                state.ids
                    .concat(action.payload.streams)
                    .reverse() // reverse before new Set to remove earlier id
            )),
        ].reverse() // then re-reverse results to restore original ordering

        return {
            ids,
            fetching: false,
            error: null,
        }
    },

    [GET_STREAMS_FAILURE]: (state: StreamsState, action: StreamsErrorAction) => ({
        ...state,
        fetching: false,
        error: action.payload.error,
    }),

    [CLEAR_STREAM_LIST]: (state: StreamsState) => ({
        ...state,
        ids: [],
    }),
}, initialState)

export default reducer
