// @flow

import EventEmitter from 'events'
import StreamrClient from 'streamr-client'
import BN from 'bignumber.js'
import Web3 from 'web3'

import { getContract, call, calculateContractAddress } from '$mp/utils/smartContract'
import getConfig from '$shared/web3/config'
import { getToken } from '$shared/utils/sessionToken'

import type { SmartContractTransaction, Address } from '$shared/flowtype/web3-types'
import type { Stream, NewStream } from '$shared/flowtype/stream-types'
import type { ProductId, DataUnionId } from '$mp/flowtype/product-types'
import type { Permission } from '$userpages/flowtype/permission-types'
import type { ApiResult } from '$shared/flowtype/common-types'
import { checkEthereumNetworkIsCorrect } from '$shared/utils/web3'
import { getBlockNumberForTimestamp } from '$shared/utils/ethereum'

import { post, del, get, put } from '$shared/utils/api'
import { postStream, getStream } from '$userpages/modules/userPageStreams/services'
import {
    getResourcePermissions,
    addResourcePermission,
    removeResourcePermission,
} from '$userpages/modules/permission/services'
import { getWeb3, getPublicWeb3 } from '$shared/web3/web3Provider'
import TransactionError from '$shared/errors/TransactionError'
import Transaction from '$shared/utils/Transaction'
import routes from '$routes'
import type { Secret } from './types'

export const getStreamrEngineAddresses = (): Array<string> => {
    const addressesString = process.env.STREAMR_ENGINE_NODE_ADDRESSES || ''
    const addresses = addressesString.split(',')
    return addresses
}

export const createJoinPartStream = async (account: Address, productId: ProductId): Promise<Stream> => {
    const newStream: NewStream = {
        id: `${account}/dataunions/${productId}/joinPartStream`,
        description: 'Automatically created JoinPart stream for data union',
    }

    let stream
    try {
        try {
            stream = await getStream(newStream.id)
        } catch (e) {
            // ignore error
        } finally {
            if (stream == null || stream.id == null) {
                stream = await postStream(newStream)
            }
        }
    } catch (e) {
        console.error('Could not create a new JoinPart stream or get an existing one', e)
        throw e
    }

    // Add public read permission
    try {
        await Promise.all([
            addResourcePermission({
                resourceType: 'STREAM',
                resourceId: stream.id,
                data: {
                    anonymous: true,
                    operation: 'stream_get',
                    user: null,
                },
            }),
            addResourcePermission({
                resourceType: 'STREAM',
                resourceId: stream.id,
                data: {
                    anonymous: true,
                    operation: 'stream_subscribe',
                    user: null,
                },
            }),
        ])
    } catch (e) {
        console.error('Could not add public read permission for JoinPart stream', e)
        throw e
    }

    // Add write permissions for all Streamr Engine nodes
    try {
        const nodeAddresses = getStreamrEngineAddresses()

        // Process node addresses and add share & write permissions for each of them.
        // We need to add permissions in series because adding them in parallel causes
        // a race condition on backend and some of the calls will fail.
        // eslint-disable-next-line no-restricted-syntax
        for (const address of nodeAddresses) {
            // Share permission is not strictly necessary but needed to avoid error when
            // removing user's share permission (must have at least one share permission)
            // eslint-disable-next-line no-await-in-loop
            await Promise.all([
                addResourcePermission({
                    resourceType: 'STREAM',
                    resourceId: stream.id,
                    data: {
                        operation: 'stream_get',
                        user: address,
                    },
                }),
                addResourcePermission({
                    resourceType: 'STREAM',
                    resourceId: stream.id,
                    data: {
                        operation: 'stream_publish',
                        user: address,
                    },
                }),
            ])
        }
    } catch (e) {
        console.error('Could not add write keys to JoinPart stream', e)
        throw e
    }

    // Remove share & edit permission to prevent deleting the stream
    try {
        const myPermissions: Array<Permission> = await getResourcePermissions({
            resourceType: 'STREAM',
            resourceId: stream.id,
        })
        const deletedTypes = new Set(['stream_edit', 'stream_delete'])
        const deletedPermissions = myPermissions.filter((p) => deletedTypes.has(p.operation))

        if (deletedPermissions && deletedPermissions.length > 0) {
            await Promise.all([
                ...deletedPermissions.map(async ({ id }) => removeResourcePermission({
                    resourceType: 'STREAM',
                    resourceId: stream.id,
                    id,
                })),
            ])
        }
    } catch (e) {
        console.error('Could not remove share permission from JoinPart stream', e)
    }

    return stream
}

