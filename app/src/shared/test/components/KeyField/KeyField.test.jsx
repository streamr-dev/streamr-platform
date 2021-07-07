import React from 'react'
import { mount } from 'enzyme'

import KeyField from '$shared/components/KeyField'
import Text from '$ui/Text'

describe('KeyField', () => {
    describe('basic', () => {
        it('renders the component', () => {
            const el = mount(<KeyField
                keyName="myKey"
                value="testValue"
            />)

            expect(el.find('Label').text().replace(/\u200c/g, '')).toBe('myKey') // get rid of invisible &zwnj;
            expect(el.find(Text).prop('value')).toBe('testValue')
            expect(el.find(Text).prop('type')).toBe('text')
        })

        it('has a copy action', () => {
            const el = mount(<KeyField
                keyName="myKey"
                value="testValue"
            />)

            const actions = el.find('WithInputActions').prop('actions').map((action) => (
                mount(action)
            ))
            expect(actions.length).toBe(1)
            expect(actions[0].text()).toBe('Copy')
        })
    })

    describe('hide/reveal', () => {
        it('hides the value', () => {
            const el = mount(<KeyField
                keyName="myKey"
                value="testValue"
                hideValue
            />)

            expect(el.find(Text).prop('type')).toBe('password')
        })

        it('has a menu option to reveal the value', () => {
            const el = mount(<KeyField
                keyName="myKey"
                value="testValue"
                hideValue
            />)

            expect(el.find(Text).prop('type')).toBe('password')

            const action = mount(el.find('WithInputActions').prop('actions')[0])
            expect(action.text()).toBe('Reveal')
        })
    })

    describe('editing', () => {
        it('has a menu option to edit value', () => {
            const el = mount(<KeyField
                keyName="myKey"
                value="testValue"
                allowEdit
            />)

            const action = mount(el.find('WithInputActions').prop('actions')[1])
            expect(action.text()).toBe('Edit')
        })
    })

    describe('deleting', () => {
        it('has a menu option to remove value', () => {
            const el = mount(<KeyField
                keyName="myKey"
                value="testValue"
                allowDelete
            />)

            const action = mount(el.find('WithInputActions').prop('actions')[1])
            expect(action.text()).toBe('Delete')
            expect(action.prop('disabled')).toBeFalsy()
        })

        it('disables the delete option', () => {
            const el = mount(<KeyField
                keyName="myKey"
                value="testValue"
                allowDelete
                disableDelete
            />)

            const action = mount(el.find('WithInputActions').prop('actions')[1])
            expect(action.prop('disabled')).toBeTruthy()
        })
    })
})
