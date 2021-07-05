import React from 'react'
import { shallow } from 'enzyme'

import AddKeyField from '$shared/components/KeyField/AddKeyField'

describe('AddKeyField', () => {
    describe('basic', () => {
        it('displays a button', () => {
            const label = 'Add new'
            const el = shallow(<AddKeyField
                label={label}
            />)

            expect(el.find('Button').shallow().text()).toBe(label)
        })

        it('shows an editor once clicked', () => {
            const label = 'Add new'
            const el = shallow(<AddKeyField
                label={label}
            />)

            el.find('Button').simulate('click', {
                preventDefault() {},
            })

            expect(el.find('Button').length).toBe(0)
            expect(el.find('KeyFieldEditor').length).toBe(1)
        })
    })

    describe('cancel', () => {
        it('hides the editor if cancel is clicked', () => {
            const label = 'Add new'
            const el = shallow(<AddKeyField
                label={label}
            />)

            el.find('Button').simulate('click', {
                preventDefault() {},
            })

            expect(el.find('Button').length).toBe(0)
            expect(el.find('KeyFieldEditor').length).toBe(1)

            el.find('KeyFieldEditor').prop('onCancel')()

            expect(el.find('Button').length).toBe(1)
            expect(el.find('KeyFieldEditor').length).toBe(0)
        })
    })

    describe('saving', () => {
        it('hides the editor when saved', (done) => {
            const label = 'Add new'
            const onSave = () => Promise.resolve()
            const el = shallow(<AddKeyField
                label={label}
                onSave={onSave}
            />)

            el.find('Button').simulate('click', {
                preventDefault() {},
            })

            expect(el.find('Button').length === 0)
            expect(el.find('KeyFieldEditor').length === 1)

            el.find('KeyFieldEditor').prop('onSave')()

            // We need to wait for 2nd setState to happen after onSave was called
            setTimeout(() => (
                onSave()
                    .then(() => {
                        expect(el.find('Button').length).toBe(1)
                        expect(el.find('KeyFieldEditor').length).toBe(0)
                        done()
                    })
            ), 0)
        })

        it('shows an error when saving fails', (done) => {
            const label = 'Add new'
            const errorMessage = 'error'
            const error = new Error(errorMessage)
            const onSave = () => Promise.reject(error)
            const el = shallow(<AddKeyField
                label={label}
                onSave={onSave}
            />)

            el.find('Button').simulate('click', {
                preventDefault() {},
            })

            expect(el.find('Button').length).toBe(0)
            expect(el.find('KeyFieldEditor').length).toBe(1)

            try {
                el.find('KeyFieldEditor').prop('onSave')()
            } catch (e) {
                expect(e).toBe(error)
            }

            // We need to wait for 2nd setState to happen after onSave was called
            setTimeout(() => (
                onSave()
                    .catch(() => {
                        expect(el.find('KeyFieldEditor').length).toBe(1)
                        expect(el.find('KeyFieldEditor').prop('error')).toBe(errorMessage)
                        done()
                    })
            ), 0)
        })
    })
})
