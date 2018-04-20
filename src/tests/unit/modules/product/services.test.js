import assert from 'assert-diff'
import sinon from 'sinon'

import * as all from '../../../../modules/product/services'
import * as utils from '../../../../utils/smartContract'

describe('Product services', () => {
    let sandbox
    beforeEach(() => {
        sandbox = sinon.sandbox.create()
    })

    afterEach(() => {
        sandbox.restore()
    })

    describe('getProductById', () => {
        it('is not implemented yet', () => {
            assert(true, 'nope, still not implemented') // TODO Implementation!
        })
    })

    describe('getStreamsByProductId', () => {
        it('is not implemented yet', () => {
            assert(true, 'nope, still not implemented') // TODO Implementation!
        })
    })

    describe('getProductFromContract', () => {
        it('must weis to token', async () => {
            const getProductStub = sandbox.stub().callsFake(() => ({
                call: () => Promise.resolve({
                    status: '0x1',
                    pricePerSecond: '1000000000000000000',
                }),
            }))
            const getContractStub = sandbox.stub(utils, 'getContract').callsFake(() => ({
                methods: {
                    getProduct: getProductStub,
                },
            }))
            const result = await all.getProductFromContract('aapeli')
            assert.deepStrictEqual({
                status: '0x1',
                currency: undefined,
                state: undefined,
                pricePerSecond: 1,
            }, result)
            assert(getContractStub.calledOnce)
            assert(getProductStub.calledOnce)
            assert(getProductStub.calledWith('0xaapeli'))
        })
        it('must throw error if owner is 0', async (done) => {
            const getProductStub = sandbox.stub().callsFake(() => Promise.resolve({
                call: () => Promise.resolve({
                    owner: '0x000',
                    pricePerSecond: '0',
                }),
            }))
            sandbox.stub(utils, 'getContract').callsFake(() => Promise.resolve({
                methods: {
                    getProduct: getProductStub,
                },
            }))
            try {
                await all.getProductFromContract('aapeli')
            } catch (e) {
                done()
            }
        })
    })

    describe('getMyProductSubscription', () => {
        it('must work as intended', async () => {
            const getProductStub = sandbox.stub().callsFake(() => ({
                call: () => Promise.resolve({
                    status: '0x1',
                    pricePerSecond: '0',
                }),
            }))
            const getSubscriptionToStub = sandbox.stub().callsFake(() => ({
                call: () => Promise.resolve({
                    endTimestamp: '0',
                }),
            }))
            const getContractStub = sandbox.stub(utils, 'getContract').callsFake(() => ({
                methods: {
                    getProduct: getProductStub,
                    getSubscriptionTo: getSubscriptionToStub,
                },
            }))
            const result = await all.getMyProductSubscription('aapeli')
            assert.deepStrictEqual({
                productId: 'aapeli',
                endTimestamp: 0,
            }, result)
            assert(getProductStub.calledOnce)
            assert(getSubscriptionToStub.calledOnce)
            assert(getContractStub.calledTwice)
            assert(getProductStub.calledWith('0xaapeli'))
            assert(getSubscriptionToStub.calledWith('0xaapeli'))
        })
        it('must throw error if no product found', async (done) => {
            const getProductStub = sandbox.stub().callsFake(() => Promise.resolve({
                call: () => Promise.resolve({
                    owner: '0x000',
                }),
            }))
            sandbox.stub(utils, 'getContract').callsFake(() => Promise.resolve({
                methods: {
                    getProduct: getProductStub,
                },
            }))
            try {
                await all.getProductFromContract('aapeli')
            } catch (e) {
                done()
            }
        })
    })

    describe('subscriptionIsValidTo', () => {
        it('must return true if it\'s valid', async () => {
            const getProductStub = sandbox.stub().callsFake(() => ({
                call: () => Promise.resolve({
                    status: '0x1',
                    pricePerSecond: '0',
                }),
            }))
            const getSubscriptionToStub = sandbox.stub().callsFake(() => ({
                call: () => Promise.resolve({
                    endTimestamp: (Date.now() + 10000).toString(),
                }),
            }))
            sandbox.stub(utils, 'getContract').callsFake(() => ({
                methods: {
                    getProduct: getProductStub,
                    getSubscriptionTo: getSubscriptionToStub,
                },
            }))
            const result = await all.subscriptionIsValidTo('aapeli')
            assert(result)
        })
        it('must return false if it isn\'t valid', async () => {
            const getProductStub = sandbox.stub().callsFake(() => ({
                call: () => Promise.resolve({
                    status: '0x1',
                    pricePerSecond: '0',
                }),
            }))
            const getSubscriptionToStub = sandbox.stub().callsFake(() => ({
                call: () => Promise.resolve({
                    endTimestamp: '0',
                }),
            }))
            sandbox.stub(utils, 'getContract').callsFake(() => ({
                methods: {
                    getProduct: getProductStub,
                    getSubscriptionTo: getSubscriptionToStub,
                },
            }))
            const result = await all.subscriptionIsValidTo('aapeli')
            assert(!result)
        })
    })
})
