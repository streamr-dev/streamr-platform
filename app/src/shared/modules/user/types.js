// @flow

import type { PayloadAction, ErrorInUi } from '$shared/flowtype/common-types'
import type { User, Balances } from '$shared/flowtype/user-types'

export type UserDataAction = PayloadAction<{
    user: User
}>
export type UserDataActionCreator = (user: User) => UserDataAction

export type UserErrorAction = PayloadAction<{
    error: ErrorInUi,
}>
export type UserErrorActionCreator = (error: ErrorInUi) => UserErrorAction

export type SetBalanceAction = PayloadAction<{
    balances: Balances,
}>

export type SetBalanceActionCreator = (Balances) => SetBalanceAction
