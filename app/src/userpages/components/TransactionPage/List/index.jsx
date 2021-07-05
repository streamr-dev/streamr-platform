// @flow

import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import BN from 'bignumber.js'
import { titleize } from '@streamr/streamr-layout'
import styled from 'styled-components'

import { CoreHelmet } from '$shared/components/Helmet'
import Layout from '$userpages/components/Layout'
import * as transactionActions from '$userpages/modules/transactionHistory/actions'
import {
    selectVisibleTransactions,
    selectTransactionEvents,
    selectOffset,
    selectFetching as selectFetchingTransactions,
} from '$userpages/modules/transactionHistory/selectors'
import { selectFetching as selectFetchingProducts } from '$mp/modules/myProductList/selectors'
import { selectEntities } from '$shared/modules/entities/selectors'
import { getMyProducts } from '$mp/modules/myProductList/actions'
import Popover from '$shared/components/Popover'
import LoadMore from '$mp/components/LoadMore'
import DocsShortcuts from '$userpages/components/DocsShortcuts'
import ListContainer from '$shared/components/Container/List'
import { ago } from '$shared/utils/time'
import useCopy from '$shared/hooks/useCopy'
import { truncate } from '$shared/utils/text'
import Notification from '$shared/utils/Notification'
import { formatDecimals } from '$mp/utils/price'
import { transactionTypes, paymentCurrencies, NotificationIcon } from '$shared/utils/constants'
import { fromAtto } from '$mp/utils/math'
import { TransactionList as TransactionListComponent } from '$shared/components/List'
import StatusIcon from '$shared/components/StatusIcon'
import { MD, LG } from '$shared/utils/styled'
import Search from '$userpages/components/Header/Search'
import routes from '$routes'
import NoTransactionsView from './NoTransactions'

const StyledListContainer = styled(ListContainer)`
    && {
        padding: 0;
        margin-bottom: 4em;
    }

    @media (min-width: ${MD}px) {
        && {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
        }
    }

    @media (min-width: ${LG}px) {
        && {
            margin-bottom: 0;
        }
    }
`

const mapState = (state) => {
    switch (state) {
        case 'ok':
            return StatusIcon.OK
        case 'error':
            return StatusIcon.ERROR
        default:
            return StatusIcon.INACTIVE
    }
}

const statusLabels = {
    pending: 'Pending',
    ok: 'Confirmed',
    error: 'Failed',
}

const eventTypes = {
    createContractProduct: 'Publish',
    undeployProduct: 'Unpublish',
    redeployProduct: 'Republish',
    subscription: 'Subscription',
    payment: 'Payment',
    updateContractProduct: 'Update',
}

