// @flow

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Translate } from 'react-redux-i18n'

import type { Product } from '$mp/flowtype/product-types'
import { transactionStates } from '$shared/utils/constants'
import useModal from '$shared/hooks/useModal'
import { getProductById } from '$mp/modules/product/services'
import { areAddressesEqual } from '$mp/utils/smartContract'

import ErrorDialog from '$mp/components/Modal/ErrorDialog'
import Dialog from '$shared/components/Dialog'
import ReadyToPublishDialog from '$mp/components/Modal/ReadyToPublishDialog'
import ReadyToUnpublishDialog from '$mp/components/Modal/ReadyToUnpublishDialog'
import PublishTransactionProgress from '$mp/components/Modal/PublishTransactionProgress'
import PublishComplete from '$mp/components/Modal/PublishComplete'
import Web3ErrorDialog from '$shared/components/Web3ErrorDialog'
import useWeb3Status from '$shared/hooks/useWeb3Status'
import UnlockWalletDialog from '$shared/components/Web3ErrorDialog/UnlockWalletDialog'
import usePublish, { publishModes } from './usePublish'

type Props = {
    product: Product,
    api: Object,
}

const steps = {
    CONFIRM: 'confirm',
    ACTIONS: 'actions',
    COMPLETE: 'complete',
}

export const PublishOrUnpublishModal = ({ product, api }: Props) => {
    const { publish } = usePublish()
    const publishRef = useRef(publish)
    publishRef.current = publish

    const [queue, setQueue] = useState(undefined)
    const [mode, setMode] = useState(null)
    const [step, setStep] = useState(steps.CONFIRM)
    const [currentAction, setCurrentAction] = useState(undefined)
    const [status, setStatus] = useState({})
    const [modalError, setModalError] = useState(null)
    const [requireWeb3, setRequireWeb3] = useState(false)
    const [requiredOwner, setRequiredOwner] = useState(null)
    const [web3Actions, setWeb3Actions] = useState(new Set([]))
    const { web3Error, checkingWeb3, account } = useWeb3Status(requireWeb3)

    const setActionStatus = useCallback((name, s) => {
        setStatus((prevStatus) => ({
            ...prevStatus,
            [name]: s,
        }))
    }, [setStatus])

    const productId = product.id

    useEffect(() => {
        if (!productId || !publishRef.current) { return }

        try {
            getProductById(productId || '')
                .then(publishRef.current)
                .then(
                    ({ queue: nextQueue, mode: nextMode }) => {
                        setMode(nextMode)
                        setQueue(nextQueue)
                    },
                    (e) => {
                        setModalError(e)
                    },
                )
        } catch (e) {
            setModalError(e)
        }
    }, [productId])

    useEffect(() => {
        if (!queue) { return () => {} }

        const owners = queue.needsOwner()
        // validate metamask based on queued actions
        setRequireWeb3(queue.needsWeb3())
        setRequiredOwner(owners && owners.length > 0 && owners[0])

        setStatus(queue.getActions().reduce((result, { id }) => ({
            ...result,
            [id]: transactionStates.STARTED,
        }), {}))
        setWeb3Actions(new Set(queue.getActions().filter(({ requireWeb3: isTransaction }) => !!isTransaction).map(({ id }) => id)))

        queue
            .subscribe('started', (id) => {
                setCurrentAction(id)
            })
            .subscribe('status', (id, nextStatus) => {
                setActionStatus(id, nextStatus)
            })
            .subscribe('finish', () => {
                setStep((currentStep) => (currentStep !== steps.COMPLETE ? steps.COMPLETE : currentStep))
            })

        return () => {
            queue.unsubscribeAll()
        }
    }, [setActionStatus, queue])

    const onClose = useCallback(({ showPublishedProduct = false }: { showPublishedProduct?: boolean } = {}) => {
        api.close({
            isUnpublish: mode === publishModes.UNPUBLISH,
            succeeded: Object.values(status).every((value) => value === transactionStates.CONFIRMED),
            showPublishedProduct,
        })
    }, [api, mode, status])

    const onConfirm = useCallback(() => {
        setStep(steps.ACTIONS)
        if (queue) {
            queue.start()
        }
    }, [queue, setStep])

    if (!!requireWeb3 && (checkingWeb3 || web3Error)) {
        return (
            <Web3ErrorDialog
                waiting={checkingWeb3}
                onClose={onClose}
                error={web3Error}
            />
        )
    }

    if (!!requireWeb3 && !!requiredOwner && (!account || !areAddressesEqual(account, requiredOwner))) {
        return (
            <UnlockWalletDialog onClose={onClose} requiredAddress={requiredOwner}>
                <Translate
                    value="unlockWalletDialog.message"
                    tag="p"
                />
            </UnlockWalletDialog>
        )
    }

    if (modalError) {
        return (
            <ErrorDialog
                message={modalError.message}
                onClose={onClose}
            />
        )
    }

    if (step === steps.CONFIRM) {
        if (!mode) {
            return (
                <Dialog
                    waiting
                    onClose={onClose}
                />
            )
        }

        const ConfirmComponent = (mode === publishModes.UNPUBLISH) ? ReadyToUnpublishDialog : ReadyToPublishDialog

        return (
            <ConfirmComponent
                onContinue={onConfirm}
                onCancel={onClose}
            />
        )
    } else if (mode && step === steps.ACTIONS) {
        return (
            <PublishTransactionProgress
                publishMode={mode}
                status={status}
                onCancel={onClose}
                isPrompted={web3Actions.has(currentAction) && currentAction && status[currentAction] === transactionStates.STARTED}
            />
        )
    } else if (mode && step === steps.COMPLETE) {
        return (
            <PublishComplete
                publishMode={mode}
                onContinue={() => onClose({
                    showPublishedProduct: true,
                })}
                onClose={onClose}
                productId={productId || ''}
            />
        )
    }

    return null
}

export default () => {
    const { isOpen, api, value } = useModal('publish')

    if (!isOpen) {
        return null
    }

    const { product } = value || {}

    return (
        <PublishOrUnpublishModal
            product={product}
            api={api}
        />
    )
}
