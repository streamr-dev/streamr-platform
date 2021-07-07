import React from 'react'
import { mount } from 'enzyme'

import KeyFieldEditor from '$shared/components/KeyField/KeyFieldEditor'

describe('KeyFieldEditor', () => {
    describe('basic', () => {
        it('shows text input for key name and value', () => {
            const el = mount(<KeyFieldEditor
                onSave={() => {}}
            />)

            expect(el.exists('#keyName')).toBe(true)
            expect(el.find('#keyName').hostNodes()).toHaveLength(1)
            expect(el.exists('#keyValue')).toBe(true)
            expect(el.find('#keyValue').hostNodes()).toHaveLength(1)
            expect(el.find('Label').at(0).text()).toBe('Key name')
            expect(el.find('Label').at(1).text()).toBe('API key')
        })

        it('shows correct text for save button', () => {
            const el = mount(<KeyFieldEditor
                onSave={() => {}}
            />)
            expect(el.find('Buttons').prop('actions').save.title).toBe('Save')
        })

        it('shows save button as disabled if value is empty', () => {
            const el = mount(<KeyFieldEditor
                onSave={() => {}}
            />)
            expect(el.find('Buttons').prop('actions').save.disabled).toBeTruthy()
        })

        it('shows the value as readonly', () => {
            const el = mount(<KeyFieldEditor
                onSave={() => {}}
            />)

            expect(el.find('Text').at(1).prop('readOnly')).toBe(true)
        })

        it('calls onSave prop', () => {
            const spy = jest.fn()
            const el = mount(<KeyFieldEditor
                onSave={spy}
            />)

            el.find('Buttons').prop('actions').save.onClick()

            expect(spy).toHaveBeenCalledTimes(1)
        })

        it('shows an error as part of the value field', () => {
            const error = 'Something happened'
            const el = mount(<KeyFieldEditor
                onSave={() => {}}
                error={error}
            />)

            expect(el.find('Errors').text()).toBe(error)
        })
    })

    describe('createNew', () => {
        it('shows only key name input when createNew flag is set', () => {
            const el = mount(<KeyFieldEditor
                onSave={() => {}}
                createNew
            />)

            expect(el.find('Text').length).toBe(1)
            expect(el.find('Label').text()).toBe('Key name')
        })

        it('shows correct text for save button', () => {
            const el = mount(<KeyFieldEditor
                onSave={() => {}}
                createNew
            />)
            expect(el.find('Buttons').prop('actions').save.title).toBe('Add')
        })

        it('shows an error as part of the name field', () => {
            const error = 'Something happened'
            const el = mount(<KeyFieldEditor
                onSave={() => {}}
                createNew
                error={error}
            />)

            expect(el.find('Errors').text()).toBe(error)
        })

        it('shows save button as disabled unless name is given', () => {
            const el = mount(<KeyFieldEditor
                onSave={() => {}}
                createNew
            />)

            expect(el.find('Buttons').prop('actions').save.disabled).toBeTruthy()

            el.find('#keyName').hostNodes().simulate('change', {
                target: {
                    value: 'name',
                },
            })
            expect(el.find('Buttons').prop('actions').save.disabled).toBeFalsy()
        })
    })

    describe('showValue', () => {
        it('shows the value', () => {
            const el = mount(<KeyFieldEditor
                onSave={() => {}}
                showValue
            />)

            expect(el.find('Text').at(1).prop('id')).toBe('keyValue')
            expect(el.find('Text').at(1).prop('readOnly')).toBe(true)
        })
    })
})
