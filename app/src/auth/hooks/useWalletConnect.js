import { useCallback } from 'react'
import WalletConnect from '@walletconnect/client'
import QRCodeModal from '@walletconnect/qrcode-modal'
import { convertUtf8ToHex } from '@walletconnect/utils'
import { createChallenge } from '$shared/modules/user/services'
import { ChallengeFailedError } from '$shared/errors/Web3'
import { post } from '$shared/utils/api'
import routes from '$routes'

const signChallenge = async ({ connector, address }) => {
    try {
        const { id, challenge } = await createChallenge(address)

        // encode message (hex)
        const hexMsg = convertUtf8ToHex(challenge)

        // personal_sign params
        const msgParams = [hexMsg, address]

        const signature = await connector.signPersonalMessage(msgParams)

        return post({
            url: routes.auth.external.login(),
            data: {
                challenge: {
                    id,
                    challenge,
                },
                signature,
                address,
            },
            useAuthorization: false,
        })
    } catch (error) {
        console.warn(error)
        throw new ChallengeFailedError()
    }
}

const useWalletConnect = () => (
    useCallback(async () => (
        new Promise((resolve, reject) => {
            // Create a connector
            let connector = new WalletConnect({
                bridge: 'https://bridge.walletconnect.org', // Required
                qrcodeModal: QRCodeModal,
            })

            let challengePending = false
            let connected = false
            let finalized = false

            const finalize = async ({ token, error, disconnect = true } = {}) => {
                finalized = true

                if (disconnect && connected) {
                    await connector.killSession()
                    connector = undefined
                    connected = false
                }

                if (token) {
                    resolve(token)
                } else {
                    reject(error)
                }
            }

            const onConnect = (error, payload) => {
                if (!connected) {
                    connected = true
                }

                if (error) {
                    reject(error)
                }

                if (!challengePending) {
                    // Get provided accounts and chainId
                    const { accounts /* , chainId */ } = payload.params[0]

                    challengePending = true

                    signChallenge({
                        address: accounts[0],
                        connector,
                    }).then((response) => (
                        finalize({
                            token: response && response.token,
                        })
                    ), (e) => (
                        finalize({
                            error: e,
                        })
                    ))
                }
            }

            const onDisconnect = (error) => {
                if (!finalized) {
                    finalize({
                        error: error || new Error('Session disconnected'),
                        disconnect: false,
                    })
                }
            }

            // Check if connection is already established
            if (!connector.connected) {
                // create new session
                connector.createSession()
            } else {
                onConnect(undefined, {
                    params: [connector],
                })
            }

            if (!connector) {
                throw new Error('connector hasn\'t been created yet')
            }

            // Subscribe to connection events
            connector.on('connect', onConnect)
            connector.on('disconnect', onDisconnect)
        })
    ), [])
)

export default useWalletConnect