// eslint-disable-next-line camelcase
const deprecated_getAdminFeeInEther = (adminFee: string) => {
    if (+adminFee < 0 || +adminFee > 1) {
        throw new Error(`${adminFee} is not a valid admin fee`)
    }

    const web3 = getWeb3()
    return web3.utils.toWei(adminFee, 'ether')
}

// eslint-disable-next-line camelcase
const deprecated_deployDataUnion = (productId: ProductId, adminFee: string): SmartContractTransaction => {
    const web3 = getWeb3()
    const emitter = new EventEmitter()
    const errorHandler = (error: Error) => {
        emitter.emit('error', error)
    }
    const tx = new Transaction(emitter)
    const contract = getConfig().communityProduct
    const operatorAddress = process.env.DATA_UNION_OPERATOR_ADDRESS
    const tokenAddress = process.env.DATA_TOKEN_CONTRACT_ADDRESS
    const blockFreezePeriodSeconds = process.env.DATA_UNION_BLOCK_FREEZE_PERIOD_SECONDS || 1

    Promise.all([
        web3.getDefaultAccount(),
        checkEthereumNetworkIsCorrect(web3),
    ])
        .then(([account]) => Promise.all([
            Promise.resolve(account),
            // Calculate future address of the contract so that we don't have to wait
            // for the transaction to be confirmed.
            calculateContractAddress(account),
            // create join part stream
            createJoinPartStream(account, productId),
        ]))
        .then(([account, futureAddress, joinPartStream]) => {
            const args = [
                operatorAddress,
                joinPartStream.id,
                tokenAddress,
                blockFreezePeriodSeconds,
                deprecated_getAdminFeeInEther(adminFee),
            ]
            const web3Contract = new web3.eth.Contract(contract.abi)
            const deployer = web3Contract.deploy({
                data: contract.bytecode,
                arguments: args,
            })
            deployer
                .send({
                    from: account,
                })
                .on('error', errorHandler)
                .on('transactionHash', () => {
                    // send calculated contract address as the transaction hash,
                    // ignore actual tx hash
                    emitter.emit('transactionHash', futureAddress)
                })
                .on('receipt', (receipt) => {
                    if (parseInt(receipt.status, 16) === 0) {
                        errorHandler(new TransactionError('Transaction failed', receipt))
                    } else {
                        emitter.emit('receipt', receipt)
                    }
                })
        }, errorHandler)
        .catch(errorHandler)

    return tx
}

type CreateClient = {
    usePublicNode?: boolean,
}

