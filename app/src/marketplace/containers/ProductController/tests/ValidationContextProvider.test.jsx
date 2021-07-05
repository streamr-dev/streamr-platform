import React, { useContext } from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import * as useProduct from '../useProduct'

import { Provider as ValidationContextProvider, Context as ValidationContext } from '../ValidationContextProvider'

const mockState = {
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

describe('validation context', () => {
    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    })

    it('creates validation context', () => {
        let currentContext
        function Test() {
            currentContext = useContext(ValidationContext)
            return null
        }

        jest.spyOn(useProduct, 'default').mockImplementation(() => ({
            id: '1',
        }))

        mount((
            <ValidationContextProvider>
                <Test />
            </ValidationContextProvider>
        ))

        expect(currentContext.status).toStrictEqual({})
        expect(currentContext.pendingChanges).toStrictEqual({})
        expect(currentContext.touched).toStrictEqual({})
    })

    describe('touched fields', () => {
        beforeEach(() => {
            jest.spyOn(useProduct, 'default').mockImplementation(() => ({
                id: '1',
            }))
        })

        it('marks a field as touched with touch()', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            expect(currentContext.touched).toStrictEqual({})
            act(() => {
                currentContext.setTouched('myField')
            })
            expect(currentContext.touched).toStrictEqual({
                myField: true,
            })
        })

        it('returns true for fields marked as touched with isTouched()', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            expect(currentContext.touched).toStrictEqual({})
            act(() => {
                currentContext.setTouched('myField')
            })
            expect(currentContext.isTouched('myField')).toBe(true)
            expect(currentContext.isTouched('anotherField')).toBe(false)
        })

        it('returns true if any field touched with isAnyTouched()', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            expect(currentContext.isAnyTouched()).toBe(false)
            act(() => {
                currentContext.setTouched('myField')
            })
            expect(currentContext.isAnyTouched()).toBe(true)
        })

        it('resets touched values with resetTouched()', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            expect(currentContext.isAnyTouched()).toBe(false)
            act(() => {
                currentContext.setTouched('myField')
                currentContext.setTouched('anotherField')
            })
            expect(currentContext.isAnyTouched()).toBe(true)

            act(() => {
                currentContext.resetTouched()
            })
            expect(currentContext.isAnyTouched()).toBe(false)
        })
    })

    describe('status', () => {
        beforeEach(() => {
            jest.spyOn(useProduct, 'default').mockImplementation(() => ({
                id: '1',
            }))
        })

        it('sets field error status with setStatus()', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            expect(currentContext.status).toStrictEqual({})
            act(() => {
                currentContext.setStatus('myField', 'info', 'message')
            })
            expect(currentContext.status).toStrictEqual({
                myField: {
                    level: 'info',
                    message: 'message',
                },
            })
        })

        it('throws error if no name given to setStatus()', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                try {
                    currentContext.setStatus()
                } catch (e) {
                    expect(e.message).toBe('validation needs a name')
                }
            })
        })

        it('does nothing when calling setStatus() and unmounted', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            const result = mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                result.unmount()
                currentContext.setStatus('myField', 'info', 'message')
            })
            expect(currentContext.status).toStrictEqual({})
        })

        it('removes field error status with clearStatus()', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            expect(currentContext.status).toStrictEqual({})
            act(() => {
                currentContext.setStatus('myField', 'info', 'message')
                currentContext.clearStatus('myField')
            })
            expect('myField' in currentContext.status).toBe(false)
        })

        it('throws error if no name given to clearStatus()', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                try {
                    currentContext.clearStatus()
                } catch (e) {
                    expect(e.message).toBe('validation needs a name')
                }
            })
        })

        it('does nothing if unmounted and calling clearStatus()', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            const result = mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                currentContext.setStatus('myField', 'info', 'message')
            })
            act(() => {
                result.unmount()
                currentContext.clearStatus()
            })
            expect(currentContext.status).toStrictEqual({
                myField: {
                    level: 'info',
                    message: 'message',
                },
            })
        })

        it('returns true if field has no error and calling isValid()', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            expect(currentContext.status).toStrictEqual({})
            act(() => {
                currentContext.setStatus('myField', 'error', 'message')
            })
            expect(currentContext.isValid('myField')).toBe(false)
            act(() => {
                currentContext.clearStatus('myField')
            })
            expect(currentContext.isValid('myField')).toBe(true)
        })
    })

    describe('validate', () => {
        beforeEach(() => {
            jest.spyOn(useProduct, 'default').mockImplementation(() => ({
                id: '1',
            }))
        })

        it('does nothing if product is null', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))
            expect(currentContext.status).toStrictEqual({})

            act(() => {
                currentContext.validate()
            })
            expect(currentContext.status).toStrictEqual({})
        })

        it('does nothing if unmounted', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            const result = mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))
            expect(currentContext.status).toStrictEqual({})

            act(() => {
                result.unmount()
                currentContext.validate({
                    name: '',
                })
            })
            expect(currentContext.status).toStrictEqual({})
        })

        it('validates empty product free data product', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                    isFree: true,
                })
            })

            expect(currentContext.isValid('name')).toBe(false)
            expect(currentContext.isValid('description')).toBe(false)
            expect(currentContext.isValid('category')).toBe(false)
            expect(currentContext.isValid('imageUrl')).toBe(false)
            expect(currentContext.isValid('streams')).toBe(false)
            expect(currentContext.isValid('pricePerSecond')).toBe(true)
            expect(currentContext.isValid('beneficiaryAddress')).toBe(true)
            expect(currentContext.isValid('adminFee')).toBe(true)
        })

        it('validates empty product free data union', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                currentContext.validate({
                    type: 'DATAUNION',
                    isFree: true,
                })
            })

            expect(currentContext.isValid('name')).toBe(false)
            expect(currentContext.isValid('description')).toBe(false)
            expect(currentContext.isValid('category')).toBe(false)
            expect(currentContext.isValid('imageUrl')).toBe(false)
            expect(currentContext.isValid('streams')).toBe(false)
            expect(currentContext.isValid('pricePerSecond')).toBe(true)
            expect(currentContext.isValid('beneficiaryAddress')).toBe(true)
            expect(currentContext.isValid('adminFee')).toBe(false)
        })

        it('validates empty product paid data product', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                    isFree: false,
                })
            })

            expect(currentContext.isValid('name')).toBe(false)
            expect(currentContext.isValid('description')).toBe(false)
            expect(currentContext.isValid('category')).toBe(false)
            expect(currentContext.isValid('imageUrl')).toBe(false)
            expect(currentContext.isValid('streams')).toBe(false)
            expect(currentContext.isValid('pricePerSecond')).toBe(false)
            expect(currentContext.isValid('beneficiaryAddress')).toBe(false)
            expect(currentContext.isValid('adminFee')).toBe(true)
        })

        it('validates empty product paid data union', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                currentContext.validate({
                    type: 'DATAUNION',
                    isFree: false,
                })
            })

            expect(currentContext.isValid('name')).toBe(false)
            expect(currentContext.isValid('description')).toBe(false)
            expect(currentContext.isValid('category')).toBe(false)
            expect(currentContext.isValid('imageUrl')).toBe(false)
            expect(currentContext.isValid('streams')).toBe(false)
            expect(currentContext.isValid('pricePerSecond')).toBe(false)
            expect(currentContext.isValid('beneficiaryAddress')).toBe(true)
            expect(currentContext.isValid('adminFee')).toBe(false)
        })

        it('validates name, description & category', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                })
            })

            expect(currentContext.isValid('name')).toBe(false)
            expect(currentContext.isValid('description')).toBe(false)
            expect(currentContext.isValid('category')).toBe(false)

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                    name: 'new name',
                    description: 'new description',
                    category: 'new category',
                })
            })

            expect(currentContext.isValid('name')).toBe(true)
            expect(currentContext.isValid('description')).toBe(true)
            expect(currentContext.isValid('category')).toBe(true)
        })

        it('validates image', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                })
            })
            expect(currentContext.isValid('imageUrl')).toBe(false)

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                    imageUrl: 'http://...',
                })
            })
            expect(currentContext.isValid('imageUrl')).toBe(true)

            act(() => {
                currentContext.clearStatus('imageUrl')
                currentContext.validate({
                    type: 'NORMAL',
                    newImageToUpload: 'blob',
                })
            })
            expect(currentContext.isValid('imageUrl')).toBe(true)
        })

        it('validates streams', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                })
            })

            expect(currentContext.isValid('streams')).toBe(false)

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                    streams: ['1', '2'],
                })
            })

            expect(currentContext.isValid('streams')).toBe(true)
        })

        it('validates admin fee', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                currentContext.validate({
                    type: 'DATAUNION',
                })
            })
            expect(currentContext.isValid('adminFee')).toBe(false)

            act(() => {
                currentContext.validate({
                    type: 'DATAUNION',
                    adminFee: 0.3,
                })
            })
            expect(currentContext.isValid('adminFee')).toBe(true)

            act(() => {
                currentContext.clearStatus('adminFee')
                currentContext.validate({
                    type: 'DATAUNION',
                    adminFee: 0,
                })
            })
            expect(currentContext.isValid('adminFee')).toBe(true)

            act(() => {
                currentContext.clearStatus('adminFee')
                currentContext.validate({
                    type: 'DATAUNION',
                    adminFee: -2,
                })
            })
            expect(currentContext.isValid('adminFee')).toBe(false)

            act(() => {
                currentContext.clearStatus('adminFee')
                currentContext.validate({
                    type: 'DATAUNION',
                    adminFee: 1.1,
                })
            })
            expect(currentContext.isValid('adminFee')).toBe(false)
        })

        it('validates beneficiary address', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                    isFree: false,
                })
            })
            expect(currentContext.isValid('beneficiaryAddress')).toBe(false)

            act(() => {
                currentContext.clearStatus('beneficiaryAddress')
                currentContext.validate({
                    type: 'NORMAL',
                    isFree: false,
                    beneficiaryAddress: 'invalidAddress',
                })
            })
            expect(currentContext.isValid('beneficiaryAddress')).toBe(false)

            act(() => {
                currentContext.clearStatus('beneficiaryAddress')
                currentContext.validate({
                    type: 'NORMAL',
                    isFree: false,
                    beneficiaryAddress: '0x7Ce38183F7851EE6eEB9547B1E537fB362C79C10',
                })
            })
            expect(currentContext.isValid('beneficiaryAddress')).toBe(true)
        })

        it('validates price', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                    isFree: false,
                })
            })
            expect(currentContext.isValid('pricePerSecond')).toBe(false)

            act(() => {
                currentContext.clearStatus('pricePerSecond')
                currentContext.validate({
                    type: 'NORMAL',
                    isFree: false,
                    pricePerSecond: '-10',
                })
            })
            expect(currentContext.isValid('pricePerSecond')).toBe(false)

            act(() => {
                currentContext.clearStatus('pricePerSecond')
                currentContext.validate({
                    type: 'NORMAL',
                    isFree: false,
                    pricePerSecond: '123',
                })
            })
            expect(currentContext.isValid('pricePerSecond')).toBe(true)
        })
    })

    describe('pending changes', () => {
        it('marks untouched fields as pending if there were previously saved pending changes', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            const product = {
                id: '1',
                name: 'Name',
                description: 'Description',
                streams: ['1', '3'],
                category: 'category',
                state: 'DEPLOYED',
                pendingChanges: {
                    name: 'New Name',
                    description: 'New Description',
                    streams: ['2', '3', '4'],
                },
            }
            jest.spyOn(useProduct, 'default').mockImplementation(() => product)

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))
            expect(currentContext.isAnyChangePending()).toBe(false)

            act(() => {
                currentContext.validate(product)
            })
            expect(currentContext.isAnyChangePending()).toBe(true)
            expect(currentContext.isPendingChange('name')).toBe(true)
            expect(currentContext.isPendingChange('description')).toBe(true)
            expect(currentContext.isPendingChange('category')).toBe(false)
            expect(currentContext.isPendingChange('streams')).toBe(true)
        })

        it('marks fields as pending for published products if touched & different from original product', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            jest.spyOn(useProduct, 'default').mockImplementation(() => ({
                id: '1',
                name: 'Name',
                description: 'Description',
                streams: ['1', '3'],
                category: 'category',
            }))

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))
            expect(currentContext.isAnyChangePending()).toBe(false)

            act(() => {
                currentContext.setTouched('name')
                currentContext.setTouched('description')
                currentContext.setTouched('streams')
            })

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                    name: 'New Name',
                    description: 'New Description',
                    category: 'category',
                    streams: ['2', '3', '4'],
                    state: 'DEPLOYED',
                })
            })
            expect(currentContext.isAnyChangePending()).toBe(true)
            expect(currentContext.isPendingChange('name')).toBe(true)
            expect(currentContext.isPendingChange('description')).toBe(true)
            expect(currentContext.isPendingChange('category')).toBe(false)
            expect(currentContext.isPendingChange('streams')).toBe(true)
        })

        it('marks the cover image as pending for published product if new image is uploaded', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            jest.spyOn(useProduct, 'default').mockImplementation(() => ({
                id: '1',
                name: 'Name',
                description: 'Description',
                streams: ['1', '3'],
                category: 'category',
                imageUrl: 'http://...',
            }))

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))
            expect(currentContext.isAnyChangePending()).toBe(false)

            act(() => {
                currentContext.setTouched('imageUrl')
            })

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                    name: 'New Name',
                    description: 'New Description',
                    category: 'category',
                    streams: ['2', '3', '4'],
                    newImageToUpload: new File([''], 'filename'),
                    state: 'DEPLOYED',
                })
            })
            expect(currentContext.isAnyChangePending()).toBe(true)
            expect(currentContext.isPendingChange('imageUrl')).toBe(true)
        })

        it('does not mark a field as pending for published products if touched but not different from original product', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            jest.spyOn(useProduct, 'default').mockImplementation(() => ({
                id: '1',
                name: 'Name',
                description: 'Description',
                category: 'category',
                streams: ['1', '3'],
            }))

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))
            expect(currentContext.isAnyChangePending()).toBe(false)

            act(() => {
                currentContext.setTouched('name')
                currentContext.setTouched('description')
                currentContext.setTouched('streams')
            })

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                    name: 'Name',
                    description: 'Description',
                    category: 'category',
                    streams: ['1', '3'],
                    state: 'DEPLOYED',
                })
            })
            expect(currentContext.isAnyChangePending()).toBe(false)
            expect(currentContext.isPendingChange('name')).toBe(false)
            expect(currentContext.isPendingChange('description')).toBe(false)
            expect(currentContext.isPendingChange('category')).toBe(false)
            expect(currentContext.isPendingChange('streams')).toBe(false)
        })

        it('ignores pending fields for unpublished product', () => {
            let currentContext
            function Test() {
                currentContext = useContext(ValidationContext)
                return null
            }

            jest.spyOn(useProduct, 'default').mockImplementation(() => ({
                id: '1',
                name: 'Name',
                description: 'Description',
                streams: ['1', '3'],
            }))

            mount((
                <ValidationContextProvider>
                    <Test />
                </ValidationContextProvider>
            ))
            expect(currentContext.isAnyChangePending()).toBe(false)

            act(() => {
                currentContext.setTouched('name')
                currentContext.setTouched('description')
                currentContext.setTouched('streams')
            })

            act(() => {
                currentContext.validate({
                    type: 'NORMAL',
                    name: 'New Name',
                    description: 'New Description',
                    category: 'category',
                    streams: ['2', '3', '4'],
                })
            })
            expect(currentContext.isAnyChangePending()).toBe(false)
            expect(currentContext.isPendingChange('name')).toBe(false)
            expect(currentContext.isPendingChange('description')).toBe(false)
            expect(currentContext.isPendingChange('category')).toBe(false)
            expect(currentContext.isPendingChange('streams')).toBe(false)
        })
    })
})
