// @flow

import type { PayloadAction } from '$shared/flowtype/common-types'

export type UpdateEntitiesParam = {
    entities: {
        products?: {},
        contractProducts?: {},
        dataUnions?: {},
        relatedProducts?: {},
        subscriptions?: {},
        categories?: {},
        streams?: {},
        transactions?: {},
        joinRequests: {},
        whitelistedAddresses: {},
    }
}

export type UpdateEntitiesAction = PayloadAction<UpdateEntitiesParam>

export type UpdateEntitiesActionCreator = (UpdateEntitiesParam) => UpdateEntitiesAction
