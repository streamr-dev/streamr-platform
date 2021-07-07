// @flow

import React from 'react'
import cx from 'classnames'

import useDataUnion from '$mp/containers/ProductController/useDataUnion'
import { isDataUnionProduct } from '$mp/utils/product'
import { isEthereumAddress } from '$mp/utils/validate'
import useProduct from '../ProductController/useProduct'
import SharedSecretEditor from './SharedSecretEditor'

import styles from './productStreams.pcss'

type Props = {
    className?: string,
    disabled?: boolean,
}

const SharedSecrets = ({ className, disabled }: Props) => {
    const product = useProduct()
    const isDataUnion = isDataUnionProduct(product)
    const dataunion = useDataUnion()
    const { owner } = dataunion || {}
    const isDeployed = isDataUnion && isEthereumAddress(owner)

    return (
        <section id="shared-secrets" className={cx(styles.root, className)}>
            <h1>Add a shared secret</h1>
            {!!isDeployed && (
                <p>
                    Shared secrets are the access control for your Data Union.
                    {' '}
                    Create, name and revoke shared secrets from here.
                </p>
            )}
            {!isDeployed && (
                <p>
                    These settings are only available once you have deployed your Data Union, and provides access control for your Data Union.
                    {' '}
                    Create, name and revoke shared secrets them from here.
                </p>
            )}
            <SharedSecretEditor disabled={!!disabled || !isDeployed} />
        </section>
    )
}

export default SharedSecrets
