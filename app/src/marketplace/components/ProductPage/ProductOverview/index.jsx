// @flow

import React, { useState, useEffect, useCallback } from 'react'
import cx from 'classnames'

import type { Product } from '$mp/flowtype/product-types'
import type { ResourceKeyId } from '$shared/flowtype/resource-key-types'
import DeploySpinner from '$shared/components/DeploySpinner'
import { getCommunityStats } from '$mp/modules/communityProduct/services'
import useInterval from '$shared/hooks/useInterval'
import useIsMounted from '$shared/hooks/useIsMounted'
import DonutChart from '$shared/components/DonutChart'
import MembersGraph from '../MembersGraph'

import styles from './productOverview.pcss'

type Props = {
    product: Product,
    authApiKeyId?: ?ResourceKeyId,
    className?: string,
}

const CP_SERVER_POLL_INTERVAL_MS = 10000

const ProductOverview = ({ product, authApiKeyId, className }: Props) => {
    const isMounted = useIsMounted()
    const [isDeploying, setIsDeploying] = useState(true)
    const [stats, setStats] = useState(null)

    const getStats = useCallback(async () => {
        try {
            setIsDeploying(true)
            const result = await getCommunityStats(product.beneficiaryAddress)
            if (!isMounted) {
                return
            }
            result.totalEarnings = 100
            result.memberCount = {
                total: 100,
                active: 80,
                inactive: 20,
            }
            setStats(result)
            setIsDeploying(false)
        } catch (e) {
            console.error(e)
        }
    }, [product, isMounted])

    useInterval(() => {
        if (isDeploying) {
            getStats()
        }
    }, CP_SERVER_POLL_INTERVAL_MS)

    useEffect(() => {
        getStats()
    }, [getStats])

    const productAgeMs = Date.now() - new Date(product.created || 0).getTime()
    const revenuePerMonth = (stats && stats.totalEarnings) ? Math.floor(stats.totalEarnings / (productAgeMs / (1000 * 60 * 60 * 24 * 30))) : 0
    const revenuePerMonthPerMember = (stats && stats.memberCount) ? revenuePerMonth / stats.memberCount.total : 0

    return (
        <div className={cx(styles.root, className)}>
            {isDeploying && (
                <div className={styles.spinnerContainer}>
                    <div className={styles.spinner}>
                        <DeploySpinner isRunning showCounter={false} />
                    </div>
                </div>
            )}
            {!isDeploying && stats != null && (
                <div className={styles.grid}>
                    <div className={styles.header}>
                        <span>Overview</span>
                    </div>
                    <div className={styles.stats}>
                        <div>
                            <div className={styles.statHeading}>Total product revenue</div>
                            <div className={styles.statValue}>
                                {stats.totalEarnings}
                                <span className={styles.currency}> DATA</span>
                            </div>
                        </div>
                        <div>
                            <div className={styles.statHeading}>Active Members</div>
                            <div className={styles.statValue}>{stats.memberCount.active}</div>
                        </div>
                        <div>
                            <div className={styles.statHeading}>Avg rev member / month</div>
                            <div className={styles.statValue}>
                                {Math.floor(revenuePerMonthPerMember)}
                                <span className={styles.currency}> DATA</span>
                            </div>
                        </div>
                        <div>
                            <div className={styles.statHeading}>Subscribers</div>
                            <div className={styles.statValue}>TODO</div>
                        </div>
                        <div>
                            <div className={styles.statHeading}>Admin fee</div>
                            <div className={styles.statValue}>TODO</div>
                        </div>
                        <div>
                            <div className={styles.statHeading}>Product created</div>
                            <div className={styles.statValue}>{product && product.created && new Date(product.created).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div className={styles.graphs}>
                        <div>
                            <div className={styles.statHeading}>Members</div>
                            <MembersGraph
                                className={styles.graph}
                                authApiKeyId={authApiKeyId}
                                joinPartStreamId="DRaCVLn1TOWpe7I76gN8hA"
                                memberCount={stats.memberCount.total}
                            />
                        </div>
                        <div className={styles.memberDonut}>
                            <div className={styles.statHeading}>Members by status</div>
                            <DonutChart
                                className={styles.graph}
                                strokeWidth={3}
                                data={[
                                    {
                                        title: 'Active',
                                        value: stats.memberCount.active,
                                        color: '#0324FF',
                                    },
                                    {
                                        title: 'Inactive',
                                        value: stats.memberCount.inactive,
                                        color: '#FB0606',
                                    },
                                ]}
                            />
                        </div>
                    </div>
                    <div className={styles.footer}>
                        TODO
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductOverview
