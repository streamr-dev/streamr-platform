import moxios from 'moxios'

import * as services from '$shared/modules/user/services'
import * as utils from '$mp/utils/web3'
import { BalanceType } from '$shared/flowtype/user-types'

describe('user - services', () => {
    let dateNowSpy
    let oldStreamrApiUrl
    let oldStreamrUrl
    const DATE_NOW = 1337

    beforeAll(() => {
        dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => DATE_NOW)
    })

    afterAll(() => {
        dateNowSpy.mockReset()
        dateNowSpy.mockRestore()
    })

    beforeEach(() => {
        oldStreamrApiUrl = process.env.STREAMR_API_URL
        process.env.STREAMR_API_URL = ''
        oldStreamrUrl = process.env.STREAMR_URL
        process.env.STREAMR_URL = 'streamr'
        moxios.install()
    })

    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
        process.env.STREAMR_API_URL = oldStreamrApiUrl
        process.env.STREAMR_URL = oldStreamrUrl
        moxios.uninstall()
    })

    describe('getUserData', () => {
        it('gets user data', async () => {
            const data = {
                name: 'Tester1',
                username: 'tester1@streamr.com',
            }

            moxios.wait(() => {
                const request = moxios.requests.mostRecent()
                request.respondWith({
                    status: 200,
                    response: data,
                })

                expect(request.config.method).toBe('get')
                expect(request.config.url).toBe('/users/me?noCache=1337')
            })

            const result = await services.getUserData()
            expect(result).toStrictEqual(data)
        })
    })

    describe('saveCurrentUser', () => {
        it('should PUT the user to the api', async () => {
            const data = {
                id: '1',
                name: 'tester',
                email: 'test@tester.test',
            }

            moxios.wait(() => {
                const request = moxios.requests.mostRecent()
                request.respondWith({
                    status: 200,
                    response: data,
                })

                expect(request.config.method).toBe('put')
                expect(request.config.url).toBe('/users/me')
                expect(request.headers['Content-Type']).toBe('application/json')
            })

            const result = await services.putUser(data)
            expect(result).toStrictEqual(data)
        })
    })

    describe('deleteCurrentUser', () => {
        it('deletes the current user account', async () => {
            moxios.wait(() => {
                const request = moxios.requests.mostRecent()
                request.respondWith({
                    status: 204,
                })

                expect(request.config.method).toBe('delete')
                expect(request.config.url).toBe('/users/me')
            })

            await services.deleteUserAccount()
        })
    })

    describe('updateCurrentUserImage', () => {
        it('should POST the image to the api and PUT the user to the API', async () => {
            const data = {
                id: '1',
                name: 'tester',
                email: 'test@tester.test',
                imageUrlSmall: 'testSmall.jpg',
                imageUrlLarge: 'testLarge.jpg',
            }

            const imageToUpload = new Blob(['0101'], {
                type: 'image/png',
            })

            moxios.wait(() => {
                const request = moxios.requests.mostRecent()
                request.respondWith({
                    status: 200,
                    response: data,
                })

                expect(request.config.method).toBe('post')
                expect(request.config.url).toBe('/users/me/image')
                expect(request.headers['Content-Type']).toBe('multipart/form-data')
            })

            const result = await services.uploadProfileAvatar(imageToUpload)
            expect(result).toStrictEqual(data)
        })
    })

    describe('createChallenge', () => {
        it('sends a POST request to get a challenge', async () => {
            const account = '0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa'
            const data = {
                expires: '2018-12-11T09:55:26Z',
                challenge: 'This is a challenge created by Streamr',
                id: '0fWncFCPW4CAeeBYKGAdUuHY8yN0Ty',
            }

            moxios.wait(() => {
                const request = moxios.requests.mostRecent()
                request.respondWith({
                    status: 200,
                    response: data,
                })

                expect(request.config.method).toBe('post')
                expect(request.config.url).toBe(`/login/challenge/${account}`)
                expect(request.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
            })

            const result = await services.createChallenge(account)
            expect(result).toStrictEqual(data)
        })
    })

    describe('getBalance', () => {
        it('gets ETH balance', async () => {
            jest.spyOn(utils, 'getEthBalance').mockImplementation(jest.fn(() => '123'))

            const balance = await services.getBalance({
                address: 'testAccount',
                type: BalanceType.ETH,
            })

            expect(balance).toBe('123')
        })

        it('gets token balance', async () => {
            jest.spyOn(utils, 'getDataTokenBalance').mockImplementation(jest.fn(() => '123'))

            const balance = await services.getBalance({
                address: 'testAccount',
                type: BalanceType.DATA,
            })
            expect(balance).toBe('123')
        })

        it('throws an error if type is unknown', async () => {
            let balance
            let error
            try {
                balance = await services.getBalance({
                    adress: 'testAccount',
                    type: 'someToken',
                })
            } catch (e) {
                error = e
            }

            expect(error).toBeDefined()
            expect(balance).not.toBeDefined()
        })
    })
})
