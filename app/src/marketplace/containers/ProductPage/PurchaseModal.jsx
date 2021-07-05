// @flow

import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import type { ProductId, AccessPeriod } from '$mp/flowtype/product-types'

import useModal from '$shared/hooks/useModal'
import useWeb3Status from '$shared/hooks/useWeb3Status'
import { useController } from '$mp/containers/ProductController'
import { usePending } from '$shared/hooks/usePending'
import { purchaseFlowSteps } from '$mp/utils/constants'
import { selectProduct } from '$mp/modules/product/selectors'
import { selectContractProduct, selectContractProductError } from '$mp/modules/contractProduct/selectors'
import { selectDataPerUsd } from '$mp/modules/global/selectors'
import { transactionStates, DEFAULT_CURRENCY, paymentCurrencies, gasLimits } from '$shared/utils/constants'
import useDataUnion from '$mp/containers/ProductController/useDataUnion'
import NoBalanceError from '$mp/errors/NoBalanceError'
import { getBalances } from '$mp/utils/web3'
import PurchaseTransactionProgress from '$mp/components/Modal/PurchaseTransactionProgress'
import PurchaseSummaryDialog from '$mp/components/Modal/PurchaseSummaryDialog'
import PurchaseComplete from '$mp/components/Modal/PurchaseComplete'
import PurchaseError from '$mp/components/Modal/PurchaseError'
import ErrorDialog from '$mp/components/Modal/ErrorDialog'
import NoBalanceDialog from '$mp/components/Modal/NoBalanceDialog'
import ChooseAccessPeriodDialog from '$mp/components/Modal/ChooseAccessPeriodDialog'
import ConnectEthereumAddressDialog from '$mp/components/Modal/ConnectEthereumAddressDialog'
import useIsMounted from '$shared/hooks/useIsMounted'
import useEthereumIdentities from '$shared/modules/integrationKey/hooks/useEthereumIdentities'
import type { Ref, UseStateTuple } from '$shared/flowtype/common-types'
import Web3ErrorDialog from '$shared/components/Web3ErrorDialog'
import { isDataUnionProduct } from '$mp/utils/product'
import usePurchase, { actionsTypes } from './usePurchase'

type Props = {
    productId: ProductId,
    api: Object,
}