export const createClient = (options: CreateClient = {}) => {
    const { usePublicNode } = {
        usePublicNode: false,
        ...(options || {}),
    }
    const web3 = usePublicNode ? undefined : getWeb3()

    return new StreamrClient({
        url: process.env.STREAMR_WS_URL,
        restUrl: process.env.STREAMR_API_URL,
        tokenAddress: process.env.DATA_TOKEN_CONTRACT_ADDRESS,
        tokenAddressSidechain: process.env.DATA_TOKEN_SIDECHAIN_ADDRESS,
        dataUnion: {
            factoryMainnetAddress: process.env.DATA_UNION_FACTORY_MAINNET_ADDRESS,
            factorySidechainAddress: process.env.DATA_UNION_FACTORY_SIDECHAIN_ADDRESS,
            templateMainnetAddress: process.env.DATA_UNION_TEMPLATE_MAINNET_ADDRESS,
            templateSidechainAddress: process.env.DATA_UNION_TEMPLATE_SIDECHAIN_ADDRESS,
        },
        autoConnect: false,
        autoDisconnect: false,
        auth: {
            sessionToken: getToken(),
            ethereum: web3 && web3.metamaskProvider,
        },
        sidechain: {
            url: process.env.DATA_UNION_SIDECHAIN_PROVIDER,
            chainId: parseInt(process.env.DATA_UNION_SIDECHAIN_ID, 10),
        },
        mainnet: {
            url: process.env.WEB3_PUBLIC_HTTP_PROVIDER,
        },
        streamrNodeAddress: getStreamrEngineAddresses()[0],
    })
}

export const deployDataUnion2 = (productId: ProductId, adminFee: string): SmartContractTransaction => {
    const web3 = getWeb3()
    const emitter = new EventEmitter()
    const errorHandler = (error: Error) => {
        emitter.emit('error', error)
    }
    const tx = new Transaction(emitter)

    const client = createClient()

    Promise.all([
        web3.getDefaultAccount(),
        checkEthereumNetworkIsCorrect(web3),
        client.ensureConnected(),
    ])
        .then(([account]) => {
            // eslint-disable-next-line no-underscore-dangle
            const dataUnion = client._getDataUnionFromName({
                dataUnionName: productId,
                deployerAddress: account,
            })

            return dataUnion.getAddress()
        })
        .then((futureAddress) => {
            // send calculated contract address as the transaction hash,
            // streamr-client doesn't tell us the actual tx hash
            emitter.emit('transactionHash', futureAddress)

            return client.deployDataUnion({
                dataUnionName: productId,
                adminFee: +adminFee,
            })
        })
        .then((dataUnion) => {
            if (!dataUnion || !dataUnion.contractAddress) {
                errorHandler(new TransactionError('Transaction failed'))
            } else {
                emitter.emit('receipt', {
                    contractAddress: dataUnion.getAddress(),
                })
            }
        }, errorHandler)
        .catch(errorHandler)

    return tx
}

export const getDefaultDataUnionVersion = () => (
    parseInt(process.env.DATAUNION_VERSION, 10) === 2 ? 2 : 1
)

type DeployDataUnion = {
    productId: ProductId,
    adminFee: string,
    version?: number,
}

export const deployDataUnion = ({ productId, adminFee, version = 1 }: DeployDataUnion): SmartContractTransaction => {
    if (version !== 2) {
        return deprecated_deployDataUnion(productId, adminFee)
    }

    return deployDataUnion2(productId, adminFee)
}

// eslint-disable-next-line camelcase
const deprecated_getCommunityContract = (address: DataUnionId, usePublicNode: boolean = false) => {
    const { abi } = getConfig().communityProduct

    return getContract({
        abi,
        address,
    }, usePublicNode)
}

export const getDataUnionVersion = async (address: DataUnionId, usePublicNode: boolean = true) => {
    const client = createClient({
        usePublicNode,
    })
    const dataUnion = await client.getDataUnion(address)

    return (dataUnion && dataUnion.getVersion()) || 0
}

// eslint-disable-next-line camelcase
const deprecated_getDataUnionOwner = async (address: DataUnionId, usePublicNode: boolean = false) => {
    const contract = deprecated_getCommunityContract(address, usePublicNode)
    const owner = await call(contract.methods.owner())

    return owner
}

export const getDataUnionOwner = async (address: DataUnionId, usePublicNode: boolean = false) => {
    const version = await getDataUnionVersion(address, usePublicNode)

    if (version === 2) {
        const client = createClient({
            usePublicNode,
        })
        const dataUnion = client.getDataUnion(address)

        return dataUnion.getAdminAddress()
    } else if (version === 1) {
        return deprecated_getDataUnionOwner(address, usePublicNode)
    }

    throw new Error('unknow DU version')
}

