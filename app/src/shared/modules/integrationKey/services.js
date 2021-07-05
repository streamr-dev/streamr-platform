// @flow

import { get, post, del, put } from '$shared/utils/api'
import type { ApiResult } from '$shared/flowtype/common-types'
import {
    type IntegrationKeyId,
    type IntegrationKey,
    type CreateIdentity,
} from '$shared/flowtype/integration-key-types'
import { type Challenge } from '$shared/flowtype/user-types'
import type { Address, Hash } from '$shared/flowtype/web3-types'
import { integrationKeyServices } from '$shared/utils/constants'
import { createChallenge } from '$shared/modules/user/services'

import {
    ChallengeFailedError,
    CreateIdentityFailedError,
    IdentityExistsError,
} from '$shared/errors/Web3'
import routes from '$routes'

export const getIntegrationKeys = (): ApiResult<Array<IntegrationKey>> => get({
    url: routes.api.integrationKeys.index(),
})

export const editIntegrationKey = (id: IntegrationKeyId, name: string): ApiResult<IntegrationKey> =>
    put({
        url: routes.api.integrationKeys.show({
            id,
        }),
        data: {
            name,
        },
    })

export const createEthereumIdentity = (
    name: string,
    address: Address,
    challenge: Challenge,
    signature: Hash,
): ApiResult<IntegrationKey> => post({
    url: routes.api.integrationKeys.index(),
    data: {
        name,
        service: integrationKeyServices.ETHEREREUM_IDENTITY,
        challenge,
        signature,
        address,
    },
})

export const createIdentity = async ({ name, address, signChallenge }: CreateIdentity) => {
    let response
    let challenge
    let signature

    try {
        response = await createChallenge(address)
        challenge = response && response.challenge
        signature = await signChallenge(challenge)
    } catch (error) {
        console.warn(error)
        throw new ChallengeFailedError()
    }

    try {
        return await createEthereumIdentity(name, address, response, signature)
    } catch (error) {
        if (error.code === 'DUPLICATE_NOT_ALLOWED') {
            throw new IdentityExistsError()
        } else {
            console.warn(error)
            throw new CreateIdentityFailedError()
        }
    }
}

export const deleteIntegrationKey = (id: IntegrationKeyId): ApiResult<null> => del({
    url: routes.api.integrationKeys.show({
        id,
    }),
})
