// @flow

import { handleActions } from 'redux-actions'

import type { UserState } from '$shared/flowtype/store-state'

import type {
    UserDataAction,
    UserErrorAction,
    SetBalanceAction,
} from './types'
import {
    USER_DATA_REQUEST,
    USER_DATA_SUCCESS,
    USER_DATA_FAILURE,
    SAVE_CURRENT_USER_REQUEST,
    SAVE_CURRENT_USER_SUCCESS,
    SAVE_CURRENT_USER_FAILURE,
    UPDATE_CURRENT_USER,
    RESET_USER_DATA,
    DELETE_USER_ACCOUNT_REQUEST,
    DELETE_USER_ACCOUNT_SUCCESS,
    DELETE_USER_ACCOUNT_FAILURE,
    SET_BALANCE,
} from './constants'

export const initialState: UserState = {
    user: null,
    balances: {},
    fetchingUserData: false,
    userDataError: null,
    saved: true,
    deletingUserAccount: false,
    deleteUserAccountError: null,
}

const reducer: (UserState) => UserState = handleActions({
    [USER_DATA_REQUEST]: (state: UserState) => ({
        ...state,
        fetchingUserData: true,
    }),

    [USER_DATA_SUCCESS]: (state: UserState, action: UserDataAction) => ({
        ...state,
        fetchingUserData: false,
        user: action.payload.user,
        userDataError: null,
    }),

    [USER_DATA_FAILURE]: (state: UserState, action: UserErrorAction) => ({
        ...state,
        user: null,
        fetchingUserData: false,
        userDataError: action.payload.error,
    }),

    [RESET_USER_DATA]: () => ({
        ...initialState,
    }),

    [SAVE_CURRENT_USER_REQUEST]: (state: UserState) => ({
        ...state,
        fetchingUserData: true,
    }),

    [SAVE_CURRENT_USER_SUCCESS]: (state: UserState, action: UserDataAction) => ({
        ...state,
        user: action.payload.user,
        fetchingUserData: false,
        saved: true,
        userDataError: null,
    }),

    [SAVE_CURRENT_USER_FAILURE]: (state: UserState, action: UserErrorAction) => ({
        ...state,
        fetchingUserData: false,
        userDataError: action.payload.error,
    }),

    [UPDATE_CURRENT_USER]: (state: UserState, action: UserDataAction) => ({
        ...state,
        saved: false,
        user: {
            ...(state.user || {}),
            ...action.payload.user,
        },
    }),

    [DELETE_USER_ACCOUNT_REQUEST]: (state: UserState) => ({
        ...state,
        deletingUserAccount: true,
    }),

    [DELETE_USER_ACCOUNT_SUCCESS]: (state: UserState) => ({
        ...state,
        deletingUserAccount: false,
    }),

    [DELETE_USER_ACCOUNT_FAILURE]: (state: UserState, action: UserErrorAction) => ({
        ...state,
        deletingUserAccount: false,
        deleteUserAccountError: action.payload.error,
    }),

    [SET_BALANCE]: (state: UserState, action: SetBalanceAction) => ({
        ...state,
        balances: {
            ...state.balances,
            // $FlowFixMe balances is an object
            ...action.payload.balances,
        },
    }),
}, {
    ...initialState,
    // Loading the site always triggers fetching the user. `userIsAuthenticated` gets
    // called almost at a routing level (before any `getUserData` calls) which will
    // cause the login page to flash for a split second. In order to prevent that we
    // start off with `fetchingUserData` set to `true`.
    fetchingUserData: true,
})

export default reducer
