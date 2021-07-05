import mockStore from '$testUtils/mockStoreProvider'

import * as actions from '$shared/modules/user/actions'
import * as constants from '$shared/modules/user/constants'
import * as services from '$shared/modules/user/services'

describe('user - actions', () => {
    let oldStreamrApiUrl

    beforeEach(() => {
        oldStreamrApiUrl = process.env.STREAMR_API_URL
        process.env.STREAMR_API_URL = ''
        jest.spyOn(services, 'getBalance').mockImplementation(jest.fn())
    })

    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
        process.env.STREAMR_API_URL = oldStreamrApiUrl
    })

    describe('getUserData', () => {
        it('calls services.getUserData and updates user data', async () => {
            const data = {
                name: 'Tester1',
                username: 'tester1@streamr.com',
            }

            const serviceStub = jest.spyOn(services, 'getUserData').mockImplementation(() => Promise.resolve(data))

            const store = mockStore()
            await store.dispatch(actions.getUserData())
            expect(serviceStub).toHaveBeenCalledTimes(1)

            const expectedActions = [
                {
                    type: constants.USER_DATA_REQUEST,
                },
                {
                    type: constants.USER_DATA_SUCCESS,
                    payload: {
                        user: data,
                    },
                },
            ]
            expect(store.getActions()).toStrictEqual(expectedActions)
        })

        it('calls services.getUserData and handles error', async () => {
            const error = new Error('error')
            const serviceStub = jest.spyOn(services, 'getUserData').mockImplementation(() => Promise.reject(error))

            const store = mockStore()
            await store.dispatch(actions.getUserData())
            expect(serviceStub).toHaveBeenCalledTimes(1)

            const expectedActions = [
                {
                    type: constants.USER_DATA_REQUEST,
                },
                {
                    type: constants.USER_DATA_FAILURE,
                    error: true,
                    payload: error,
                },
            ]
            expect(store.getActions()).toStrictEqual(expectedActions)
        })
    })

    describe('updateCurrentUserName', () => {
        it('creates UPDATE_CURRENT_USER', async () => {
            const store = mockStore({
                user: {
                    user: {
                        id: 'test',
                        email: 'test2',
                        name: 'test3',
                    },
                },
            })
            await store.dispatch(actions.updateCurrentUserName('test5'))
            const expectedActions = [{
                type: constants.UPDATE_CURRENT_USER,
                payload: {
                    user: {
                        id: 'test',
                        email: 'test2',
                        name: 'test5',
                    },
                },
            }]
            expect(store.getActions()).toStrictEqual(expectedActions)
        })
    })

    describe('logout', () => {
        it('calls services.logout and handles error', async () => {
            const store = mockStore()

            await store.dispatch(actions.logout())

            const expectedActions = [{
                type: constants.RESET_USER_DATA,
            }]
            expect(store.getActions()).toStrictEqual(expectedActions)
        })
    })

    describe('saveCurrentUser', () => {
        it('creates SAVE_CURRENT_USER_SUCCESS when saving user succeeded', async () => {
            const user = {
                id: '1',
                name: 'tester',
                email: 'test@tester.test',
            }
            const store = mockStore({
                user: {
                    user,
                },
            })
            const serviceStub = jest.spyOn(services, 'putUser').mockImplementation(() => Promise.resolve(user))

            const expectedActions = [{
                type: constants.SAVE_CURRENT_USER_REQUEST,
            }, {
                type: constants.SAVE_CURRENT_USER_SUCCESS,
                payload: {
                    user,
                },
            }]

            await store.dispatch(actions.saveCurrentUser())
            expect(serviceStub).toHaveBeenCalledTimes(1)

            expect(store.getActions()).toStrictEqual(expectedActions)
        })

        it('creates SAVE_CURRENT_USER_FAILURE when saving user failed', async () => {
            const user = {
                id: '1',
                name: 'tester',
                email: 'test@tester.test',
            }
            const store = mockStore({
                user: {
                    user,
                },
            })
            const error = new Error('error')
            const serviceStub = jest.spyOn(services, 'putUser').mockImplementation(() => Promise.reject(error))

            const expectedActions = [{
                type: constants.SAVE_CURRENT_USER_REQUEST,
            }, {
                type: constants.SAVE_CURRENT_USER_FAILURE,
                error: true,
                payload: error,
            }]

            try {
                await store.dispatch(actions.saveCurrentUser())
            } catch (e) {
                expect(serviceStub).toHaveBeenCalledTimes(1)
                expect(store.getActions()).toStrictEqual(expectedActions)
            }
        })
    })
})
