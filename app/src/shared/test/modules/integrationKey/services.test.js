import moxios from 'moxios'

import * as services from '$shared/modules/integrationKey/services'

import { integrationKeyServices } from '$shared/utils/constants'
import { ChallengeFailedError } from '$shared/errors/Web3'

describe('integrationKey - services', () => {
    let oldStreamrApiUrl
    let oldStreamrUrl

    beforeEach(() => {
        oldStreamrApiUrl = process.env.STREAMR_API_URL
        process.env.STREAMR_API_URL = ''
        oldStreamrUrl = process.env.STREAMR_URL
        process.env.STREAMR_URL = 'streamr'
        moxios.install()
    })

    afterEach(() => {
        process.env.STREAMR_API_URL = oldStreamrApiUrl
        process.env.STREAMR_URL = oldStreamrUrl
        moxios.uninstall()
        jest.clearAllMocks()
        jest.restoreAllMocks()
    })

    describe('getIntegrationKeys', () => {
        it('gets integration keys', async () => {
            const data = [
                {
                    id: '1234',
                    user: 1234,
                    name: 'Marketplace test',
                    service: integrationKeyServices.ETHEREREUM_IDENTITY,
                    json: {
                        address: '0x7Ce38183F7851EE6eEB9547B1E537fB362C79C10',
                    },
                },
            ]

            moxios.wait(() => {
                const request = moxios.requests.mostRecent()
                request.respondWith({
                    status: 200,
                    response: data,
                })

                expect(request.config.method).toBe('get')
                expect(request.config.url).toBe('/integration_keys')
            })

            const result = await services.getIntegrationKeys()
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

    describe('createEthereumIdentity', () => {
        it('sends a POST request to create a new integration key', async () => {
            const name = 'My identity'
            const account = '0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa'
            const challenge = {
                expires: '2018-12-11T09:55:26Z',
                challenge: 'This is a challenge created by Streamr',
                id: '0fWncFCPW4CAeeBYKGAdUuHY8yN0Ty',
            }
            const signature = 'signature'
            const data = {
                id: '1',
                name,
                service: integrationKeyServices.ETHEREREUM_IDENTITY,
                json: {
                    address: account,
                },
            }

            moxios.wait(() => {
                const request = moxios.requests.mostRecent()
                request.respondWith({
                    status: 200,
                    response: data,
                })

                expect(request.config.method).toBe('post')
                expect(request.config.url).toBe('/integration_keys')
                expect(request.headers['Content-Type']).toBe('application/json')
                expect(request.config.data).toBe(JSON.stringify({
                    name,
                    service: integrationKeyServices.ETHEREREUM_IDENTITY,
                    challenge,
                    signature,
                    address: account,
                }))
            })

            const result = await services.createEthereumIdentity(name, account, challenge, signature)
            expect(result).toStrictEqual(data)
        })
    })

    describe('createIdentity', () => {
        it('throws an error if getting challege fails', async () => {
            const address = '0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa'
            const signature = 'signature'
            moxios.stubRequest(`/login/challenge/${address}`, {
                status: 401,
            })

            // don't show error as console.error
            jest.spyOn(console, 'warn').mockImplementation(jest.fn())

            const signChallenge = jest.fn(() => Promise.resolve(signature))

            try {
                await services.createIdentity({
                    name: 'test',
                    address,
                    signChallenge,
                })
            } catch (e) {
                expect(e instanceof ChallengeFailedError).toBe(true)
            }
        })

        it('throws an error if sign method is undefined', async () => {
            const address = '0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa'
            const challenge = {
                expires: '2018-12-11T09:55:26Z',
                challenge: 'This is a challenge created by Streamr',
                id: '0fWncFCPW4CAeeBYKGAdUuHY8yN0Ty',
            }
            moxios.stubRequest(`/login/challenge/${address}`, {
                status: 200,
                response: challenge,
            })
            // don't show error as console.error
            jest.spyOn(console, 'warn').mockImplementation(jest.fn())

            try {
                await services.createIdentity({
                    name: 'test',
                    address,
                })
            } catch (e) {
                expect(e instanceof ChallengeFailedError).toBe(true)
            }
        })

        it('throws an error if sign method fails', async () => {
            const address = '0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa'
            const challenge = {
                expires: '2018-12-11T09:55:26Z',
                challenge: 'This is a challenge created by Streamr',
                id: '0fWncFCPW4CAeeBYKGAdUuHY8yN0Ty',
            }
            moxios.stubRequest(`/login/challenge/${address}`, {
                status: 200,
                response: challenge,
            })
            const signChallenge = () => {
                throw new Error('something went wrong')
            }
            // don't show error as console.error
            jest.spyOn(console, 'warn').mockImplementation(jest.fn())

            try {
                await services.createIdentity({
                    name: 'test',
                    address,
                    signChallenge,
                })
            } catch (e) {
                expect(e instanceof ChallengeFailedError).toBe(true)
            }
        })

        it('sends a POST request with the signed challenge', async () => {
            const address = '0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa'
            const signature = 'signature'
            const signChallenge = jest.fn(() => Promise.resolve(signature))
            const challenge = {
                expires: '2018-12-11T09:55:26Z',
                challenge: 'This is a challenge created by Streamr',
                id: '0fWncFCPW4CAeeBYKGAdUuHY8yN0Ty',
            }
            const name = 'My identity'
            const data = {
                id: '1',
                name,
                service: integrationKeyServices.ETHEREREUM_IDENTITY,
                json: {
                    address,
                },
            }
            moxios.stubRequest(`/login/challenge/${address}`, {
                status: 200,
                response: challenge,
            })

            moxios.stubRequest('/integration_keys', {
                status: 200,
                response: data,
            })

            const result = await services.createIdentity({
                name: 'test',
                address,
                signChallenge,
            })
            expect(result).toStrictEqual(data)
            expect(signChallenge).toBeCalledWith(challenge.challenge)
        })
    })

    describe('deleteIntegrationKey', () => {
        it('sends a DELETE request', async () => {
            const id = 'testid'
            moxios.wait(() => {
                const request = moxios.requests.mostRecent()
                request.respondWith({
                    status: 201,
                    response: null,
                })

                expect(request.config.method).toBe('delete')
                expect(request.config.url).toBe(`/integration_keys/${id}`)
            })

            const result = await services.deleteIntegrationKey(id)
            expect(result).toBe(null)
        })
    })
})
