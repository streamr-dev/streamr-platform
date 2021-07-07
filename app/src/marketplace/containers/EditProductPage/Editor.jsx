// @flow

import React from 'react'
import cx from 'classnames'

import DetailsContainer from '$shared/components/Container/Details'
import { isDataUnionProduct, isPaidProduct } from '$mp/utils/product'
import useEditableProduct from '../ProductController/useEditableProduct'

import EditorNav from './EditorNav'
import ProductName from './ProductName'
import CoverImage from './CoverImage'
import ProductDescription from './ProductDescription'
import ProductStreams from './ProductStreams'
import PriceSelector from './PriceSelector'
import ProductDetails from './ProductDetails'
import Whitelist from './Whitelist'
import SharedSecrets from './SharedSecrets'
import TermsOfUse from './TermsOfUse'

import styles from './editor.pcss'

type Props = {
    disabled?: boolean,
}

const Editor = ({ disabled }: Props) => {
    const product = useEditableProduct()
    const isDataUnion = isDataUnionProduct(product)
    const isPaid = isPaidProduct(product)

    return (
        <div className={cx(styles.root, styles.Editor)}>
            <DetailsContainer className={styles.container}>
                <div className={styles.grid}>
                    <div className={styles.nav}>
                        <EditorNav />
                    </div>
                    <div className={styles.info}>
                        <ProductName disabled={disabled} />
                        <CoverImage disabled={disabled} />
                        <ProductDescription disabled={disabled} />
                        <ProductStreams disabled={disabled} />
                        <PriceSelector disabled={disabled} />
                        <ProductDetails disabled={disabled} />
                        {!!isPaid && (
                            <Whitelist disabled={disabled} />
                        )}
                        <TermsOfUse disabled={disabled} />
                        {!!isDataUnion && (
                            <SharedSecrets disabled={disabled} />
                        )}
                    </div>
                </div>
            </DetailsContainer>
        </div>
    )
}

export default Editor
