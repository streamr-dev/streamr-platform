// @flow

import React, { useContext, Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import styled from 'styled-components'

import Text from '$ui/Text'
import Errors, { MarketplaceTheme } from '$ui/Errors'
import WithInputActions from '$shared/components/WithInputActions'
import Popover from '$shared/components/Popover'
import useCopy from '$shared/hooks/useCopy'
import Notification from '$shared/utils/Notification'
import { NotificationIcon } from '$shared/utils/constants'
import { truncate } from '$shared/utils/text'
import useAccountAddress from '$shared/hooks/useAccountAddress'
import Label from '$ui/Label'
import { selectUserData } from '$shared/modules/user/selectors'
import { isEthereumAddress } from '$mp/utils/validate'
import useValidation from '../ProductController/useValidation'
import { Context as EditControllerContext } from './EditControllerProvider'

import styles from './beneficiaryAddress.pcss'

type Props = {
    address?: string,
    onChange: (string) => void,
    disabled: boolean,
    className?: string,
    onFocus?: ?(SyntheticFocusEvent<EventTarget>) => void,
    onBlur?: ?(SyntheticFocusEvent<EventTarget>) => void,
}

type AddressItemProps = {
    address?: ?string,
    className?: ?string,
    name: string,
}

const UnstyledAddressItem = ({ className, name, address }: AddressItemProps) => (
    <div className={className}>
        <div>{`Fill ${name}`}</div>
        {!!address && (
            <div className="address">
                {truncate(address)}
            </div>
        )}
    </div>
)

const AddressItem = styled(UnstyledAddressItem)`
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    & > .address {
        color: #adadad;
        font-size: 10px;
        margin-top: -14px;
    }
`

const BeneficiaryAddress = ({
    address: addressProp,
    onChange,
    disabled,
    className,
    onFocus: onFocusProp,
    onBlur: onBlurProp,
}: Props) => {
    const { isValid, message } = useValidation('beneficiaryAddress')
    const { publishAttempted } = useContext(EditControllerContext)
    const invalid = publishAttempted && !isValid

    const { copy } = useCopy()

    const { username } = useSelector(selectUserData) || {}

    const onCopy = useCallback(() => {
        if (!addressProp) {
            return
        }

        copy(addressProp)

        Notification.push({
            title: 'Copied',
            icon: NotificationIcon.CHECKMARK,
        })
    }, [copy, addressProp])

    const accountAddress = useAccountAddress()

    const useCurrentWalletAddress = useCallback(() => {
        if (accountAddress) {
            onChange(accountAddress)
        }
    }, [accountAddress, onChange])

    const [focused, setFocused] = useState(false)

    const [ownAddress, setOwnAddress] = useState(addressProp || '')

    useEffect(() => {
        setOwnAddress(addressProp || '')
    }, [addressProp])

    const onOwnAddressChange = useCallback((e: SyntheticInputEvent<EventTarget>) => {
        setOwnAddress(e.target.value)
    }, [])

    const address: string = useMemo(() => (
        focused ? ownAddress : truncate(ownAddress)
    ), [focused, ownAddress])

    const onFocus = useCallback((e: SyntheticFocusEvent<EventTarget>) => {
        setFocused(true)

        if (onFocusProp) {
            onFocusProp(e)
        }
    }, [onFocusProp])

    const onBlur = useCallback((e: SyntheticFocusEvent<EventTarget>) => {
        setFocused(false)

        if (onBlurProp) {
            onBlurProp(e)
        }
    }, [onBlurProp])

    return (
        <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            <label
                htmlFor="beneficiaryAddress"
                className={cx(styles.root, className)}
            >
                <Label>
                    Set recipient ETH address
                </Label>
                <WithInputActions
                    disabled={disabled}
                    actions={[
                        <Popover.Item
                            key="useCurrent"
                            onClick={useCurrentWalletAddress}
                            disabled={!accountAddress}
                        >
                            <AddressItem name="wallet address" address={accountAddress || 'Wallet locked'} />
                        </Popover.Item>,
                        ...(!!username && isEthereumAddress(username) ? [
                            <Popover.Item
                                key="username"
                                onClick={() => onChange(username)}
                            >
                                <AddressItem name="username" address={username} />
                            </Popover.Item>,
                        ] : []),
                        <Popover.Item
                            key="copy"
                            disabled={!addressProp}
                            onClick={onCopy}
                        >
                            Copy
                        </Popover.Item>,
                    ]}
                >
                    <Text
                        key={addressProp}
                        id="beneficiaryAddress"
                        autoComplete="off"
                        value={address}
                        onCommit={onChange}
                        onChange={onOwnAddressChange}
                        placeholder="Enter ETH address"
                        invalid={invalid}
                        disabled={disabled}
                        selectAllOnFocus
                        smartCommit
                        onBlur={onBlur}
                        onFocus={onFocus}
                    />
                </WithInputActions>
                {invalid && (
                    <Fragment>
                        <div />
                        <Errors theme={MarketplaceTheme}>
                            {message}
                        </Errors>
                    </Fragment>
                )}
            </label>
        </form>
    )
}

export default BeneficiaryAddress
