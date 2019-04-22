// @flow

import React from 'react'
import { Translate, I18n } from 'react-redux-i18n'

import EmptyState from '$shared/components/EmptyState'
import emptyStateIcon from '$shared/assets/images/empty_state_icon.png'
import emptyStateIcon2x from '$shared/assets/images/empty_state_icon@2x.png'
import type { Filter } from '$userpages/flowtype/common-types'
import SvgIcon from '$shared/components/SvgIcon'

import styles from './noDashboards.pcss'

type NoResultsViewProps = {
    onResetFilter: Function,
    filter: ?Filter,
}
type Props = NoResultsViewProps & {
    hasFilter: boolean,
}

const NoCreatedDashboardsView = () => (
    <EmptyState
        image={(
            <img
                src={emptyStateIcon}
                srcSet={`${emptyStateIcon2x} 2x`}
                alt={I18n.t('error.notFound')}
            />
        )}
    >
        <Translate value="userpages.dashboards.noCreatedDashboards.title" />
        <Translate value="userpages.dashboards.noCreatedDashboards.message" tag="small" />
    </EmptyState>
)

const NoResultsView = ({ onResetFilter }: NoResultsViewProps) => (
    <EmptyState
        image={(
            <SvgIcon name="search" className={styles.searchIcon} />
        )}
        link={(
            <button
                type="button"
                className="btn btn-special"
                onClick={onResetFilter}
            >
                <Translate value="userpages.dashboards.noDashboardsResult.clearFilters" />
            </button>
        )}
    >
        <Translate value="userpages.dashboards.noDashboardsResult.title" />
        <Translate value="userpages.dashboards.noDashboardsResult.message" tag="small" />
    </EmptyState>
)

const NoDashboardsView = ({ hasFilter, ...rest }: Props) => {
    if (hasFilter) {
        return (
            <NoResultsView {...rest} />
        )
    }

    return <NoCreatedDashboardsView />
}

export default NoDashboardsView
