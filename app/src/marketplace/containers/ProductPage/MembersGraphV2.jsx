// @flow

import React, { useEffect, useState, useMemo, useCallback } from 'react'

import useIsMounted from '$shared/hooks/useIsMounted'
import ClientProvider from '$shared/components/StreamrClientProvider'
import TimeSeriesGraph from '$shared/components/TimeSeriesGraph'
import { getMemberStatistics } from '$mp/modules/dataUnion/services'

type Props = {
    dataUnionAddress: string,
    memberCount: number,
    shownDays?: number,
}

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000

const MembersGraphV2 = ({ dataUnionAddress, memberCount, shownDays = 7 }: Props) => {
    const isMounted = useIsMounted()
    const [memberData, setMemberData] = useState([])
    const [graphData, setGraphData] = useState([])

    const startDate = useMemo(() => (
        Date.now() - (shownDays * MILLISECONDS_IN_DAY)
    ), [shownDays])

    const reset = useCallback(() => {
        setGraphData([])
        setMemberData([])
    }, [])

    useEffect(() => {
        const loadData = async () => {
            try {
                const statistics = await getMemberStatistics(dataUnionAddress, startDate)
                if (isMounted()) {
                    setMemberData(statistics)
                }
            } catch (e) {
                console.warn(e)
            }
        }

        if (dataUnionAddress) {
            loadData()
        }
    }, [dataUnionAddress, startDate, reset, isMounted])

    useEffect(() => {
        const data = []

        // eslint-disable-next-line no-restricted-syntax
        for (const val of memberData) {
            data.push({
                x: val.startDate * 1000,
                y: val.memberCountAtStart,
            })
            // Add a superficial datapoint to form a staircase graph
            if ((val.endDate * 1000) <= Date.now()) {
                data.push({
                    x: (val.endDate * 1000) - 1,
                    y: val.memberCountAtStart + val.memberCountChange,
                })
            }
        }

        // Make sure we fill the whole date range (end)
        if (data.length === 0) {
            data.push({
                x: Date.now(),
                y: memberCount,
            })
        } else {
            const lastMemberCount = data[data.length - 1].y
            data.push({
                x: Date.now(),
                y: lastMemberCount,
            })
        }

        if (data.length > 0) {
            const firstMemberCount = data[0].y

            // Make sure we fill the whole date range (start)
            data.unshift({
                x: startDate,
                y: firstMemberCount,
            })
        }

        setGraphData(data)
    }, [memberData, memberCount, startDate])

    return (
        <TimeSeriesGraph
            graphData={graphData}
            shownDays={shownDays}
        />
    )
}

export default function MembersGraphWrapper(props: Props) {
    return (
        <ClientProvider>
            <MembersGraphV2 {...props} />
        </ClientProvider>
    )
}
