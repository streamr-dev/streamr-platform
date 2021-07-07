// @flow

import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

import DaysPopover from '$shared/components/DaysPopover'
import TimeSeriesGraph from '$shared/components/TimeSeriesGraph'
import MembersGraph from '$mp/containers/ProductPage/MembersGraph'
import MembersGraphV2 from '$mp/containers/ProductPage/MembersGraphV2'
import SubscriberGraph from '$mp/containers/ProductPage/SubscriberGraph'
import useDataUnionServerStats from '$mp/containers/ProductPage/useDataUnionServerStats'
import ProductController, { useController } from '$mp/containers/ProductController'
import { MEDIUM } from '$shared/utils/styled'

import ManageJoinRequests from './ManageJoinRequests'
import ManageMembers from './ManageMembers'

const Container = styled.div`
    display: grid;
    padding: 16px;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    grid-gap: 16px;
    border-top: 1px solid #EFEFEF;
`

const Box = styled.div`
    background: #FDFDFD;
    border: 1px solid #EFEFEF;
    border-radius: 4px;
    width: 100%;
    padding: 32px 24px 16px 24px;
`

const Heading = styled.div`
    font-weight: ${MEDIUM};
    font-size: 14px;
    line-height: 18px;
    display: flex;
    align-items: center;
    color: #323232;
`

const GraphHeader = styled.div`
    margin-bottom: 32px;
`

const StyledDaysPopover = styled(DaysPopover)`
    width: 100%;
    justify-content: flex-end;
`

type Props = {
    product: any,
    joinRequests: Array<any>,
    dataUnion: any,
    className?: string,
}

const Management = ({ product, joinRequests, dataUnion, className }: Props) => {
    const [days, setDays] = useState(7)
    const [subsDays, setSubsDays] = useState(7)
    const { loadDataUnion } = useController()
    const { joinPartStreamId } = dataUnion || {}
    const { startPolling, stopPolling, memberCount } = useDataUnionServerStats()
    const { beneficiaryAddress } = product

    useEffect(() => {
        if (beneficiaryAddress) {
            loadDataUnion(beneficiaryAddress)
            startPolling(beneficiaryAddress)
            return () => stopPolling()
        }

        return () => {}
    }, [startPolling, stopPolling, beneficiaryAddress, loadDataUnion])

    return (
        <Container className={className}>
            <ManageJoinRequests dataUnion={dataUnion} joinRequests={joinRequests} />
            <ManageMembers dataUnion={dataUnion} />
            <Box>
                <GraphHeader>
                    <TimeSeriesGraph.Header>
                        <Heading>
                            Subscribers
                        </Heading>
                        <StyledDaysPopover
                            onChange={setSubsDays}
                            selectedItem={`${subsDays}`}
                        />
                    </TimeSeriesGraph.Header>
                </GraphHeader>
                <SubscriberGraph
                    productId={product.id}
                    shownDays={subsDays}
                />
            </Box>
            <Box>
                <GraphHeader>
                    <TimeSeriesGraph.Header>
                        <Heading>Members</Heading>
                        <StyledDaysPopover
                            onChange={setDays}
                            selectedItem={`${days}`}
                        />
                    </TimeSeriesGraph.Header>
                </GraphHeader>
                {dataUnion && dataUnion.version && dataUnion.version === 1 && joinPartStreamId ? (
                    <MembersGraph
                        joinPartStreamId={joinPartStreamId}
                        memberCount={(memberCount && memberCount.total) || 0}
                        shownDays={days}
                    />
                ) : (
                    <MembersGraphV2
                        memberCount={(memberCount && memberCount.active) || 0}
                        shownDays={days}
                        dataUnionAddress={dataUnion && dataUnion.id}
                    />
                )}
            </Box>
        </Container>
    )
}

const WrappedManagement = (props: Props) => (
    <ProductController>
        <Management {...props} />
    </ProductController>
)

export default WrappedManagement
