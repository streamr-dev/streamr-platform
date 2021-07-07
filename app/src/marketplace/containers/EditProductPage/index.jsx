// @flow

import React, { useContext, useMemo, useEffect, useCallback, useState, useRef } from 'react'
import { withRouter } from 'react-router-dom'
import { useSelector } from 'react-redux'
import cx from 'classnames'

import { CoreHelmet } from '$shared/components/Helmet'
import CoreLayout from '$shared/components/Layout/Core'
import coreLayoutStyles from '$shared/components/Layout/core.pcss'
import * as UndoContext from '$shared/contexts/Undo'
import Toolbar from '$shared/components/Toolbar'
import type { Product } from '$mp/flowtype/product-types'
import { isDataUnionProduct } from '$mp/utils/product'
import Nav from '$shared/components/Layout/Nav'

import usePending from '$shared/hooks/usePending'
import { productStates } from '$shared/utils/constants'
import { isEthereumAddress } from '$mp/utils/validate'
import useProduct from '$mp/containers/ProductController/useProduct'
import useDataUnionSecrets from '$mp/modules/dataUnion/hooks/useDataUnionSecrets'
import ResourceNotFoundError, { ResourceType } from '$shared/errors/ResourceNotFoundError'
import { selectFetchingStreams, selectHasMoreResults } from '$mp/modules/streams/selectors'
import useWhitelist from '$mp/modules/contractProduct/hooks/useWhitelist'
import useModal from '$shared/hooks/useModal'

import BackButton from '$shared/components/BackButton'
import useProductPermissions from '../ProductController/useProductPermissions'
import useEditableProduct from '../ProductController/useEditableProduct'
import ProductController, { useController } from '../ProductController'
import { Provider as EditControllerProvider, Context as EditControllerContext } from './EditControllerProvider'
import Editor from './Editor'
import Preview from './Preview'
import ConfirmSaveModal from './ConfirmSaveModal'
import DeployDataUnionModal from './DeployDataUnionModal'
import PublishModal from './PublishModal'
import CropImageModal from './CropImageModal'
import WhitelistEditModal from './WhitelistEditModal'

import styles from './editProductPage.pcss'

const STREAMS_PAGE_SIZE = 999