// eslint-disable-next-line camelcase
const deprecated_getAdminFee = async (address: DataUnionId, usePublicNode: boolean = false) => {
    const web3 = usePublicNode ? getPublicWeb3() : getWeb3()

    const contract = deprecated_getCommunityContract(address, usePublicNode)
    const adminFee = await call(contract.methods.adminFee())

    return web3.utils.fromWei(web3.utils.toBN(adminFee), 'ether')
}

export const getAdminFee = async (address: DataUnionId, usePublicNode: boolean = false) => {
    const version = await getDataUnionVersion(address, usePublicNode)

    if (version === 2) {
        const client = createClient({
            usePublicNode,
        })
        const dataUnion = client.getDataUnion(address)
        const adminFee = await dataUnion.getAdminFee()

        return `${adminFee}`
    } else if (version === 1) {
        return deprecated_getAdminFee(address, usePublicNode)
    }

    throw new Error('unknow DU version')
}

export const setAdminFee = (address: DataUnionId, adminFee: string): SmartContractTransaction => {
    const web3 = getWeb3()
    const emitter = new EventEmitter()
    const errorHandler = (error: Error) => {
        console.warn(error)
        emitter.emit('error', error)
    }
    const tx = new Transaction(emitter)
    Promise.all([
        web3.getDefaultAccount(),
        getDataUnionVersion(address),
        checkEthereumNetworkIsCorrect(web3),
    ])
        .then(([account, version]) => {
            if (version === 2) {
                const client = createClient()
                const dataUnion = client.getDataUnion(address)

                emitter.emit('transactionHash')

                dataUnion.setAdminFee(+adminFee)
                    .then((receipt) => {
                        if (parseInt(receipt.status, 16) === 0) {
                            errorHandler(new TransactionError('Transaction failed', receipt))
                        } else {
                            emitter.emit('receipt', receipt)
                        }
                    }, errorHandler)
            } else if (version === 1) {
                const method = deprecated_getCommunityContract(address).methods.setAdminFee(deprecated_getAdminFeeInEther(adminFee))
                method.send({
                    from: account,
                })
                    .on('error', (error, receipt) => {
                        if (receipt) {
                            errorHandler(new TransactionError(error.message, receipt))
                        } else {
                            errorHandler(error)
                        }
                    })
                    .on('transactionHash', (hash) => {
                        emitter.emit('transactionHash', hash)
                    })
                    .on('receipt', (receipt) => {
                        if (parseInt(receipt.status, 16) === 0) {
                            errorHandler(new TransactionError('Transaction failed', receipt))
                        } else {
                            emitter.emit('receipt', receipt)
                        }
                    })
                    .catch(errorHandler)
            } else {
                throw new Error('Unknow DU version')
            }
        }, errorHandler)

    return tx
}

// eslint-disable-next-line camelcase
const deprecated_getDataUnionStats = (id: DataUnionId): ApiResult<Object> => get({
    url: routes.api.dataunions.stats({
        id,
    }),
    useAuthorization: false,
})

export const getDataUnionStats = async (id: DataUnionId): ApiResult<Object> => {
    const version = await getDataUnionVersion(id, true)

    if (version === 2) {
        const client = createClient({
            usePublicNode: true,
        })
        const dataUnion = client.getDataUnion(id)

        const stats = await dataUnion.getStats()
        const { activeMemberCount, inactiveMemberCount, totalEarnings } = stats

        const active = (activeMemberCount && BN(activeMemberCount.toString()).toNumber()) || 0
        const inactive = (inactiveMemberCount && BN(inactiveMemberCount.toString()).toNumber()) || 0

        return {
            memberCount: {
                active,
                inactive,
                total: active + inactive,
            },
            totalEarnings: totalEarnings && BN(totalEarnings.toString()).toNumber(),
        }
    } else if (version === 1) {
        return deprecated_getDataUnionStats(id)
    }

    throw new Error('unknow DU version')
}

