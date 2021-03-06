// @flow

import React, { useCallback, useState } from 'react'
import styled from 'styled-components'

import type { Stream } from '$shared/flowtype/stream-types'
import Numeric from '$ui/Numeric'
import Label from '$ui/Label'

type Props = {
    stream: Stream,
    disabled?: boolean,
    updateStream?: Function,
}

const MIN_PARTITIONS = 1
const MAX_PARTITIONS = 99

const Root = styled.div``

const Description = styled.p`
    margin-bottom: 3.125rem;
    max-width: 660px;
`

const Partitions = styled.div`
    max-width: 136px;
`

const PartitionsLabel = styled(Label)``

export const PartitionsView = ({ stream, disabled, updateStream }: Props) => {
    const { partitions } = stream

    const [partitionsValue, setPartitionsValue] = useState(String(partitions))

    const onCommit = useCallback(() => {
        let numberValue = Number.parseInt(partitionsValue, 10)
        // if entered value is NaN use existing value
        numberValue = Number.isNaN(numberValue) ? partitions : numberValue
        numberValue = Math.max(MIN_PARTITIONS, Math.min(numberValue, MAX_PARTITIONS))
        setPartitionsValue(String(numberValue))

        if (typeof updateStream === 'function') {
            updateStream({ partitions: numberValue })
        }
    }, [updateStream, partitions, partitionsValue])

    const onPartitionsChange = useCallback((event) => {
        setPartitionsValue(event.target.value)
    }, [setPartitionsValue])

    return (
        <Root>
            <Description>
                Partitioning enables high-volume streams to scale beyond what a typical node can handle.
                {' '}
                If you’re not sure if your stream needs partitions, leave it set to 1.
            </Description>
            <Partitions>
                <PartitionsLabel>
                    Partitions
                </PartitionsLabel>
                <Numeric
                    min={MIN_PARTITIONS}
                    max={MAX_PARTITIONS}
                    value={partitionsValue}
                    onChange={onPartitionsChange}
                    onBlur={onCommit}
                    disabled={disabled}
                    name="partitions"
                />
            </Partitions>
        </Root>
    )
}

export default PartitionsView
