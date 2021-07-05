// @flow

import type { PayloadAction, ErrorInUi } from '$shared/flowtype/common-types'
import type { IntegrationKeyId, IntegrationKeyIdList } from '$shared/flowtype/integration-key-types'

export type IntegrationKeysAction = PayloadAction<{
    ethereumIdentities: IntegrationKeyIdList,
}>
export type IntegrationKeysActionCreator = (IntegrationKeyIdList) => IntegrationKeysAction

export type IntegrationKeysErrorAction = PayloadAction<{
    error: ErrorInUi,
}>
export type IntegrationKeysErrorActionCreator = (error: ErrorInUi) => IntegrationKeysErrorAction

export type IntegrationKeyIdAction = PayloadAction<{
    id: IntegrationKeyId,
}>

export type IntegrationKeyIdActionCreator = (IntegrationKeyId) => IntegrationKeyIdAction
