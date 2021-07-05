import mockStore from '$testUtils/mockStoreProvider'

import * as actions from '$shared/modules/integrationKey/actions'
import * as constants from '$shared/modules/integrationKey/constants'
import * as services from '$shared/modules/integrationKey/services'
import * as entitiesActions from '$shared/modules/entities/actions'
import { integrationKeyServices } from '$shared/utils/constants'

describe('integrationKey - actions', () => {
    let oldStreamrApiUrl

    beforeEach(() => {
        oldStreamrApiUrl = process.env.STREAMR_API_URL
        process.env.STREAMR_API_URL = ''
        jest.clearAllMocks()
        jest.restoreAllMocks()
    })

    afterEach(() => {
        process.env.STREAMR_API_URL = oldStreamrApiUrl
    })

    describe('deleteIntegrationKey', () => {
        it('throws an error if id is not defined', () => {
            try {
                actions.deleteIntegrationKey()
            } catch (e) {
                expect(e.message).toMatch(/No id/i)
            }
        })

        it('creates DELETE_INTEGRATION_KEY_SUCCESS when deleting an integration key has succeeded', async () => {
            const id = 'testid'
            const serviceStub = jest.fn(() => Promise.resolve(null))
            jest.spyOn(services, 'deleteIntegrationKey').mockImplementation(serviceStub)

            const store = mockStore()
            await store.dispatch(actions.deleteIntegrationKey(id))
            expect(serviceStub).toBeCalled()

            const expectedActions = [{
                type: constants.DELETE_INTEGRATION_KEY_REQUEST,
            },
            {
                type: constants.DELETE_INTEGRATION_KEY_SUCCESS,
                payload: {
                    id,
                },
            }]

            expect(store.getActions()).toStrictEqual(expectedActions)
        })

        it('creates DELETE_INTEGRATION_KEY_FAILURE deleting an integration key fails', async () => {
            const error = new Error('error')
            jest.spyOn(services, 'deleteIntegrationKey').mockImplementation(jest.fn(() => Promise.reject(error)))
            const expectedActions = [{
                type: constants.DELETE_INTEGRATION_KEY_REQUEST,
            },
            {
                type: constants.DELETE_INTEGRATION_KEY_FAILURE,
                payload: {
                    error: {
                        message: 'error',
                    },
                },
            }]
            const store = mockStore()

            try {
                await store.dispatch(actions.deleteIntegrationKey('name'))
            } catch (e) {
                expect(e === error).toBe(true)
            }

            expect(store.getActions()).toStrictEqual(expectedActions)
        })
    })

    describe('createIdentity', () => {
        it('creates CREATE_IDENTITY_SUCCESS when creating identity has succeeded', async () => {
            const data = {
                id: 'testid',
                user: 1234,
                name: 'Test',
                service: integrationKeyServices.ETHEREREUM_IDENTITY,
                json: {
                    address: '0x7Ce38183F7851EE6eEB9547B1E537fB362C79C10',
                },
            }
            const serviceStub = jest.fn(() => Promise.resolve(data))
            jest.spyOn(services, 'createIdentity').mockImplementation(serviceStub)

            jest.spyOn(entitiesActions, 'updateEntities').mockImplementation(jest.fn(() => ({
                type: 'updateEntities',
            })))

            const store = mockStore()
            const params = {
                name: 'name',
                address: '0x7Ce38183F7851EE6eEB9547B1E537fB362C79C10',
                signChallenge: () => Promise.resolve('signature'),
            }
            await store.dispatch(actions.createIdentity(params))
            expect(serviceStub).toBeCalled()
            expect(serviceStub).toBeCalledWith(params)

            const expectedActions = [{
                type: constants.CREATE_IDENTITY_REQUEST,
            },
            {
                type: 'updateEntities',
            },
            {
                type: constants.CREATE_IDENTITY_SUCCESS,
                payload: {
                    id: data.id,
                },
            }]

            expect(store.getActions()).toStrictEqual(expectedActions)
        })

        it('creates CREATE_IDENTITY_FAILURE creating identity fails', async () => {
            const error = new Error('error')
            const serviceStub = jest.fn(() => Promise.reject(error))
            jest.spyOn(services, 'createIdentity').mockImplementation(serviceStub)

            const expectedActions = [{
                type: constants.CREATE_IDENTITY_REQUEST,
            },
            {
                type: constants.CREATE_IDENTITY_FAILURE,
                payload: {
                    error: {
                        message: 'error',
                        code: undefined,
                    },
                },
            }]
            const store = mockStore()
            const params = {
                name: 'name',
                address: '0x7Ce38183F7851EE6eEB9547B1E537fB362C79C10',
                signChallenge: () => Promise.resolve('signature'),
            }

            try {
                await store.dispatch(actions.createIdentity(params))
            } catch (e) {
                expect(e === error).toBe(true)
            }

            expect(serviceStub).toBeCalledWith(params)
            expect(store.getActions()).toStrictEqual(expectedActions)
        })
    })

    describe('fetchIntegrationKeys', () => {
        it('calls services.fetchIntegrationKeys and updates integration keys', async () => {
            const data = [
                {
                    id: 'testid',
                    user: 1234,
                    name: 'Marketplace test',
                    service: integrationKeyServices.ETHEREREUM_IDENTITY,
                    json: {
                        address: '0x7Ce38183F7851EE6eEB9547B1E537fB362C79C10',
                    },
                },
                {
                    id: 'anotherid',
                    user: 4321,
                    name: 'A private key',
                    service: integrationKeyServices.PRIVATE_KEY,
                    json: {
                        address: '0x829BD824B016326A401d083B33D092293333A830',
                    },
                },
            ]

            const serviceStub = jest.fn(() => Promise.resolve(data))
            jest.spyOn(services, 'getIntegrationKeys').mockImplementation(serviceStub)

            jest.spyOn(entitiesActions, 'updateEntities').mockImplementation(jest.fn(() => ({
                type: 'updateEntities',
            })))

            const store = mockStore()
            await store.dispatch(actions.fetchIntegrationKeys())
            expect(serviceStub).toBeCalled()

            const expectedActions = [
                {
                    type: constants.INTEGRATION_KEYS_REQUEST,
                },
                {
                    type: 'updateEntities',
                },
                {
                    type: constants.INTEGRATION_KEYS_SUCCESS,
                    payload: {
                        ethereumIdentities: ['testid'],
                    },
                },
            ]

            expect(store.getActions()).toStrictEqual(expectedActions)
        })

        it('calls services.getIntegrationKeys and handles error', async () => {
            const error = new Error('error')
            const serviceStub = jest.fn(() => Promise.reject(error))
            jest.spyOn(services, 'getIntegrationKeys').mockImplementation(serviceStub)

            const store = mockStore()

            try {
                await store.dispatch(actions.fetchIntegrationKeys())
            } catch (e) {
                expect(e === error).toBe(true)
            }
            expect(serviceStub).toBeCalled()

            const expectedActions = [
                {
                    type: constants.INTEGRATION_KEYS_REQUEST,
                },
                {
                    type: constants.INTEGRATION_KEYS_FAILURE,
                    payload: {
                        error: {
                            message: 'error',
                        },
                    },
                },
            ]

            expect(store.getActions()).toStrictEqual(expectedActions)
        })
    })
})