const EditProductPage = ({ product }: { product: Product }) => {
    const {
        isPreview,
        setIsPreview,
        save,
        publish,
        deployDataUnion,
        back,
    } = useContext(EditControllerContext)
    const { isPending: savePending } = usePending('product.SAVE')
    const { isPending: publishDialogLoading } = usePending('product.PUBLISH_DIALOG_LOAD')
    const {
        loadContractProductSubscription,
        loadCategories,
        loadProductStreams,
        loadDataUnion,
        loadDataUnionStats,
        clearStreams,
        loadStreams,
        resetDataUnion,
    } = useController()

    const { load: loadDataUnionSecrets, reset: resetDataUnionSecrets } = useDataUnionSecrets()
    const { load: loadWhiteWhitelistedAdresses, reset: resetWhiteWhitelistedAdresses } = useWhitelist()
    const fetchingAllStreams = useSelector(selectFetchingStreams)
    const hasMoreResults = useSelector(selectHasMoreResults)
    const [nextPage, setNextPage] = useState(0)
    const loadedPageRef = useRef(0)
    const { isOpen: isDataUnionDeployDialogOpen } = useModal('dataUnion.DEPLOY')
    const { isOpen: isConfirmSaveDialogOpen } = useModal('confirmSave')
    const { isOpen: isPublishDialogOpen } = useModal('publish')

    const doLoadStreams = useCallback((page = 0) => {
        loadedPageRef.current = page
        loadStreams({
            max: STREAMS_PAGE_SIZE,
            offset: page * STREAMS_PAGE_SIZE,
        }).then(() => {
            setNextPage(page + 1)
        })
    }, [loadStreams])

    const productId = product.id
    // Load categories and streams
    useEffect(() => {
        clearStreams()
        loadContractProductSubscription(productId)
        loadCategories()
        loadProductStreams(productId)
        loadWhiteWhitelistedAdresses(productId)
        doLoadStreams()
    }, [
        loadCategories,
        loadContractProductSubscription,
        loadProductStreams,
        productId,
        clearStreams,
        doLoadStreams,
        loadWhiteWhitelistedAdresses,
    ])

    // Load more streams if we didn't get all in the initial load
    useEffect(() => {
        if (!fetchingAllStreams && hasMoreResults && nextPage > loadedPageRef.current) {
            doLoadStreams(nextPage)
        }
    }, [nextPage, fetchingAllStreams, hasMoreResults, doLoadStreams])

    const originalProduct = useProduct()
    const { beneficiaryAddress } = originalProduct

    const isDataUnion = isDataUnionProduct(product)

    // TODO: should really check for the contract existance here
    const isDeployed = isDataUnion && isEthereumAddress(product.beneficiaryAddress)
    const isLoading = savePending || publishDialogLoading
    const modalsOpen = !!(isDataUnionDeployDialogOpen || isConfirmSaveDialogOpen || isPublishDialogOpen)
    const isDisabled = isLoading || modalsOpen

    useEffect(() => {
        if (isDataUnion && isEthereumAddress(beneficiaryAddress)) {
            loadDataUnion(beneficiaryAddress)
            loadDataUnionStats(beneficiaryAddress)
            loadDataUnionSecrets(beneficiaryAddress)
        }
    }, [
        isDataUnion,
        beneficiaryAddress,
        loadDataUnion,
        loadDataUnionStats,
        loadDataUnionSecrets,
    ])

    // clear data union secrets when unmounting
    useEffect(() => () => {
        resetDataUnion()
        resetDataUnionSecrets()
    }, [resetDataUnion, resetDataUnionSecrets])

    // clear whitelisted addresses when unmounting
    useEffect(() => () => {
        resetWhiteWhitelistedAdresses(productId)
    }, [resetWhiteWhitelistedAdresses, productId])

    const saveAndExitButton = useMemo(() => ({
        title: 'Save & Exit',
        kind: 'link',
        onClick: () => save(),
        disabled: isDisabled,
    }), [save, isDisabled])

    const previewButton = useMemo(() => {
        if (isPreview) {
            return {
                title: 'Edit',
                outline: true,
                onClick: () => setIsPreview(false),
                disabled: isDisabled,
            }
        }

        return {
            title: 'Preview',
            outline: true,
            onClick: () => setIsPreview(true),
            disabled: isDisabled,
        }
    }, [isPreview, setIsPreview, isDisabled])

    const productState = product.state
    const publishButton = useMemo(() => {
        const titles = {
            [productStates.DEPLOYING]: 'Publishing',
            [productStates.UNDEPLOYING]: 'Unpublishing',
            continue: 'Continue',
        }

        const tmpState: any = [
            productStates.DEPLOYING,
            productStates.UNDEPLOYING,
        ].includes(productState) ? productState : 'continue'

        return {
            title: (productState && titles[tmpState]) || '',
            kind: 'primary',
            onClick: publish,
            disabled: !(productState === productStates.NOT_DEPLOYED || productState === productStates.DEPLOYED) || isDisabled,
        }
    }, [productState, publish, isDisabled])

    const deployButton = useMemo(() => {
        if (isDataUnion && !isDeployed) {
            return {
                title: 'Continue',
                kind: 'primary',
                onClick: deployDataUnion,
                disabled: isDisabled,
            }
        }

        return publishButton
    }, [isDataUnion, isDeployed, deployDataUnion, isDisabled, publishButton])

    const actions = {
        saveAndExit: saveAndExitButton,
        preview: previewButton,
        publish: deployButton,
    }

    const toolbarMiddle = useMemo(() => {
        if (isPreview) {
            return (
                <span className={styles.toolbarMiddle}>
                    This is a preview of how your product will appear when published
                </span>
            )
        }

        return undefined
    }, [isPreview])

    return (
        <CoreLayout
            className={styles.layout}
            nav={(
                <Nav noWide />
            )}
            navComponent={(
                <Toolbar
                    left={<BackButton onBack={back} />}
                    middle={toolbarMiddle}
                    actions={actions}
                    altMobileLayout
                />
            )}
            loadingClassname={styles.loadingIndicator}
            contentClassname={cx({
                [coreLayoutStyles.pad]: !isPreview,
                [styles.editorContent]: !isPreview,
                [styles.previewContent]: !!isPreview,
            })}
            loading={isLoading || (isPreview && fetchingAllStreams)}
        >
            <CoreHelmet title={product.name} />
            {isPreview && (
                <Preview />
            )}
            {!isPreview && (
                <Editor disabled={isDisabled} />
            )}
            <ConfirmSaveModal />
            <DeployDataUnionModal />
            <PublishModal />
            <CropImageModal />
            <WhitelistEditModal />
        </CoreLayout>
    )
}

const LoadingView = () => (
    <CoreLayout
        className={styles.layout}
        nav={(
            <Nav noWide />
        )}
        loading
        navComponent={(
            <Toolbar
                actions={{}}
                altMobileLayout
            />
        )}
    />
)

const EditWrap = () => {
    const product = useEditableProduct()
    const { isPending: isLoadPending } = usePending('product.LOAD')
    const { isPending: isPermissionsPending } = usePending('product.PERMISSIONS')
    const { hasPermissions, edit } = useProductPermissions()
    const canEdit = !!edit

    if (hasPermissions && !isPermissionsPending && !canEdit) {
        throw new ResourceNotFoundError(ResourceType.PRODUCT, product.id)
    }

    if (!product || isLoadPending || isPermissionsPending || !hasPermissions || !canEdit) {
        return <LoadingView />
    }

    const key = (!!product && product.id) || ''

    return (
        <EditControllerProvider product={product}>
            <EditProductPage
                key={key}
                product={product}
            />
        </EditControllerProvider>
    )
}

const ProductContainer = withRouter((props) => (
    <UndoContext.Provider key={props.match.params.id}>
        <ProductController>
            <EditWrap />
        </ProductController>
    </UndoContext.Provider>
))

export default () => (
    <ProductContainer />
)
