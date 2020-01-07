// @flow

import { useState, useEffect } from 'react'
import { getWeb3 } from '$shared/web3/web3Provider'
import Web3Poller from '$shared/web3/web3Poller'

export default (): ?string => {
    const [address, setAddress] = useState()

    useEffect(() => {
        (async () => {
            try {
                return await getWeb3().getDefaultAccount()
            } catch (e) {
                return undefined
            }
        })().then(setAddress)

        Web3Poller.subscribe(Web3Poller.events.ACCOUNT, setAddress)

        return () => {
            Web3Poller.unsubscribe(Web3Poller.events.ACCOUNT, setAddress)
        }
    }, [])

    return address
}