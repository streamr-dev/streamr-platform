// @flow

import { createSelector } from 'reselect'

import type { UserState, StoreState } from '$shared/flowtype/store-state'
import type { User, Balances } from '$shared/flowtype/user-types'
import type { ErrorInUi } from '$shared/flowtype/common-types'

const selectUserState = (state: StoreState): UserState => state.user

export const selectFetchingUserData: (StoreState) => boolean = createSelector(
    selectUserState,
    (subState: UserState): boolean => subState.fetchingUserData,
)

export const selectUserData: ((state: StoreState) => ?User) = createSelector(
    selectUserState,
    (subState: UserState): ?User => subState.user,
)

export const selectUsername: ((state: StoreState) => ?string) = createSelector(
    selectUserState,
    (subState: UserState): ?string => (subState.user || {}).username,
)

export const selectUserDataError: (StoreState) => ?ErrorInUi = createSelector(
    selectUserState,
    (subState: UserState): ?ErrorInUi => subState.userDataError,
)

export const selectDeletingUserAccount: (StoreState) => boolean = createSelector(
    selectUserState,
    (subState: UserState): boolean => subState.deletingUserAccount,
)

export const selectDeleteUserAccountError: (StoreState) => ?ErrorInUi = createSelector(
    selectUserState,
    (subState: UserState): ?ErrorInUi => subState.deleteUserAccountError,
)

export const isAuthenticating: (StoreState) => boolean = createSelector(
    selectFetchingUserData,
    selectUserData,
    selectUserDataError,
    (isFetchingUserData, userData, userDataError) => (
        // Should not redirect until fetching of user data (if started) fails or succeeds.
        // Note that logging out dumps user data and does NOT schedule any fetching.
        !userData && !userDataError && !!isFetchingUserData
    ),
)

export const isAuthenticated: (StoreState) => boolean = createSelector(
    selectUserData,
    selectUserDataError,
    (userData, userDataError) => (
        !!(userData && !userDataError)
    ),
)

/**
 * Auth attempted but failed. Differentiates initial logged out state from
 * logged out state after checking.
 */

export const authenticationFailed: (StoreState) => boolean = createSelector(
    isAuthenticated,
    selectUserDataError,
    (isAuthenticatedState, userDataError) => (
        !isAuthenticatedState && !!userDataError
    ),
)

type AuthState = {
    isAuthenticating: boolean,
    isAuthenticated: boolean,
    isLoggedOut: boolean,
}

export const selectAuthState: (StoreState) => AuthState = createSelector(
    isAuthenticating,
    isAuthenticated,
    authenticationFailed,
    (isAuthenticatingState, isAuthenticatedState, authenticationFailedState) => ({
        isAuthenticating: !!isAuthenticatingState,
        isAuthenticated: !!isAuthenticatedState,
        authenticationFailed: !!authenticationFailedState,
    }),
)

export const selectBalances: (StoreState) => Balances = createSelector(
    selectUserState,
    (subState: UserState): Balances => subState.balances,
)
