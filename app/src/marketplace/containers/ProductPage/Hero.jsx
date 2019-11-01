// @flow

import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { replace } from 'connected-react-router'

import useProduct from '$mp/containers/ProductController/useProduct'
import useModal from '$shared/hooks/useModal'
import { selectUserData } from '$shared/modules/user/selectors'

import FallbackImage from '$shared/components/FallbackImage'
import Tile from '$shared/components/Tile'
import ProductDetails from './ProductDetails'
import HeroComponent from '$mp/components/Hero'
import { isCommunityProduct } from '$mp/utils/product'
import {
    selectSubscriptionIsValid,
    selectContractSubscription,
} from '$mp/modules/product/selectors'

import routes from '$routes'

import styles from './hero.pcss'

const Hero = () => {
    const dispatch = useDispatch()
    const product = useProduct()
    const { api: purchaseDialog } = useModal('purchase')

    const userData = useSelector(selectUserData)
    const isLoggedIn = userData !== null
    const isCommunity = !!(product && isCommunityProduct(product))
    const isProductSubscriptionValid = useSelector(selectSubscriptionIsValid)
    const subscription = useSelector(selectContractSubscription)

    const productId = product.id
    const onPurchase = useCallback(async () => {
        if (isLoggedIn) {
            await purchaseDialog.open({
                productId,
            })
        } else {
            dispatch(replace(routes.login({
                redirect: routes.product({
                    id: productId,
                }),
            })))
        }
    }, [productId, dispatch, isLoggedIn, purchaseDialog])

    return (
        <HeroComponent
            className={styles.hero}
            containerClassName={styles.heroContainer}
            product={product}
            leftContent={
                <div className={styles.productImageWrapper}>
                    <FallbackImage
                        className={styles.productImage}
                        src={product.imageUrl || ''}
                        alt={product.name}
                    />
                    <Tile.Labels
                        topLeft
                        labels={{
                            community: isCommunity,
                        }}
                    />
                </div>
            }
            rightContent={
                <ProductDetails
                    product={product}
                    isValidSubscription={!!isProductSubscriptionValid}
                    productSubscription={subscription}
                    onPurchase={onPurchase}
                />
            }
        />
    )
}

export default Hero