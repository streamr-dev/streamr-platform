import moxios from 'moxios'

import * as services from '$mp/modules/streams/services'
import * as api from '$shared/utils/api'

describe('streams - services', () => {
    beforeEach(() => {
        moxios.install()
    })

    afterEach(() => {
        moxios.uninstall()
    })

    it('gets list streams', async () => {
        process.env.STREAMR_API_URL = 'TEST_STREAMR_API_URL'
        const data = [
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

        moxios.wait(() => {
            const request = moxios.requests.mostRecent()
            request.respondWith({
                status: 200,
                response: data,
            })

            expect(request.config.method).toBe('get')
            expect(request.config.url).toBe(`${process.env.STREAMR_API_URL}/streams?operation=STREAM_SHARE&uiChannel=false`)
        })

        const result = await services.getStreams()
        expect(result.streams).toStrictEqual(data)
        expect(result.hasMoreResults).toBe(false)
    })

    it('allows to override default parameters', async () => {
        process.env.STREAMR_API_URL = 'TEST_STREAMR_API_URL'

        moxios.wait(() => {
            const request = moxios.requests.mostRecent()
            request.respondWith({
                status: 200,
                response: null,
            })

            expect(request.config.method).toBe('get')
            expect(request.config.url).toBe(`${process.env.STREAMR_API_URL}/streams?operation=test&uiChannel=true`)
        })

        await services.getStreams({
            operation: 'test',
            uiChannel: true,
        })
    })

    it('gets has search parameter', async () => {
        process.env.STREAMR_API_URL = 'TEST_STREAMR_API_URL'
        const data = [
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

        moxios.wait(() => {
            const request = moxios.requests.mostRecent()
            request.respondWith({
                status: 200,
                response: data,
            })

            expect(request.config.method).toBe('get')
            expect(request.config.url).toBe(`${process.env.STREAMR_API_URL}/streams?operation=STREAM_SHARE&search=streamId&uiChannel=false`)
        })

        const result = await services.getStreams({
            search: 'streamId',
        })
        expect(result.streams).toStrictEqual(data)
        expect(result.hasMoreResults).toBe(false)
    })

    it('returns paged results', async () => {
        process.env.STREAMR_API_URL = 'TEST_STREAMR_API_URL'
        /* eslint-disable object-curly-newline */
        const data = [
            { id: '1' },
            { id: '2' },
            { id: '3' },
            { id: '4' },
            { id: '5' },
            { id: '6' },
            { id: '7' },
            { id: '8' },
            { id: '9' },
            { id: '10' },
        ]
        /* eslint-enable object-curly-newline */

        moxios.wait(() => {
            const request = moxios.requests.mostRecent()
            request.respondWith({
                status: 200,
                response: [...data.slice(0, 6)],
            })

            expect(request.config.method).toBe('get')
            expect(request.config.url).toBe(`${process.env.STREAMR_API_URL}/streams?max=6&offset=0&operation=STREAM_SHARE&uiChannel=false`)
        })

        const result = await services.getStreams({
            offset: 0,
            max: 5,
        })
        expect(result.streams).toStrictEqual(data.slice(0, 5))
        expect(result.hasMoreResults).toBe(true)
    })

    it('returns false when no more results available', async () => {
        process.env.STREAMR_API_URL = 'TEST_STREAMR_API_URL'
        /* eslint-disable object-curly-newline */
        const data = [
            { id: '1' },
            { id: '2' },
            { id: '3' },
            { id: '4' },
            { id: '5' },
            { id: '6' },
            { id: '7' },
            { id: '8' },
            { id: '9' },
            { id: '10' },
        ]
        /* eslint-enable object-curly-newline */

        moxios.wait(() => {
            const request = moxios.requests.mostRecent()
            request.respondWith({
                status: 200,
                response: [...data.slice(5, 10)],
            })

            expect(request.config.method).toBe('get')
            expect(request.config.url).toBe(`${process.env.STREAMR_API_URL}/streams?max=6&offset=5&operation=STREAM_SHARE&uiChannel=false`)
        })

        const result = await services.getStreams({
            offset: 5,
            max: 5,
        })
        expect(result.streams).toStrictEqual(data.slice(5, 10))
        expect(result.hasMoreResults).toBe(false)
    })

    it('returns all streams from paged results', async () => {
        process.env.STREAMR_API_URL = 'TEST_STREAMR_API_URL'
        const allStreams = Array.from({
            length: 1500,
        }, (v, i) => ({
            id: `stream-${i + 1}`,
        }))

        const mockGet = jest.fn()
            .mockImplementationOnce(() => Promise.resolve(allStreams.slice(0, 1000)))
            .mockImplementationOnce(() => Promise.resolve(allStreams.slice(999)))

        jest.spyOn(api, 'get').mockImplementation(mockGet)

        const result = await services.getAllStreams()
        expect(result).toStrictEqual(allStreams)
        expect(mockGet.mock.calls.length).toBe(2)
        expect(mockGet.mock.calls[0][0]).toStrictEqual({
            url: `${process.env.STREAMR_API_URL}/streams?max=1000&offset=0&operation=STREAM_SHARE&uiChannel=false`,
        })
        expect(mockGet.mock.calls[1][0]).toStrictEqual({
            url: `${process.env.STREAMR_API_URL}/streams?max=1000&offset=999&operation=STREAM_SHARE&uiChannel=false`,
        })
    })
})
