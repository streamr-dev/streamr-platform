// @flow

import React, { type Node, type Context, useMemo, useContext, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'

import { Provider as PendingProvider } from '$shared/contexts/Pending'
import { usePending } from '$shared/hooks/usePending'
import { resetProduct } from '$mp/modules/product/actions'
import useIsMounted from '$shared/hooks/useIsMounted'
import { Provider as PermissionsProvider } from './useProductPermissions'
import { Provider as ValidationContextProvider } from './ValidationContextProvider'

import useProductLoadCallback from './useProductLoadCallback'
import useContractProductLoadCallback from './useContractProductLoadCallback'
import useProductValidationEffect from './useProductValidationEffect'
import useContractProductSubscriptionLoadCallback from './useContractProductSubscriptionLoadCallback'
import useLoadCategoriesCallback from './useLoadCategoriesCallback'
import useLoadProductStreamsCallback from './useLoadProductStreamsCallback'
import useDataUnionLoadCallback from './useDataUnionLoadCallback'
import useDataUnionStatsLoadCallback from './useDataUnionStatsLoadCallback'
import useRelatedProductsLoadCallback from './useRelatedProductsLoadCallback'
import useLoadAllStreamsCallback from './useLoadAllStreamsCallback'
import useClearStreamsCallback from './useClearStreamsCallback'
import useResetDataUnionCallback from './useResetDataUnionCallback'

type ContextProps = {
    hasLoaded: boolean,
    setHasLoaded: Function,
    loadProduct: Function,
    loadContractProduct: Function,
    loadContractProductSubscription: Function,
    loadCategories: Function,
    loadProductStreams: Function,
    loadDataUnion: Function,
    loadDataUnionStats: Function,
    loadRelatedProducts: Function,
    loadAllStreams: Function,
    clearStreams: Function,
    resetDataUnion: Function,
}

const ProductControllerContext: Context<ContextProps> = React.createContext({})

type EffectProps = {
    ignoreUnauthorized?: boolean,
    requirePublished?: boolean,
}

function useProductLoadEffect({ ignoreUnauthorized, requirePublished }: EffectProps) {
    const [loadedOnce, setLoadedOnce] = useState(false)
    const loadProduct = useProductLoadCallback()
    const loadContractProduct = useContractProductLoadCallback()
    const { setHasLoaded } = useContext(ProductControllerContext)
    const { isPending } = usePending('product.LOAD')
    const isMounted = useIsMounted()
    const { id: urlId } = useParams()

    useEffect(() => {
        if (urlId && !loadedOnce && !isPending) {
            // load product if needed and not already loading
            loadProduct({
                productId: urlId,
                ignoreUnauthorized,
                requirePublished,
            }).then(() => {
                if (isMounted()) {
                    setHasLoaded(true)
                }
            })
            loadContractProduct(urlId)
            setLoadedOnce(true)
        }
    }, [
        urlId,
        loadedOnce,
        loadProduct,
        loadContractProduct,
        isPending,
        ignoreUnauthorized,
        requirePublished,
        setHasLoaded,
        isMounted,
    ])
}

function ProductEffects({ ignoreUnauthorized, requirePublished }: EffectProps) {
    useProductLoadEffect({
        ignoreUnauthorized,
        requirePublished,
    })
    useProductValidationEffect()

    // Clear product on unmount
    const dispatch = useDispatch()
    useEffect(() => () => dispatch(resetProduct()), [dispatch])

    return null
}

export function useController() {
    return useContext(ProductControllerContext)
}

function useProductController() {
    const [hasLoaded, setHasLoaded] = useState(false)
    const loadProduct = useProductLoadCallback()
    const loadContractProduct = useContractProductLoadCallback()
    const loadContractProductSubscription = useContractProductSubscriptionLoadCallback()
    const loadCategories = useLoadCategoriesCallback()
    const loadProductStreams = useLoadProductStreamsCallback()
    const loadDataUnion = useDataUnionLoadCallback()
    const loadDataUnionStats = useDataUnionStatsLoadCallback()
    const loadRelatedProducts = useRelatedProductsLoadCallback()
    const loadAllStreams = useLoadAllStreamsCallback()
    const clearStreams = useClearStreamsCallback()
    const resetDataUnion = useResetDataUnionCallback()

    return useMemo(() => ({
        hasLoaded,
        setHasLoaded,
        loadProduct,
        loadContractProduct,
        loadContractProductSubscription,
        loadCategories,
        loadProductStreams,
        loadDataUnion,
        loadDataUnionStats,
        loadRelatedProducts,
        loadAllStreams,
        clearStreams,
        resetDataUnion,
    }), [
        hasLoaded,
        setHasLoaded,
        loadProduct,
        loadContractProduct,
        loadContractProductSubscription,
        loadCategories,
        loadProductStreams,
        loadDataUnion,
        loadDataUnionStats,
        loadRelatedProducts,
        loadAllStreams,
        clearStreams,
        resetDataUnion,
    ])
}

type ControllerProviderProps = {
    children?: Node,
}

function ControllerProvider({ children }: ControllerProviderProps) {
    return (
        <ProductControllerContext.Provider value={useProductController()}>
            {children}
        </ProductControllerContext.Provider>
    )
}

type ControllerProps = ControllerProviderProps & EffectProps

const ProductController = ({ children, ignoreUnauthorized = false, requirePublished = false }: ControllerProps) => (
    <PendingProvider name="product">
        <ValidationContextProvider>
            <PermissionsProvider>
                <ControllerProvider>
                    <ProductEffects ignoreUnauthorized={ignoreUnauthorized} requirePublished={requirePublished} />
                    {children || null}
                </ControllerProvider>
            </PermissionsProvider>
        </ValidationContextProvider>
    </PendingProvider>
)

export default ProductController
