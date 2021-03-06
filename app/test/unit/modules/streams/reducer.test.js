import reducer, { initialState } from '$mp/modules/streams/reducer'
import * as constants from '$mp/modules/streams/constants'

describe('streams - reducer', () => {
    it('has initial state', () => {
        expect(reducer(undefined, {})).toStrictEqual(initialState)
    })

    it('handles request', () => {
        const expectedState = {
            ids: [],
            fetching: true,
            error: null,
            hasMoreResults: false,
        }

        expect(reducer(undefined, {
            type: constants.GET_STREAMS_REQUEST,
            payload: {},
        })).toStrictEqual(expectedState)
    })

    it('handles success', () => {
        const expectedState = {
            ids: [1, 2],
            fetching: false,
            error: null,
            hasMoreResults: true,
        }

        expect(reducer(undefined, {
            type: constants.GET_STREAMS_SUCCESS,
            payload: {
                streams: [1, 2],
                hasMoreResults: true,
            },
        })).toStrictEqual(expectedState)
    })

    it('combines stream ids to list', () => {
        const state = {
            ids: [1, 2],
            fetching: false,
            error: null,
            hasMoreResults: true,
        }
        const expectedState = {
            ids: [1, 2, 3, 4],
            fetching: false,
            error: null,
            hasMoreResults: false,
        }

        expect(reducer(state, {
            type: constants.GET_STREAMS_SUCCESS,
            payload: {
                streams: [3, 4],
                hasMoreResults: false,
            },
        })).toStrictEqual(expectedState)
    })

    it('combines stream ids to list and removes duplicates', () => {
        const state = {
            ids: [1, 2, 3],
            fetching: false,
            error: null,
            hasMoreResults: true,
        }
        const expectedState = {
            ids: [1, 2, 3, 4, 5],
            fetching: false,
            error: null,
            hasMoreResults: false,
        }

        expect(reducer(state, {
            type: constants.GET_STREAMS_SUCCESS,
            payload: {
                streams: [3, 4, 5],
                hasMoreResults: false,
            },
        })).toStrictEqual(expectedState)
    })

    it('handles failure', () => {
        const error = new Error('Test')

        const expectedState = {
            ids: [],
            fetching: false,
            error,
            hasMoreResults: false,
        }

        expect(reducer(undefined, {
            type: constants.GET_STREAMS_FAILURE,
            payload: {
                error,
            },
        })).toStrictEqual(expectedState)
    })

    it('clears the stream list', () => {
        const state = {
            ids: ['1', '2'],
            fetching: false,
            error: null,
            hasMoreResults: false,
        }
        const expectedState = {
            ids: [],
            fetching: false,
            error: null,
            hasMoreResults: false,
        }

        expect(reducer(state, {
            type: constants.CLEAR_STREAM_LIST,
        })).toStrictEqual(expectedState)
    })
})
