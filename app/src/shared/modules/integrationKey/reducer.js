// @flow

import { handleActions } from 'redux-actions'

import type { IntegrationKeyState } from '$shared/flowtype/store-state'

import type {
    IntegrationKeysAction,
    IntegrationKeyIdAction,
    IntegrationKeysErrorAction,
} from './types'
import {
    INTEGRATION_KEYS_REQUEST,
    INTEGRATION_KEYS_SUCCESS,
    INTEGRATION_KEYS_FAILURE,
    CREATE_IDENTITY_REQUEST,
    CREATE_IDENTITY_SUCCESS,
    CREATE_IDENTITY_FAILURE,
    DELETE_INTEGRATION_KEY_REQUEST,
    DELETE_INTEGRATION_KEY_SUCCESS,
    DELETE_INTEGRATION_KEY_FAILURE,
} from './constants'

export const initialState: IntegrationKeyState = {
    ethereumIdentities: [],
    fetchingIntegrationKeys: false,
    integrationKeysError: null,
    creatingIdentity: false,
    creatingIdentityError: null,
    removingIntegrationKey: false,
    removingIntegrationError: null,
}

const reducer: (IntegrationKeyState) => IntegrationKeyState = handleActions({
    [INTEGRATION_KEYS_REQUEST]: (state: IntegrationKeyState) => ({
        ...state,
        fetchingIntegrationKeys: true,
    }),

    [INTEGRATION_KEYS_SUCCESS]: (state: IntegrationKeyState, action: IntegrationKeysAction) => ({
        ...state,
        fetchingIntegrationKeys: false,
        ethereumIdentities: action.payload.ethereumIdentities,
    }),

    [INTEGRATION_KEYS_FAILURE]: (state: IntegrationKeyState, action: IntegrationKeysErrorAction) => ({
        ...state,
        fetchingIntegrationKeys: false,
        integrationKeysError: action.payload.error,
    }),

    [CREATE_IDENTITY_REQUEST]: (state: IntegrationKeyState) => ({
        ...state,
        creatingIdentity: true,
    }),

    [CREATE_IDENTITY_SUCCESS]: (state: IntegrationKeyState, action: IntegrationKeyIdAction) => ({
        ...state,
        ethereumIdentities: [...state.ethereumIdentities, action.payload.id],
        creatingIdentity: false,
        creatingIdentityError: null,
    }),

    [CREATE_IDENTITY_FAILURE]: (state: IntegrationKeyState, action: IntegrationKeysErrorAction) => ({
        ...state,
        creatingIdentity: false,
        creatingIdentityError: action.payload.error,
    }),

    [DELETE_INTEGRATION_KEY_REQUEST]: (state: IntegrationKeyState) => ({
        ...state,
        removingIntegrationKey: true,
    }),

    [DELETE_INTEGRATION_KEY_SUCCESS]: (state: IntegrationKeyState, action: IntegrationKeyIdAction) => ({
        ...state,
        removingIntegrationKey: false,
        ethereumIdentities: state.ethereumIdentities.filter((id) => id !== action.payload.id),
        removingIntegrationError: null,
    }),

    [DELETE_INTEGRATION_KEY_FAILURE]: (state: IntegrationKeyState, action: IntegrationKeysErrorAction) => ({
        ...state,
        removingIntegrationKey: false,
        removingIntegrationError: action.payload.error,
    }),
}, initialState)

export default reducer