export const PurchaseDialog = ({ productId, api }: Props) => {
    const dispatch = useDispatch()
    const { loadContractProduct } = useController()
    const { web3Error, checkingWeb3, account } = useWeb3Status()
    const { isPending: isContractProductLoadPending } = usePending('contractProduct.LOAD')
    const { isPending: isPurchasePending, wrap: wrapPurchase } = usePending('product.PURCHASE')
    const { isPending: isLinkAccountPending, wrap: wrapLinkAccount } = usePending('product.LINK_ACCOUNT')
    const [step, setStep] = useState(null)
    const [purchaseError, setPurchaseError] = useState(null)
    const dataPerUsd = useSelector(selectDataPerUsd)
    const product = useSelector(selectProduct)
    const isMounted = useIsMounted()
    const contractProduct = useSelector(selectContractProduct)
    const contractProductError = useSelector(selectContractProductError)
    const { load: loadEthIdentities, isLinked, connect: connectIdentity } = useEthereumIdentities()
    const accessPeriodParams: Ref<AccessPeriod> = useRef({
        time: '1',
        timeUnit: 'hour',
        paymentCurrency: DEFAULT_CURRENCY,
        price: undefined,
        approxUsd: undefined,
    })
    const [balances, setBalances] = useState({})
    const purchase = usePurchase()
    const [queue, setQueue]: UseStateTuple<any> = useState(undefined)
    const [currentAction, setCurrentAction] = useState(undefined)
    const [status, setStatus] = useState({})
    const [purchaseStarted, setPurchaseStarted] = useState(false)
    const [purchaseTransaction, setPurchaseTransaction] = useState(undefined)
    const dataUnion = useDataUnion()
    const dataUnionRef = useRef()
    const isDataUnion = !!(product && isDataUnionProduct(product))
    dataUnionRef.current = isDataUnion ? dataUnion : undefined

    // Check if current metamask account is linked to Streamr account
    const accountLinked = useMemo(() => !!account && isLinked(account), [isLinked, account])

    // Start loading the contract product & clear allowance state
    useEffect(() => {
        loadEthIdentities()

        loadContractProduct(productId)
            .then(() => {
                if (isMounted()) {
                    setStep(purchaseFlowSteps.ACCESS_PERIOD)
                }
            })
    }, [dispatch, loadEthIdentities, loadContractProduct, productId, isMounted])

    useEffect(() => {
        if (!account) { return }

        getBalances()
            .then(([eth, data, dai]) => {
                setBalances({
                    [paymentCurrencies.ETH]: eth,
                    [paymentCurrencies.DATA]: data,
                    [paymentCurrencies.DAI]: dai,
                })
            })
    }, [account])

    const { pricePerSecond, priceCurrency } = contractProduct || {}

    const onLinkAccount = useCallback(async () => (
        wrapLinkAccount(async () => {
            let succeeded = false

            try {
                await connectIdentity(account || 'Account name')
                succeeded = true
            } catch (e) {
                console.warn(e)
                if (isMounted()) {
                    setPurchaseError(e)
                }
            } finally {
                if (isMounted()) {
                    // continue with purchase
                    if (succeeded) {
                        setStep(purchaseFlowSteps.SUMMARY)
                    }
                }
            }
        })
    ), [wrapLinkAccount, account, isMounted, connectIdentity])

    const onSetAccessPeriod = useCallback(async (accessPeriod: AccessPeriod) => {
        accessPeriodParams.current = accessPeriod

        if (accountLinked) {
            setStep(purchaseFlowSteps.SUMMARY)
        } else {
            setStep(purchaseFlowSteps.LINK_ACCOUNT)
        }
    }, [accountLinked])

    const onApprovePurchase = useCallback(async () => (
        wrapPurchase(async () => {
            if (!accessPeriodParams.current) {
                throw new Error('Product and access data should be defined!')
            }

            try {
                const { version } = dataUnionRef.current || {}

                const { queue: nextQueue } = await purchase({
                    contractProduct,
                    accessPeriod: accessPeriodParams.current,
                    dataPerUsd,
                    // Buying a DU2 product requires more gas
                    gasIncrease: version === 2 ? gasLimits.BUY_PRODUCT_DU2_INCREASE : 0,
                })

                if (isMounted()) {
                    setStep(purchaseFlowSteps.PROGRESS)
                    setQueue(nextQueue)
                }
            } catch (e) {
                console.warn(e)
                if (isMounted()) {
                    setPurchaseError(e)
                }
            }
        })
    ), [wrapPurchase, purchase, contractProduct, dataPerUsd, isMounted])

    useEffect(() => {
        if (!queue) { return () => {} }

        setStatus(queue.getActions().reduce((result, { id }) => ({
            ...result,
            [id]: transactionStates.STARTED,
        }), {}))
        setPurchaseTransaction(undefined)
        setPurchaseStarted(true)

        queue
            .subscribe('started', (id) => {
                if (isMounted()) {
                    setCurrentAction(id)
                }
            })
            .subscribe('status', (id, nextStatus, hash) => {
                if (isMounted()) {
                    setStatus((prevStatus) => ({
                        ...prevStatus,
                        [id]: nextStatus,
                    }))

                    if (id === actionsTypes.SUBSCRIPTION && nextStatus === transactionStates.PENDING && !!hash) {
                        setPurchaseTransaction(hash)
                    }
                }
            })
            .start()

        return () => {
            queue.unsubscribeAll()
        }
    }, [queue, isMounted])

    const allSucceeded = useMemo(() => Object.values(status).every((value) => (
        value === transactionStates.CONFIRMED
    )), [status])
    const allCompleted = useMemo(() => Object.values(status).every((value) => (
        value === transactionStates.CONFIRMED || value === transactionStates.FAILED
    )), [status])

    useEffect(() => {
        if (!purchaseStarted || !allCompleted) { return }

        setTimeout(() => {
            if (isMounted()) {
                setStep(purchaseFlowSteps.COMPLETE)
            }
        }, 500)
    }, [purchaseStarted, allCompleted, isMounted])

    const onClose = useCallback(({ viewInCore = false }: { viewInCore?: boolean } = {}) => {
        api.close({
            started: purchaseStarted,
            succeeded: allSucceeded,
            viewInCore,
        })
    }, [api, purchaseStarted, allSucceeded])

    if (!isContractProductLoadPending && !checkingWeb3 && web3Error) {
        return (
            <Web3ErrorDialog
                onClose={onClose}
                error={web3Error}
            />
        )
    }

    const {
        paymentCurrency,
        time,
        timeUnit,
        price,
        approxUsd,
    } = accessPeriodParams.current || {}

    if (!isContractProductLoadPending && !checkingWeb3 && (purchaseError || contractProductError)) {
        if (purchaseError instanceof NoBalanceError) {
            return (
                <NoBalanceDialog
                    onCancel={onClose}
                    required={purchaseError.getRequired()}
                    balances={purchaseError.getBalances()}
                    paymentCurrency={paymentCurrency}
                />
            )
        }

        return (
            <ErrorDialog
                title="An error occurred"
                message={(purchaseError || contractProductError).message}
                onClose={onClose}
            />
        )
    }

    if (step === purchaseFlowSteps.ACCESS_PERIOD) {
        return (
            <ChooseAccessPeriodDialog
                dataPerUsd={dataPerUsd}
                pricePerSecond={pricePerSecond}
                priceCurrency={priceCurrency}
                balances={balances}
                onCancel={onClose}
                onNext={onSetAccessPeriod}
                disabled={checkingWeb3}
                initialValues={{
                    paymentCurrency,
                    time,
                    timeUnit,
                    price,
                    approxUsd,
                }}
            />
        )
    }

    if (step === purchaseFlowSteps.LINK_ACCOUNT) {
        return (
            <ConnectEthereumAddressDialog
                onCancel={onClose}
                onSet={onLinkAccount}
                waiting={isLinkAccountPending}
            />
        )
    }

    if (step === purchaseFlowSteps.SUMMARY) {
        return (
            <PurchaseSummaryDialog
                waiting={isPurchasePending}
                name={product.name}
                time={time}
                timeUnit={timeUnit}
                price={price}
                approxUsd={approxUsd}
                onBack={() => setStep(purchaseFlowSteps.ACCESS_PERIOD)}
                onCancel={onClose}
                onPay={onApprovePurchase}
                paymentCurrency={paymentCurrency}
            />
        )
    }

    if (step === purchaseFlowSteps.PROGRESS) {
        return (
            <PurchaseTransactionProgress
                status={status}
                onCancel={onClose}
                prompt={currentAction && status[currentAction] === transactionStates.STARTED ? currentAction : undefined}
            />
        )
    }

    if (step === purchaseFlowSteps.COMPLETE) {
        if (allSucceeded) {
            return (
                <PurchaseComplete
                    onClose={onClose}
                    onContinue={() => onClose({
                        viewInCore: true,
                    })}
                    txHash={purchaseTransaction}
                />
            )
        }

        return (
            <PurchaseError
                status={status}
                onClose={onClose}
            />
        )
    }

    return null
}

export default () => {
    const { isOpen, api, value } = useModal('purchase')

    if (!isOpen) {
        return null
    }

    const { productId } = value || {}

    return (
        <PurchaseDialog
            productId={productId}
            api={api}
        />
    )
}
