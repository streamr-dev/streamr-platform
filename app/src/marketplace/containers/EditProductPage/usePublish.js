// @flow

import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import type { Product } from '$mp/flowtype/product-types'
import { productStates, transactionStates, transactionTypes } from '$shared/utils/constants'

import {
    getProductFromContract,
    createContractProduct,
    updateContractProduct,
    deleteProduct,
    redeployProduct,
    setRequiresWhitelist,
} from '$mp/modules/contractProduct/services'
import {
    putProduct,
    postUndeployFree,
    postSetUndeploying,
    postDeployFree,
    postSetDeploying,
} from '$mp/modules/product/services'
import { getAllStreams } from '$mp/modules/streams/services'

import { getDataUnionOwner, getAdminFee, setAdminFee } from '$mp/modules/dataUnion/services'
import { isUpdateContractProductRequired } from '$mp/utils/smartContract'
import ActionQueue from '$mp/utils/actionQueue'
import { isPaidProduct } from '$mp/utils/product'
import { addTransaction } from '$mp/modules/transactions/actions'
import Activity, { actionTypes, resourceTypes } from '$shared/utils/Activity'
import { getPendingChanges, withPendingChanges } from './state'

export const actionsTypes = {
    UPDATE_ADMIN_FEE: 'updateAdminFee',
    UPDATE_CONTRACT_PRODUCT: 'updateContractProduct',
    CREATE_CONTRACT_PRODUCT: 'createContractProduct',
    REDEPLOY_PAID: 'publishPaid',
    UNDEPLOY_CONTRACT_PRODUCT: 'undeployContractProduct',
    PUBLISH_FREE: 'publishFree',
    UNPUBLISH_FREE: 'unpublishFree',
    PUBLISH_PENDING_CHANGES: 'publishPendingChanges',
    SET_REQUIRES_WHITELIST: 'setRequiresWhitelist',
}

export const publishModes = {
    REPUBLISH: 'republish', // live product update
    REDEPLOY: 'redeploy', // unpublished, but published at least once
    PUBLISH: 'publish', // unpublished, publish for the first time
    UNPUBLISH: 'unpublish',
    ERROR: 'error',
}

export type PublishMode = $Values<typeof publishModes>

