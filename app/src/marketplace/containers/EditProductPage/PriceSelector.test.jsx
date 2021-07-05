import React, { useContext, useMemo, useState } from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { MemoryRouter } from 'react-router-dom'

import * as UndoContext from '$shared/contexts/Undo'
import Select from '$ui/Select'
import Toggle from '$shared/components/Toggle'
import { Provider as ValidationContextProvider } from '../ProductController/ValidationContextProvider'
import * as BeneficiaryAddress from './BeneficiaryAddress'
import PriceSelector from './PriceSelector'
import { Context as EditControllerContext } from './EditControllerProvider'

const mockState = {
    product: {
        id: '1',
    },
    contractProduct: {
        id: '1',
    },
    dataUnion: {
        id: 'dataUnionId',
    },
    global: {
        dataPerUsd: 10,
    },
    entities: {
        products: {
            '1': {
                id: '1',
            },
        },
        contractProducts: {
            '1': {
                id: '1',
            },
        },
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

describe('PriceSelector', () => {
    beforeEach(() => {
        jest.spyOn(BeneficiaryAddress, 'default').mockImplementation(() => null)
    })

    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    })

    // eslint-disable-next-line react/prop-types
    const EditContextWrap = ({ children }) => {
        const [preferredCurrency, setPreferredCurrency] = useState('DATA')

        const value = useMemo(() => ({
            preferredCurrency,
            setPreferredCurrency,
        }), [
            preferredCurrency,
            setPreferredCurrency,
        ])

        return (
            <EditControllerContext.Provider value={value}>
                {children}
            </EditControllerContext.Provider>
        )
    }

    const setup = async (product, transform) => {
        let undoContext

        const WrappedPriceSelector = () => {
            undoContext = useContext(UndoContext.Context)
            const { state } = undoContext
            return state && state.id ? <PriceSelector /> : null
        }

        const el = mount((
            <MemoryRouter>
                <EditContextWrap>
                    <UndoContext.Provider>
                        <ValidationContextProvider>
                            <WrappedPriceSelector />
                        </ValidationContextProvider>
                    </UndoContext.Provider>
                </EditContextWrap>
            </MemoryRouter>
        ))

        await act(async () => {
            await undoContext.replace(() => product)
        })

        el.update()

        if (transform) {
            transform(el)
        }

        return undoContext.state
    }

    it('sets DATA amount', async () => {
        const { price, pricePerSecond, priceCurrency, timeUnit } = await setup({
            id: '1',
            price: '1',
            priceCurrency: 'DATA',
            timeUnit: 'second',
        }, (el) => {
            el
                .find('.inputWrapper input')
                .first()
                .simulate('change', {
                    target: {
                        value: '10',
                    },
                })
                .simulate('blur')
        })

        expect(price.toString()).toBe('10')
        expect(pricePerSecond.toString()).toBe('10')
        expect(priceCurrency.toString()).toBe('DATA')
        expect(timeUnit).toBe('second')
    })

    it('sets USD amount', async () => {
        const { price, pricePerSecond, priceCurrency, timeUnit } = await setup({
            id: '1',
            price: '1',
            priceCurrency: 'DATA',
            timeUnit: 'second',
        }, (el) => {
            expect(el.find('.currency').first().text()).toBe('DATA')

            el
                .find('.icon')
                .first()
                .simulate('click')

            expect(el.find('.currency').first().text()).toBe('USD') /* It's USD now. */

            el
                .find('.inputWrapper input')
                .first()
                .simulate('change', {
                    target: {
                        value: '10',
                    },
                })
                .simulate('blur')
        })

        expect(price.toString()).toBe('100')
        expect(pricePerSecond.toString()).toBe('100')
        expect(priceCurrency.toString()).toBe('DATA')
        expect(timeUnit).toBe('second')
    })

    it('changes time unit + updates amounts', async () => {
        const { price, pricePerSecond, priceCurrency, timeUnit } = await setup({
            id: '1',
            price: '7200',
            priceCurrency: 'DATA',
            pricePerSecond: '7200',
            timeUnit: 'second',
        }, (el) => {
            act(() => {
                el.find(Select).props().onChange({
                    value: 'hour',
                })
            })
        })

        expect(price.toString()).toBe('7200')
        expect(pricePerSecond.toString()).toBe('2')
        expect(priceCurrency.toString()).toBe('DATA')
        expect(timeUnit).toBe('hour')
    })

    describe('fixed fiat price', () => {
        it('changes price currency to USD + converts', async () => {
            const { price, pricePerSecond, priceCurrency, timeUnit } = await setup({
                id: '1',
                price: '1',
                priceCurrency: 'DATA',
                pricePerSecond: '1',
                timeUnit: 'second',
            }, (el) => {
                act(() => {
                    el.find(Toggle).props().onChange(true)
                })
            })

            expect(price.toString()).toBe('0.1')
            expect(pricePerSecond.toString()).toBe('0.1')
            expect(priceCurrency.toString()).toBe('USD')
            expect(timeUnit).toBe('second')
        })

        it('changes price currency to DATA + converts', async () => {
            const { price, pricePerSecond, priceCurrency, timeUnit } = await setup({
                id: '1',
                price: '0.1',
                priceCurrency: 'USD',
                pricePerSecond: '0.1',
                timeUnit: 'second',
            }, (el) => {
                act(() => {
                    el.find(Toggle).props().onChange(false)
                })
            })

            expect(price.toString()).toBe('1')
            expect(pricePerSecond.toString()).toBe('1')
            expect(priceCurrency.toString()).toBe('DATA')
            expect(timeUnit).toBe('second')
        })
    })
})