// eslint-disable-next-line camelcase
const deprecated_getJoinPartStreamId = (address: DataUnionId, usePublicNode: boolean = false) =>
    call(deprecated_getCommunityContract(address, usePublicNode).methods.joinPartStream())

// eslint-disable-next-line camelcase
const deprecated_getDataUnion = async (id: DataUnionId, usePublicNode: boolean = true): ApiResult<Object> => {
    const adminFee = await deprecated_getAdminFee(id, usePublicNode)
    const joinPartStreamId = await deprecated_getJoinPartStreamId(id, usePublicNode)
    const owner = await deprecated_getDataUnionOwner(id, usePublicNode)

    return {
        id: id.toLowerCase(),
        adminFee,
        joinPartStreamId,
        owner,
    }
}

export const getDataUnion = async (id: DataUnionId, usePublicNode: boolean = true): ApiResult<Object> => {
    const version = await getDataUnionVersion(id, usePublicNode)

    if (version === 2) {
        const adminFee = await getAdminFee(id, usePublicNode)
        const owner = await getDataUnionOwner(id, usePublicNode)

        return {
            id: id.toLowerCase(),
            adminFee,
            owner,
            version,
        }
    } else if (version === 1) {
        const du = await deprecated_getDataUnion(id, usePublicNode)

        return {
            ...du,
            version,
        }
    }

    throw new Error('Unknow DU version')
}

const getSidechainWeb3 = () => new Web3(new Web3.providers.HttpProvider(process.env.DATA_UNION_SIDECHAIN_PROVIDER))

const getSidechainContract = async (dataUnionId: string) => {
    const client = createClient({
        usePublicNode: true,
    })
    const dataUnion = client.getDataUnion(dataUnionId)
    const address = await dataUnion.getSidechainAddress()

    const web3 = getSidechainWeb3()
    return new web3.eth.Contract(getConfig().dataUnionSidechainAbi, address)
}

export async function* getSidechainEvents(address: string, eventName: string, fromBlock: number): any {
    const web3 = getSidechainWeb3()
    const contract = await getSidechainContract(address)
    const latestBlock = await web3.eth.getBlock('latest')

    // Get events in batches since xDai RPC seems to timeout if fetching too large sets
    const batchSize = 10000

    for (let blockNumber = fromBlock; blockNumber < latestBlock.number; blockNumber += (batchSize + 1)) {
        let toBlockNumber = blockNumber + batchSize
        if (toBlockNumber > latestBlock.number) {
            toBlockNumber = latestBlock.number
        }

        // eslint-disable-next-line no-await-in-loop
        const events = await contract.getPastEvents(eventName, {
            fromBlock: blockNumber,
            toBlock: toBlockNumber,
        })
        yield events
    }
}

export async function* getJoinsAndParts(id: DataUnionId, fromTimestamp: number): any {
    const web3 = getSidechainWeb3()
    const fromBlock = await getBlockNumberForTimestamp(web3, Math.floor(fromTimestamp / 1000))

    const handleEvent = async (e, type) => {
        // eslint-disable-next-line no-await-in-loop
        const block = await web3.eth.getBlock(e.blockHash)
        if (block && block.timestamp && (block.timestamp * 1000 >= fromTimestamp)) {
            const event = {
                timestamp: block.timestamp * 1000,
                diff: type === 'join' ? 1 : -1,
            }
            return event
        }

        return null
    }

    /* eslint-disable no-restricted-syntax, no-await-in-loop */
    for await (const joins of getSidechainEvents(id, 'MemberJoined', fromBlock)) {
        for (const join of joins) {
            const result = await handleEvent(join, 'join')
            yield result
        }
    }

    for await (const parts of getSidechainEvents(id, 'MemberParted', fromBlock)) {
        for (const part of parts) {
            const result = await handleEvent(part, 'part')
            yield result
        }
    }
    /* eslint-enable no-restricted-syntax, no-await-in-loop */
}

export const getMemberStatistics = async (id: DataUnionId, fromTimestamp: number, toTimestamp: number = Date.now()): Promise<Array<any>> => {
    const accuracy = 'HOUR' // HOUR or DAY
    const result = await post({
        url: `${process.env.THE_GRAPH_API_URL}/subgraphs/name/streamr-dev/dataunion`,
        data: {
            query: `
                query {
                    dataUnionStatsBuckets(
                        where: {
                            type: "${accuracy}",
                            startDate_gte: ${Math.floor(fromTimestamp / 1000)},
                            endDate_lte: ${Math.ceil(toTimestamp / 1000)}
                        },
                        orderBy: startDate,
                    ) {
                        startDate,
                        endDate,
                        memberCountAtStart,
                        memberCountChange,
                    }
                }
            `,
        },
        useAuthorization: false,
    })
    return result.data.dataUnionStatsBuckets
}

export const getDataUnionMembers = async (id: DataUnionId, limit: number = 100): Promise<Array<string>> => {
    const result = await post({
        url: `${process.env.THE_GRAPH_API_URL}/subgraphs/name/streamr-dev/dataunion`,
        data: {
            query: `
                query {
                    dataUnions(where: { mainchainAddress: "${id.toLowerCase()}" }) {
                        members(first: ${Math.floor(limit)}, orderBy: address, orderDirection: asc) {
                            address
                        }
                    }
                }
            `,
        },
        useAuthorization: false,
    })
    if (result.data.dataUnions.length > 0) {
        return result.data.dataUnions[0].members.map((m) => m.address)
    }
    return []
}

export const searchDataUnionMembers = async (id: DataUnionId, query: string, limit: number = 100): Promise<Array<string>> => {
    const result = await post({
        url: `${process.env.THE_GRAPH_API_URL}/subgraphs/name/streamr-dev/dataunion`,
        data: {
            query: `
                query {
                    members(where: { addressString_contains: "${query}"}, first: ${Math.floor(limit)}) {
                        address
                        dataunion {
                            mainchainAddress
                        }
                    }
                }
            `,
        },
        useAuthorization: false,
    })
    if (result && result.data && result.data.members) {
        // With limitations in full text search in The Graph,
        // we cannot do filtering on the query itself so we
        // have to manually pick results only for this dataunion.
        const members = result.data.members
            .filter((m) => m.dataunion.mainchainAddress === id)
            .map((m) => m.address)
        return members
    }
    return []
}

// eslint-disable-next-line camelcase
async function* deprecated_getMemberStatuses(id: DataUnionId, timestampFrom: number = 0): any {
    const dataUnion = await getDataUnion(id)
    const client = createClient()
    await client.ensureConnected()
    const sub = await client.subscribe({
        streamId: dataUnion.joinPartStreamId,
        resend: {
            from: {
                timestamp: timestampFrom,
            },
        },
    })

    /* eslint-disable no-restricted-syntax */
    for await (const msg of sub) {
        if (msg.parsedContent.addresses != null) {
            for (const address of msg.parsedContent.addresses) {
                yield {
                    address,
                    earnings: NaN,
                    withdrawable: NaN,
                    status: 'NOT_AVAILABLE',
                }
            }
        }
    }
    /* eslint-enable no-restricted-syntax */
}

export async function getSelectedMemberStatuses(id: DataUnionId, members: Array<string>): any {
    const statuses = []

    /* eslint-disable no-restricted-syntax, no-await-in-loop */
    for await (const status of getMemberStatusesWithClient(id, members)) {
        statuses.push(status)
    }
    /* eslint-enable no-restricted-syntax, no-await-in-loop */

    return statuses
}

