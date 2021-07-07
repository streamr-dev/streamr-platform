import { normalize } from 'normalizr'

import * as actions from '$mp/modules/streams/actions'
import * as constants from '$mp/modules/streams/constants'
import * as services from '$mp/modules/streams/services'
import * as entityConstants from '$shared/modules/entities/constants'
import { streamsSchema } from '$shared/modules/entities/schema'
import mockStore from '$testUtils/mockStoreProvider'

describe('streams - actions', () => {
    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    })

    describe('getAllStreams', () => {
        it('gets streams succesfully', async () => {
            const streams = [
                {
                    id: 'run-canvas-spec',
                    partitions: 1,
                    name: 'run-canvas-spec',
                    feed: {
                        id: 7,
                        name: 'API',
                        module: 147,
                    },
                    config: {
                        fields: [
                            {
                                name: 'numero',
                                type: 'number',
                            },
                            {
                                name: 'areWeDoneYet',
                                type: 'boolean',
                            },
                        ],
                    },
                    description: 'Stream for integration test RunCanvasSpec',
                    uiChannel: false,
                    dateCreated: '2017-11-10T16:43:01Z',
                    lastUpdated: '2017-11-10T16:43:01Z',
                },
            ]

            const { result, entities } = normalize(streams, streamsSchema)

            const getStreamsStub = jest.spyOn(services, 'getAllStreams').mockImplementation(() => Promise.resolve(streams))

            const store = mockStore()
            await store.dispatch(actions.getAllStreams())

            const expectedActions = [
                {
                    type: constants.GET_STREAMS_REQUEST,
                },
                {
                    type: entityConstants.UPDATE_ENTITIES,
                    payload: {
                        entities,
                    },
                },
                {
                    type: constants.GET_STREAMS_SUCCESS,
                    payload: {
                        streams: result,
                    },
                },
            ]

            expect(store.getActions()).toStrictEqual(expectedActions)
            expect(getStreamsStub).toBeCalledWith({})
        })

        it('responds to errors', async () => {
            const error = new Error('Error')
            jest.spyOn(services, 'getAllStreams').mockImplementation(() => Promise.reject(error))

            const store = mockStore()
            await store.dispatch(actions.getAllStreams())

            const expectedActions = [
                {
                    type: constants.GET_STREAMS_REQUEST,
                },
                {
                    type: constants.GET_STREAMS_FAILURE,
                    error: true,
                    payload: error,
                },
            ]
            expect(store.getActions()).toStrictEqual(expectedActions)
        })
    })

    describe('clearStreamList', () => {
        it('clears the stream list', async () => {
            const store = mockStore()
            await store.dispatch(actions.clearStreamList())

            const expectedActions = [
                {
                    type: constants.CLEAR_STREAM_LIST,
                },
            ]
            expect(store.getActions()).toStrictEqual(expectedActions)
        })
    })
})
