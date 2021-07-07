// @flow

import React, { useState } from 'react'
import styled from 'styled-components'
import DataUnionPending from '$mp/components/ProductPage/DataUnionPending'
import AutoScrollHook from '$shared/components/AutoScrollHook'
import DonutChart from '$shared/components/DonutChart'
import Segment from '$shared/components/Segment'
import ProductStat from '$shared/components/ProductStat'
import DaysPopover from '$shared/components/DaysPopover'
import { SM } from '$shared/utils/styled'
import TimeSeriesGraph from '$shared/components/TimeSeriesGraph'
import MembersGraph from './MembersGraph'
import MembersGraphV2 from './MembersGraphV2'

type Props = {
    stats: Array<Object>,
    memberCount: ?{
        total: number,
        active: number,
        inactive: number,
    },
    joinPartStreamId?: ?string,
    showDeploying?: boolean,
    dataUnion: any,
}

const Members = styled.div`
    @media (min-width: ${SM}px) {
        flex-basis: 60%;
    }
`

const GroupedMembers = styled.div`
    border-top: 1px solid #e7e7e7;

    @media (min-width: ${SM}px) {
        border-left: 1px solid #e7e7e7;
        border-top: 0;
        flex-basis: 40%;
    }
`

const Graphs = styled.div`
    > div {
        padding: 24px;
    }

    @media (min-width: ${SM}px) {
        display: flex;

        > div {
            padding: 32px;
        }
    }
`

const UnstyledDataUnionStats = ({
    stats,
    memberCount,
    joinPartStreamId,
    showDeploying,
    dataUnion,
    ...props
}: Props) => {
    const [days, setDays] = useState(7)

    return (
        <Segment {...props}>
            <AutoScrollHook hash="stats" />
            <Segment.Header>
                Overview
            </Segment.Header>
            {!!showDeploying && (
                <Segment.Body>
                    <DataUnionPending />
                </Segment.Body>
            )}
            {!showDeploying && !!stats && (
                <Segment.Body pad>
                    <ProductStat.List items={stats} />
                </Segment.Body>
            )}
            {!showDeploying && !!memberCount && (
                <Segment.Body>
                    <Graphs>
                        <Members>
                            <TimeSeriesGraph.Header>
                                <ProductStat.Title>
                                    Members
                                </ProductStat.Title>
                                <DaysPopover
                                    onChange={setDays}
                                    selectedItem={`${days}`}
                                />
                            </TimeSeriesGraph.Header>
                            <TimeSeriesGraph.Body>
                                {dataUnion && dataUnion.version && dataUnion.version === 1 && joinPartStreamId && (
                                    <MembersGraph
                                        joinPartStreamId={joinPartStreamId}
                                        memberCount={memberCount.total}
                                        shownDays={days}
                                    />
                                )}
                                {dataUnion && dataUnion.version && dataUnion.version === 2 && (
                                    <MembersGraphV2
                                        memberCount={memberCount.active}
                                        shownDays={days}
                                        dataUnionAddress={dataUnion.id}
                                    />
                                )}
                            </TimeSeriesGraph.Body>
                        </Members>
                        <GroupedMembers>
                            <TimeSeriesGraph.Header>
                                <ProductStat.Title>
                                    Members by status
                                </ProductStat.Title>
                            </TimeSeriesGraph.Header>
                            <TimeSeriesGraph.Body>
                                <DonutChart
                                    strokeWidth={3}
                                    data={[
                                        {
                                            title: 'Active',
                                            value: memberCount.active || 0,
                                            color: '#0324FF',
                                        },
                                        {
                                            title: 'Inactive',
                                            value: memberCount.inactive || 0,
                                            color: '#FB0606',
                                        },
                                    ]}
                                />
                            </TimeSeriesGraph.Body>
                        </GroupedMembers>
                    </Graphs>
                </Segment.Body>
            )}
        </Segment>
    )
}

const DataUnionStats = styled(UnstyledDataUnionStats)`
    ${DataUnionPending} {
        padding: 4em 0;
    }

    ${TimeSeriesGraph} {
        width: 100%;
    }
`

export default DataUnionStats