async function* getMemberStatusesWithClient(id: DataUnionId, members: Array<string>): any {
    const client = createClient()

    /* eslint-disable no-restricted-syntax, no-await-in-loop */
    for (const memberAddress of members) {
        const dataUnion = client.getDataUnion(id)
        const memberData = await dataUnion.getMemberStats(memberAddress)
        yield {
            ...memberData,
            address: memberAddress,
        }
    }
    /* eslint-enable no-restricted-syntax, no-await-in-loop */
}

export async function* getMemberStatusesFromTheGraph(id: DataUnionId): any {
    const members = await getDataUnionMembers(id)
    yield* getMemberStatusesWithClient(id, members)
}

export async function* getMemberStatuses(id: DataUnionId): any {
    const version = await getDataUnionVersion(id)

    if (version === 1) {
        yield* deprecated_getMemberStatuses(id)
    } else if (version === 2) {
        yield* getMemberStatusesFromTheGraph(id)
    }
}

export const removeMembers = async (id: DataUnionId, memberAddresses: string[]) => {
    const client = createClient()
    const dataUnion = client.getDataUnion(id)
    const receipt = await dataUnion.removeMembers(memberAddresses)
    return receipt
}

type GetSecrets = {
    dataUnionId: DataUnionId,
}

export const getSecrets = ({ dataUnionId }: GetSecrets): ApiResult<Array<Secret>> => get({
    url: routes.api.dataunions.secrets.index({
        dataUnionId,
    }),
})

type PostSecrect = {
    dataUnionId: DataUnionId,
    name: string,
}

export const postSecret = ({ dataUnionId, name }: PostSecrect): ApiResult<Secret> => post({
    url: routes.api.dataunions.secrets.index({
        dataUnionId,
    }),
    data: {
        name,
    },
})

type PutSecrect = {
    dataUnionId: DataUnionId,
    id: string,
    name: string,
}

export const putSecret = ({ dataUnionId, id, name }: PutSecrect): ApiResult<Secret> => put({
    url: routes.api.dataunions.secrets.show({
        dataUnionId,
        id,
    }),
    data: {
        name,
    },
})

type DeleteSecrect = {
    dataUnionId: DataUnionId,
    id: string,
}

export const deleteSecret = ({ dataUnionId, id }: DeleteSecrect): ApiResult<void> => del({
    url: routes.api.dataunions.secrets.show({
        dataUnionId,
        id,
    }),
})

type GetJoinRequests = {
    dataUnionId: DataUnionId,
    params?: any,
}

export const getJoinRequests = ({ dataUnionId, params }: GetJoinRequests): ApiResult<any> => get({
    url: routes.api.dataunions.joinRequests.index({
        dataUnionId,
    }),
    options: {
        params,
    },
})

type PutJoinRequest = {
    dataUnionId: DataUnionId,
    joinRequestId: string,
    state: 'ACCEPTED' | 'REJECTED' | 'PENDING',
}

export const updateJoinRequest = async ({ dataUnionId, joinRequestId: id, state }: PutJoinRequest): ApiResult<any> => put({
    url: routes.api.dataunions.joinRequests.show({
        dataUnionId,
        id,
    }),
    data: {
        state,
    },
})

type PostJoinRequest = {
    dataUnionId: DataUnionId,
    memberAddress: Address,
}

export const addJoinRequest = async ({ dataUnionId, memberAddress }: PostJoinRequest): ApiResult<any> => post({
    url: routes.api.dataunions.joinRequests.index({
        dataUnionId,
    }),
    data: {
        memberAddress,
    },
})

type DeleteJoinRequest = {
    dataUnionId: DataUnionId,
    joinRequestId: string,
}

export const removeJoinRequest = async ({ dataUnionId, joinRequestId: id }: DeleteJoinRequest): ApiResult<void> => del({
    url: routes.api.dataunions.joinRequests.show({
        dataUnionId,
        id,
    }),
})