export default function usePublish() {
    const dispatch = useDispatch()

    return useCallback(async (product: Product) => {
        if (!product) {
            throw new Error('no product')
        }

        // load contract product
        let contractProduct
        try {
            contractProduct = await getProductFromContract(product.id || '', true)
        } catch (e) {
            // don't need to do anything with this error necessarily,
            // it just means that the product wasn't deployed
        }

        let currentAdminFee
        let dataUnionOwner
        try {
            currentAdminFee = await getAdminFee(product.beneficiaryAddress)
            dataUnionOwner = await getDataUnionOwner(product.beneficiaryAddress)
        } catch (e) {
            // ignore error, assume contract has not been deployed
        }

        const { state: productState } = product

        const pendingChanges = getPendingChanges(product)
        const productWithPendingChanges = withPendingChanges(product)
        const {
            adminFee,
            pricePerSecond,
            beneficiaryAddress,
            priceCurrency,
            requiresWhitelist,
            ...productDataChanges
        } = pendingChanges || {}
        const hasAdminFeeChanged = !!currentAdminFee && adminFee && currentAdminFee !== adminFee
        const hasPriceChanged = !!contractProduct && isUpdateContractProductRequired(contractProduct, productWithPendingChanges)
        const hasRequireWhitelistChanged = !!(
            !!contractProduct &&
            requiresWhitelist !== undefined &&
            contractProduct.requiresWhitelist !== requiresWhitelist
        )
        const hasPendingChanges = Object.keys(productDataChanges).length > 0 || hasAdminFeeChanged || hasPriceChanged || hasRequireWhitelistChanged

        let nextMode

        // is published and has pending changes?
        if (productState === productStates.DEPLOYED) {
            nextMode = hasPendingChanges ? publishModes.REPUBLISH : publishModes.UNPUBLISH
        } else if (productState === productStates.NOT_DEPLOYED) {
            nextMode = contractProduct ? publishModes.REDEPLOY : publishModes.PUBLISH
        } else {
            // product is either being deployed to contract or being undeployed
            throw new Error('Invalid product state')
        }

        const queue = new ActionQueue()

        // update product data if needed
        if (nextMode === publishModes.REPUBLISH || (nextMode === publishModes.PUBLISH && Object.keys(pendingChanges).length > 0)) {
            const nextProduct = {
                ...product,
                ...productDataChanges,
                pendingChanges: undefined,
            }
            delete nextProduct.state

            queue.add({
                id: actionsTypes.PUBLISH_PENDING_CHANGES,
                handler: async (update, done) => {
                    try {
                        // Get all streams and verify that the added streams actually exist,
                        // otherwise the product update will fail
                        const streams = await getAllStreams()
                        const streamIds = new Set(streams.map(({ id }) => id))
                        nextProduct.streams = (nextProduct.streams || []).filter((id) => streamIds.has(id))

                        await putProduct(nextProduct, product.id || '')

                        update(transactionStates.CONFIRMED)
                        done()
                    } catch (e) {
                        update(transactionStates.FAILED, e)
                        done()
                    }

                    return null
                },
            })
        }

        // update admin fee if it has changed
        if ([publishModes.REPUBLISH, publishModes.REDEPLOY, publishModes.PUBLISH].includes(nextMode)) {
            if (adminFee && hasAdminFeeChanged) {
                queue.add({
                    id: actionsTypes.UPDATE_ADMIN_FEE,
                    requireWeb3: true,
                    requireOwner: dataUnionOwner,
                    handler: (update, done) => {
                        try {
                            return setAdminFee(product.beneficiaryAddress, adminFee)
                                .onTransactionHash((hash) => {
                                    update(transactionStates.PENDING)
                                    if (hash) {
                                        dispatch(addTransaction(hash, transactionTypes.UPDATE_ADMIN_FEE))
                                    }
                                    done()
                                })
                                .onTransactionComplete(() => {
                                    update(transactionStates.CONFIRMED)
                                })
                                .onError((error) => {
                                    done()
                                    update(transactionStates.FAILED, error)
                                })
                        } catch (e) {
                            done()
                            update(transactionStates.FAILED, e)
                        }

                        return null
                    },
                })
            }
        }

        // update whitelist enabled status if it has changed
        if ([publishModes.REPUBLISH, publishModes.REDEPLOY].includes(nextMode)) {
            if (hasRequireWhitelistChanged && contractProduct) {
                queue.add({
                    id: actionsTypes.SET_REQUIRES_WHITELIST,
                    requireWeb3: true,
                    requireOwner: contractProduct.ownerAddress,
                    handler: (update, done) => (
                        setRequiresWhitelist(product.id || '', requiresWhitelist)
                            .onTransactionHash((hash) => {
                                update(transactionStates.PENDING)
                                dispatch(addTransaction(hash, transactionTypes.SET_REQUIRES_WHITELIST))
                                done()
                            })
                            .onTransactionComplete(() => {
                                update(transactionStates.CONFIRMED)
                            })
                            .onError((error) => {
                                done()
                                update(transactionStates.FAILED, error)
                            })
                    ),
                })
            }
        }

        // update price, currency & beneficiary if changed
        if ([publishModes.REPUBLISH, publishModes.REDEPLOY].includes(nextMode)) {
            if (hasPriceChanged && contractProduct) {
                const isRedeploy = !!(nextMode === publishModes.REDEPLOY)

                queue.add({
                    id: actionsTypes.UPDATE_CONTRACT_PRODUCT,
                    requireWeb3: true,
                    requireOwner: contractProduct.ownerAddress,
                    handler: (update, done) => {
                        if (!contractProduct) {
                            return null
                        }

                        try {
                            return updateContractProduct({
                                ...contractProduct,
                                pricePerSecond: pricePerSecond || product.pricePerSecond,
                                beneficiaryAddress: beneficiaryAddress || product.beneficiaryAddress,
                                priceCurrency: priceCurrency || product.priceCurrency,
                            }, isRedeploy)
                                .onTransactionHash((hash) => {
                                    update(transactionStates.PENDING)
                                    done()
                                    dispatch(addTransaction(hash, transactionTypes.UPDATE_CONTRACT_PRODUCT))

                                    if (isRedeploy) {
                                        postSetDeploying(product.id || '', hash)
                                    }
                                    Activity.push({
                                        action: actionTypes.PUBLISH,
                                        txHash: hash,
                                        resourceId: product.id,
                                        resourceType: resourceTypes.PRODUCT,
                                    })
                                })
                                .onTransactionComplete(() => {
                                    update(transactionStates.CONFIRMED)
                                })
                                .onError((error) => {
                                    done()
                                    update(transactionStates.FAILED, error)
                                })
                        } catch (e) {
                            done()
                            update(transactionStates.FAILED, e)
                        }

                        return null
                    },
                })
            }
        }

        // do the actual publish action
        if (nextMode === publishModes.PUBLISH) {
            if (isPaidProduct(product)) {
                // TODO: figure out a better to detect if deploying data union for the first time
                // force data union product to be published by the same account as the data union itself
                queue.add({
                    id: actionsTypes.CREATE_CONTRACT_PRODUCT,
                    requireWeb3: true,
                    requireOwner: dataUnionOwner,
                    handler: (update, done) => {
                        try {
                            return createContractProduct({
                                id: product.id || '',
                                name: product.name,
                                beneficiaryAddress: product.beneficiaryAddress,
                                pricePerSecond: product.pricePerSecond,
                                priceCurrency: product.priceCurrency,
                                minimumSubscriptionInSeconds: product.minimumSubscriptionInSeconds,
                                state: product.state,
                                ownerAddress: '', // owner address is not needed when creating
                                requiresWhitelist,
                            })
                                .onTransactionHash((hash) => {
                                    update(transactionStates.PENDING)
                                    done()
                                    dispatch(addTransaction(hash, transactionTypes.CREATE_CONTRACT_PRODUCT))
                                    postSetDeploying(product.id || '', hash)

                                    Activity.push({
                                        action: actionTypes.PUBLISH,
                                        txHash: hash,
                                        resourceId: product.id,
                                        resourceType: resourceTypes.PRODUCT,
                                    })
                                })
                                .onTransactionComplete(() => {
                                    update(transactionStates.CONFIRMED)
                                })
                                .onError((error) => {
                                    update(transactionStates.FAILED, error)
                                    done()
                                })
                        } catch (e) {
                            update(transactionStates.FAILED, e)
                            done()
                        }

                        return null
                    },
                })
            } else {
                queue.add({
                    id: actionsTypes.PUBLISH_FREE,
                    handler: (update, done) => {
                        try {
                            return postDeployFree(product.id || '').then(() => {
                                update(transactionStates.CONFIRMED)
                                done()

                                Activity.push({
                                    action: actionTypes.PUBLISH,
                                    resourceId: product.id,
                                    resourceType: resourceTypes.PRODUCT,
                                })
                            }, (error) => {
                                update(transactionStates.FAILED, error)
                                done()
                            })
                        } catch (e) {
                            update(transactionStates.FAILED, e)
                            done()
                        }

                        return null
                    },
                })
            }
        }

        // do a separate republish for products that have been at some point deployed
        // and we didn't do a contract update above
        if (nextMode === publishModes.REDEPLOY && !hasPriceChanged && contractProduct) {
            queue.add({
                id: actionsTypes.REDEPLOY_PAID,
                requireWeb3: true,
                requireOwner: contractProduct.ownerAddress,
                handler: (update, done) => {
                    try {
                        return redeployProduct(product.id || '')
                            .onTransactionHash((hash) => {
                                update(transactionStates.PENDING)
                                done()
                                dispatch(addTransaction(hash, transactionTypes.REDEPLOY_PRODUCT))
                                postSetDeploying(product.id || '', hash)

                                Activity.push({
                                    action: actionTypes.PUBLISH,
                                    txHash: hash,
                                    resourceId: product.id,
                                    resourceType: resourceTypes.PRODUCT,
                                })
                            })
                            .onTransactionComplete(() => {
                                update(transactionStates.CONFIRMED)
                            })
                            .onError((error) => {
                                update(transactionStates.FAILED, error)
                                done()
                            })
                    } catch (e) {
                        update(transactionStates.FAILED, e)
                        done()
                    }

                    return null
                },
            })
        }

        // do unpublish
        if (nextMode === publishModes.UNPUBLISH) {
            if (contractProduct) {
                queue.add({
                    id: actionsTypes.UNDEPLOY_CONTRACT_PRODUCT,
                    requireWeb3: true,
                    requireOwner: contractProduct.ownerAddress,
                    handler: (update, done) => {
                        try {
                            return deleteProduct(product.id || '')
                                .onTransactionHash((hash) => {
                                    update(transactionStates.PENDING)
                                    done()
                                    dispatch(addTransaction(hash, transactionTypes.UNDEPLOY_PRODUCT))
                                    postSetUndeploying(product.id || '', hash)

                                    Activity.push({
                                        action: actionTypes.UNPUBLISH,
                                        resourceId: product.id,
                                        resourceType: resourceTypes.PRODUCT,
                                    })
                                })
                                .onTransactionComplete(() => {
                                    update(transactionStates.CONFIRMED)
                                })
                                .onError((error) => {
                                    update(transactionStates.FAILED, error)
                                    done()
                                })
                        } catch (e) {
                            update(transactionStates.FAILED, e)
                            done()
                        }

                        return null
                    },
                })
            } else {
                queue.add({
                    id: actionsTypes.UNPUBLISH_FREE,
                    handler: (update, done) => {
                        try {
                            return postUndeployFree(product.id || '').then(() => {
                                update(transactionStates.CONFIRMED)
                                done()

                                Activity.push({
                                    action: actionTypes.UNPUBLISH,
                                    resourceId: product.id,
                                    resourceType: resourceTypes.PRODUCT,
                                })
                            }, (error) => {
                                update(transactionStates.FAILED, error)
                                done()
                            })
                        } catch (e) {
                            update(transactionStates.FAILED, e)
                            done()
                        }

                        return null
                    },
                })
            }
        }

        return {
            mode: nextMode,
            queue,
        }
    }, [dispatch])
}
