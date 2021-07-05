import React, { useContext } from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import BN from 'bignumber.js'

import * as UndoContext from '$shared/contexts/Undo'
import { timeUnits, contractCurrencies } from '$shared/utils/constants'
import { Provider as ValidationContextProvider, Context as ValidationContext } from '../ValidationContextProvider'
import useEditableProductActions from '../useEditableProductActions'

const mockState = {
    global: {
        dataPerUsd: 10,
    },
    dataUnion: {
        id: 'dataUnionId',
    },
    entities: {
        dataUnions: {
            dataUnionId: {
                id: 'dataUnionId',
            },
        },
        dataUnionStats: {
            dataUnionId: {
                id: 'dataUnionId',
                memberCount: {
                    active: 0,
                },
            },
        },
    },
}

jest.mock('react-redux', () => ({
    useSelector: jest.fn().mockImplementation((selectorFn) => selectorFn(mockState)),
    useDispatch: jest.fn(),
}))
jest.mock('../useNewProductMode', () => (
    jest.fn().mockImplementation(() => false)
))
jest.mock('../useProduct', () => (
    jest.fn().mockImplementation(() => ({
        id: '1',
    }))
))

describe('useEditableProductActions', () => {
    describe('updateProduct', () => {
        it('updates the product fields', () => {
            let updater
            let product
            function Test() {
                updater = useEditableProductActions()
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <Test />
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()

            act(() => {
                updater.updateProduct({
                    name: 'My Product',
                    description: 'My Product Description',
                })
            })

            expect(product).toStrictEqual({
                name: 'My Product',
                description: 'My Product Description',
            })

            act(() => {
                updater.updateProduct({
                    name: 'New Name',
                    description: 'My Product Description',
                    category: 'test',
                })
            })

            expect(product).toStrictEqual({
                name: 'New Name',
                description: 'My Product Description',
                category: 'test',
            })
        })
    })

    describe('updateName', () => {
        it('updates the product name', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('name')).toBe(false)

            act(() => {
                updater.updateName('My Product')
            })

            expect(product).toStrictEqual({
                name: 'My Product',
            })
            expect(validation.isTouched('name')).toBe(true)
        })
    })

    describe('updateDescription', () => {
        it('updates the product description', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('description')).toBe(false)

            act(() => {
                updater.updateDescription('My Description')
            })

            expect(product).toStrictEqual({
                description: 'My Description',
            })
            expect(validation.isTouched('description')).toBe(true)
        })
    })

    describe('updateImageUrl', () => {
        it('updates the product image url', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('imageUrl')).toBe(false)

            act(() => {
                updater.updateImageUrl('http://...')
            })

            expect(product).toStrictEqual({
                imageUrl: 'http://...',
            })
            expect(validation.isTouched('imageUrl')).toBe(true)
        })
    })

    describe('updateImageFile', () => {
        it('updates the product image upload', () => {
            let updater
            let undoContext
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                undoContext = useContext(UndoContext.Context)
                product = undoContext.state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('imageUrl')).toBe(false)

            act(() => {
                undoContext.replace(() => ({
                    name: 'Test product',
                    imageUrl: 'http://...',
                }))
            })

            const file = new File([''], 'filename')
            act(() => {
                updater.updateImageFile(file)
            })

            expect(product).toStrictEqual({
                name: 'Test product',
                newImageToUpload: file,
            })
            expect(validation.isTouched('imageUrl')).toBe(true)
        })
    })

    describe('updateStreams', () => {
        it('updates the product streams', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('streams')).toBe(false)

            act(() => {
                updater.updateStreams(['1', '2', '3'])
            })

            expect(product).toStrictEqual({
                streams: ['1', '2', '3'],
            })
            expect(validation.isTouched('streams')).toBe(true)
        })
    })

    describe('updateCategory', () => {
        it('updates the product category', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('category')).toBe(false)
            expect(validation.isTouched('details')).toBe(false)

            act(() => {
                updater.updateCategory('testCategory')
            })

            expect(product).toStrictEqual({
                category: 'testCategory',
            })
            expect(validation.isTouched('category')).toBe(true)
            expect(validation.isTouched('details')).toBe(true)
        })
    })

    describe('updateAdminFee', () => {
        it('updates the data union admin fee', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('adminFee')).toBe(false)
            expect(validation.isTouched('details')).toBe(false)

            act(() => {
                updater.updateAdminFee('0.2')
            })

            expect(product).toStrictEqual({
                adminFee: '0.2',
            })
            expect(validation.isTouched('adminFee')).toBe(true)
            expect(validation.isTouched('details')).toBe(true)
        })
    })

    describe('updateIsFree', () => {
        it('updates the product to paid, set price as 1 if not set before', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('pricePerSecond')).toBe(false)

            act(() => {
                // assume some defaults
                updater.updateProduct({
                    isFree: true,
                    timeUnit: timeUnits.second,
                    priceCurrency: contractCurrencies.DATA,
                    price: BN(0),
                })
                updater.updateIsFree(false)
            })

            expect(product).toStrictEqual({
                priceCurrency: contractCurrencies.DATA,
                timeUnit: timeUnits.second,
                isFree: false,
                price: new BN(1),
                pricePerSecond: new BN(1),
            })
            expect(validation.isTouched('pricePerSecond')).toBe(true)
        })

        it('updates the product to paid, keeps old price if set before', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('pricePerSecond')).toBe(false)

            act(() => {
                // assume some defaults
                updater.updateProduct({
                    isFree: true,
                    timeUnit: timeUnits.second,
                    priceCurrency: contractCurrencies.DATA,
                    price: BN(8),
                })
                updater.updateIsFree(false)
            })

            expect(product).toStrictEqual({
                priceCurrency: contractCurrencies.DATA,
                timeUnit: timeUnits.second,
                isFree: false,
                price: new BN(8),
                pricePerSecond: new BN(8),
            })
            expect(validation.isTouched('pricePerSecond')).toBe(true)
        })

        it('updates the product from paid to free', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('pricePerSecond')).toBe(false)

            act(() => {
                // assume some defaults
                updater.updateProduct({
                    isFree: false,
                    timeUnit: timeUnits.second,
                    priceCurrency: contractCurrencies.DATA,
                    price: BN(10),
                })
                updater.updateIsFree(true)
            })

            expect(product).toStrictEqual({
                priceCurrency: contractCurrencies.DATA,
                timeUnit: timeUnits.second,
                isFree: true,
                price: new BN(10),
                pricePerSecond: new BN(0),
            })
            expect(validation.isTouched('pricePerSecond')).toBe(true)
        })
    })

    describe('updatePrice', () => {
        it('updates the product price', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('pricePerSecond')).toBe(false)

            act(() => {
                // assume some defaults
                updater.updateProduct({
                    isFree: false,
                    timeUnit: timeUnits.second,
                    priceCurrency: contractCurrencies.DATA,
                    price: BN(0),
                })
                updater.updatePrice(new BN(8), contractCurrencies.DATA, timeUnits.second)
            })

            expect(product).toStrictEqual({
                priceCurrency: contractCurrencies.DATA,
                timeUnit: timeUnits.second,
                isFree: false,
                price: new BN(8),
                pricePerSecond: new BN(8),
            })
            expect(validation.isTouched('pricePerSecond')).toBe(true)
        })

        it('updates the product price time unit', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('pricePerSecond')).toBe(false)

            act(() => {
                // assume some defaults
                updater.updateProduct({
                    isFree: false,
                    timeUnit: timeUnits.second,
                    priceCurrency: contractCurrencies.DATA,
                    price: BN(60),
                })
                updater.updatePrice(BN(60), contractCurrencies.DATA, timeUnits.minute)
            })

            expect(product).toStrictEqual({
                priceCurrency: contractCurrencies.DATA,
                timeUnit: timeUnits.minute,
                isFree: false,
                price: new BN(60),
                pricePerSecond: new BN(1),
            })
            expect(validation.isTouched('pricePerSecond')).toBe(true)
        })

        it('updates the product price currency', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('pricePerSecond')).toBe(false)

            act(() => {
                // assume some defaults
                updater.updateProduct({
                    isFree: false,
                    timeUnit: timeUnits.second,
                    priceCurrency: contractCurrencies.DATA,
                    price: BN(10),
                })
                updater.updatePrice(BN(10), contractCurrencies.USD, timeUnits.second)
            })

            expect(product).toStrictEqual({
                priceCurrency: contractCurrencies.USD,
                timeUnit: timeUnits.second,
                isFree: false,
                price: new BN(10),
                pricePerSecond: new BN(10),
            })
            expect(validation.isTouched('pricePerSecond')).toBe(true)
        })
    })

    describe('updateBeneficiaryAddress', () => {
        it('updates the product beneficiary address', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('beneficiaryAddress')).toBe(false)

            act(() => {
                updater.updateBeneficiaryAddress('0x123')
            })

            expect(product).toStrictEqual({
                beneficiaryAddress: '0x123',
            })
            expect(validation.isTouched('beneficiaryAddress')).toBe(true)
        })
    })

    describe('updateType', () => {
        it('updates the product type', () => {
            let updater
            let product
            let validation
            function Test() {
                updater = useEditableProductActions()
                validation = useContext(ValidationContext)
                const { state } = useContext(UndoContext.Context)
                product = state
                return null
            }

            mount((
                <UndoContext.Provider>
                    <ValidationContextProvider>
                        <Test />
                    </ValidationContextProvider>
                </UndoContext.Provider>
            ))

            expect(product).toBeFalsy()
            expect(validation.isTouched('type')).toBe(false)

            act(() => {
                updater.updateType('DATAUNION')
            })

            expect(product).toStrictEqual({
                type: 'DATAUNION',
            })
            expect(validation.isTouched('type')).toBe(true)
        })
    })
})