const TransactionList = () => {
    const dispatch = useDispatch()

    const { copy } = useCopy()

    const copyToClipboard = useCallback((text) => {
        copy(text)

        Notification.push({
            title: 'TX hash copied',
            icon: NotificationIcon.CHECKMARK,
        })
    }, [copy])

    const offset = useSelector(selectOffset)
    const events = useSelector(selectTransactionEvents) || []
    const transactions = useSelector(selectVisibleTransactions)
    const fetchingTransactions = useSelector(selectFetchingTransactions)
    const fetchingProducts = useSelector(selectFetchingProducts)
    const { contractProducts: products } = useSelector(selectEntities)
    const hasMoreResults = events.length > 0 && events.length > (offset + 10)

    const clearTransactionList = useCallback(() => dispatch(transactionActions.clearTransactionList()), [dispatch])
    const getTransactionEvents = useCallback(() => dispatch(transactionActions.getTransactionEvents()), [dispatch])
    const showEvents = useCallback(() => dispatch(transactionActions.showEvents()), [dispatch])
    const openInEtherscan = useCallback((tx: string) => {
        window.open(routes.etherscanTransaction({
            tx,
        }), '_blank')
    }, [])

    const loadProducts = useCallback(() => dispatch(getMyProducts({
        id: '',
    })), [dispatch])

    useEffect(() => {
        clearTransactionList()

        Promise.all([
            loadProducts(),
        ])
            .then(getTransactionEvents)
    }, [clearTransactionList, loadProducts, getTransactionEvents])

    const isLoading = !!(fetchingTransactions || fetchingProducts)

    return (
        <Layout
            loading={isLoading}
            headerSearchComponent={
                <Search.Disabled />
            }
        >
            <CoreHelmet title="Transactions" />
            <StyledListContainer>
                {!isLoading && transactions && transactions.length <= 0 && (
                    <NoTransactionsView />
                )}
                {transactions && transactions.length > 0 && (
                    <TransactionListComponent>
                        <TransactionListComponent.Header>
                            <TransactionListComponent.HeaderItem>
                                Name
                            </TransactionListComponent.HeaderItem>
                            <TransactionListComponent.HeaderItem>
                                Type
                            </TransactionListComponent.HeaderItem>
                            <TransactionListComponent.HeaderItem>
                                Transaction
                            </TransactionListComponent.HeaderItem>
                            <TransactionListComponent.HeaderItem>
                                When
                            </TransactionListComponent.HeaderItem>
                            <TransactionListComponent.HeaderItem>
                                Value
                            </TransactionListComponent.HeaderItem>
                            <TransactionListComponent.HeaderItem>
                                Gas
                            </TransactionListComponent.HeaderItem>
                            <TransactionListComponent.HeaderItem center>
                                Status
                            </TransactionListComponent.HeaderItem>
                        </TransactionListComponent.Header>
                        {transactions.map(({
                            id,
                            productId,
                            hash,
                            timestamp,
                            gasUsed,
                            gasPrice,
                            state,
                            type,
                            value,
                            paymentValue,
                            paymentCurrency,
                        }) => {
                            const productTitle = (id && productId && products[productId]) ?
                                products[productId].name : '-'
                            const eventType = (!!type && eventTypes[type]) || ''
                            const price = BN(value)
                            const pricePrefix = type === transactionTypes.SUBSCRIPTION ? '-' : '+'
                            const displayPrice = `${formatDecimals(fromAtto(price), paymentCurrencies.DATA)} DATA`

                            let displayPayment = ''
                            if ((paymentCurrency === paymentCurrencies.ETH || paymentCurrency === paymentCurrencies.DAI) && paymentValue) {
                                displayPayment = ` (${formatDecimals(fromAtto(paymentValue), paymentCurrency)} ${paymentCurrency})`
                            }

                            return (
                                <TransactionListComponent.Row
                                    key={id}
                                    id={id}
                                >
                                    <TransactionListComponent.Title
                                        /* eslint-disable-next-line max-len */
                                        description={`${eventType} ${pricePrefix}${displayPrice} ${displayPayment} (Gas: ${gasUsed} / ${gasPrice})`}
                                        moreInfo={timestamp ? titleize(ago(new Date(timestamp))) : '-'}
                                    >
                                        {productTitle}
                                    </TransactionListComponent.Title>
                                    <TransactionListComponent.Item>
                                        {eventType}
                                    </TransactionListComponent.Item>
                                    <TransactionListComponent.Item title={hash}>
                                        {truncate(hash)}
                                    </TransactionListComponent.Item>
                                    <TransactionListComponent.Item>
                                        {timestamp ? titleize(ago(new Date(timestamp))) : '-'}
                                    </TransactionListComponent.Item>
                                    <TransactionListComponent.Item>
                                        {pricePrefix}
                                        {displayPrice}
                                        {displayPayment}
                                    </TransactionListComponent.Item>
                                    <TransactionListComponent.Item>
                                        {gasUsed} / {gasPrice}
                                    </TransactionListComponent.Item>
                                    <TransactionListComponent.Item>
                                        <StatusIcon
                                            status={mapState(state)}
                                            tooltip={statusLabels[state]}
                                        />
                                    </TransactionListComponent.Item>
                                    <TransactionListComponent.Actions>
                                        <Popover
                                            title="Actions"
                                            type="meatball"
                                            menuProps={{
                                                right: true,
                                            }}
                                            caret={false}
                                        >
                                            <Popover.Item onClick={() => openInEtherscan(hash)}>
                                                View on Etherscan
                                            </Popover.Item>
                                            <Popover.Item onClick={() => copyToClipboard(hash)}>
                                                Copy TX hash
                                            </Popover.Item>
                                        </Popover>
                                    </TransactionListComponent.Actions>
                                </TransactionListComponent.Row>
                            )
                        })}
                    </TransactionListComponent>
                )}
                {!fetchingTransactions && (
                    <LoadMore
                        hasMoreSearchResults={hasMoreResults}
                        onClick={showEvents}
                        preserveSpace
                    />
                )}
            </StyledListContainer>
            <DocsShortcuts />
        </Layout>
    )
}

export default TransactionList
