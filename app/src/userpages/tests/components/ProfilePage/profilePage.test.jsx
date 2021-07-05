import React from 'react'
import { shallow } from 'enzyme'

import { ProfilePage } from '../../../components/ProfilePage'

jest.mock('react-redux', () => ({
    useDispatch: jest.fn().mockImplementation(() => (action) => action),
    connect: jest.fn().mockImplementation(() => (action) => action),
}))

jest.mock('react-router-dom', () => ({
    useHistory: jest.fn().mockImplementation(() => ({
        push: jest.fn(),
        replace: jest.fn(),
    })),
    useLocation: jest.fn().mockImplementation(() => ({
        pathname: undefined,
    })),
}))

describe('ProfilePageHandler', () => {
    describe('render', () => {
        it('should have a ProfileSettings', () => {
            const el = shallow(<ProfilePage />)
            expect(el.find('ProfileSettings')).toBeTruthy()
        })
        it('should have a DeleteAccount', () => {
            const el = shallow(<ProfilePage />)
            expect(el.find('DeleteAccount')).toBeTruthy()
        })
    })
})
