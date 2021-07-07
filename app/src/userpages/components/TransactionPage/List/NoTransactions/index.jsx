// @flow

import React from 'react'

import EmptyState from '$shared/components/EmptyState'
import emptyStateIcon from '$shared/assets/images/empty_state_icon.png'
import emptyStateIcon2x from '$shared/assets/images/empty_state_icon@2x.png'

const NoTransactionsView = () => (
    <EmptyState
        image={(
            <img
                src={emptyStateIcon}
                srcSet={`${emptyStateIcon2x} 2x`}
                alt="Not found"
            />
        )}
    >
        <p>
            <span>No transactions.</span>
            <small>
                You haven&apos;t made any transactions yet.
            </small>
        </p>
    </EmptyState>
)

export default NoTransactionsView
