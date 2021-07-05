// @flow

import React from 'react'
import StoryRouter from 'storybook-react-router'
import { storiesOf } from '@storybook/react'
import { withKnobs, select, text, number, boolean } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import styles from '@sambego/storybook-styles'
import BN from 'bignumber.js'

import { transactionStates, timeUnits } from '$shared/utils/constants'
import { subscribeSnippets } from '$utils/streamSnippets'
import PngIcon from '$shared/components/PngIcon'

import croppedImage from '$mp/assets/product_standard.png'
import { publishModes, actionsTypes as publishActionTypes } from '$mp/containers/EditProductPage/usePublish'
import { actionsTypes as purchaseActionTypes } from '$mp/containers/ProductPage/usePurchase'
import { actionsTypes as whitelistActionTypes } from '$mp/containers/EditProductPage/useUpdateWhitelist'

// marketplace
import PublishTransactionProgress from '$mp/components/Modal/PublishTransactionProgress'
import PublishComplete from '$mp/components/Modal/PublishComplete'
import PublishError from '$mp/components/Modal/PublishError'
import GuidedDeployDataUnionDialog from '$mp/components/Modal/GuidedDeployDataUnionDialog'
import ConfirmDeployDataUnionDialog from '$mp/components/Modal/ConfirmDeployDataUnionDialog'
import DeployingDataUnionDialog from '$mp/components/Modal/DeployingDataUnionDialog'
import GetDataTokensDialog from '$mp/components/Modal/GetDataTokensDialog'
import GetCryptoDialog from '$mp/components/Modal/GetCryptoDialog'
import InsufficientDataDialog from '$mp/components/Modal/InsufficientDataDialog'
import InsufficientDaiDialog from '$mp/components/Modal/InsufficientDaiDialog'
import InsufficientEthDialog from '$mp/components/Modal/InsufficientEthDialog'
import NoBalanceDialog from '$mp/components/Modal/NoBalanceDialog'
import ChooseAccessPeriodDialog from '$mp/components/Modal/ChooseAccessPeriodDialog'
import PurchaseSummaryDialog from '$mp/components/Modal/PurchaseSummaryDialog'
import PurchaseTransactionProgress from '$mp/components/Modal/PurchaseTransactionProgress'
import PurchaseComplete from '$mp/components/Modal/PurchaseComplete'
import PurchaseError from '$mp/components/Modal/PurchaseError'
import ReadyToPublishDialog from '$mp/components/Modal/ReadyToPublishDialog'
import ConnectEthereumAddressDialog from '$mp/components/Modal/ConnectEthereumAddressDialog'
import ErrorDialog from '$mp/components/Modal/ErrorDialog'
import CropImageModal from '$mp/components/Modal/CropImageModal'
import AddWhitelistedAddressDialog from '$mp/components/Modal/AddWhitelistedAddressDialog'
import RemoveWhitelistedAddressDialog from '$mp/components/Modal/RemoveWhitelistedAddressDialog'
import WhitelistEditProgressDialog from '$mp/components/Modal/WhitelistEditProgressDialog'
import WhitelistEditErrorDialog from '$mp/components/Modal/WhitelistEditErrorDialog'
import WhitelistRequestAccessDialog from '$mp/components/Modal/WhitelistRequestAccessDialog'

// userpages
import SnippetDialog from '$userpages/components/SnippetDialog'
import AvatarUploadDialog from '$userpages/components/ProfilePage/ProfileSettings/EditAvatarDialog/AvatarUploadDialog'
import CropAvatarDialog from '$userpages/components/ProfilePage/ProfileSettings/EditAvatarDialog/CropAvatarDialog'
import { DeleteAccountDialogComponent } from '$userpages/components/ProfilePage/DeleteAccount/DeleteAccountDialog'

// shared
import ConfirmDialog from '$shared/components/ConfirmDialog'
import UnlockWalletDialog from '$shared/components/Web3ErrorDialog/UnlockWalletDialog'
import InstallMetaMaskDialog from '$shared/components/Web3ErrorDialog/Web3NotDetectedDialog/InstallMetaMaskDialog'
import InstallMobileApplicationDialog from '$shared/components/Web3ErrorDialog/Web3NotDetectedDialog/InstallMobileApplicationDialog'
import InstallSupportedBrowserDialog from '$shared/components/Web3ErrorDialog/Web3NotDetectedDialog/InstallSupportedBrowserDialog'
import ConfirmSaveDialog from '$shared/components/ConfirmSaveDialog'

const story = (name) => storiesOf(`Modal/${name}`, module)
    .addDecorator(StoryRouter())
    .addDecorator(withKnobs)
    .addDecorator(styles({
        color: '#323232',
        padding: '5rem',
        background: '#F8F8F8',
        fontSize: '16px',
    }))
    .addDecorator((storyFn) => (
        <div>
            <div id="content">{storyFn()}</div>
            <div id="modal-root" />
        </div>
    ))

const options = [
    transactionStates.STARTED,
    transactionStates.PENDING,
    transactionStates.CONFIRMED,
    transactionStates.FAILED,
]

story('Product Editor/PublishTransactionProgress')
    .add('Publish', () => {
        const adminFeeStatus = select('Admin Fee', options, transactionStates.STARTED)
        const updateContractStatus = select('Edit product price', options, transactionStates.STARTED)
        const createContractStatus = select('Create contract product', options, transactionStates.STARTED)
        const redeployPaidStatus = select('Redeploy paid', options, transactionStates.STARTED)
        const publishFreeStatus = select('Publish free', options, transactionStates.STARTED)
        const publishPendingStatus = select('Publish penging changes', options, transactionStates.STARTED)

        const statuses = {
            [publishActionTypes.UPDATE_ADMIN_FEE]: adminFeeStatus,
            [publishActionTypes.UPDATE_CONTRACT_PRODUCT]: updateContractStatus,
            [publishActionTypes.CREATE_CONTRACT_PRODUCT]: createContractStatus,
            [publishActionTypes.REDEPLOY_PAID]: redeployPaidStatus,
            [publishActionTypes.PUBLISH_FREE]: publishFreeStatus,
            [publishActionTypes.PUBLISH_PENDING_CHANGES]: publishPendingStatus,
        }

        return (
            <PublishTransactionProgress
                publishMode={publishModes.PUBLISH}
                onCancel={action('cancel')}
                status={statuses}
                isPrompted={boolean('Prompted', false)}
            />
        )
    })
    .add('Republish', () => {
        const adminFeeStatus = select('Admin Fee', options, transactionStates.STARTED)
        const updateContractStatus = select('Edit product price', options, transactionStates.STARTED)
        const createContractStatus = select('Create contract product', options, transactionStates.STARTED)
        const redeployPaidStatus = select('Redeploy paid', options, transactionStates.STARTED)
        const publishFreeStatus = select('Publish free', options, transactionStates.STARTED)
        const publishPendingStatus = select('Publish penging changes', options, transactionStates.STARTED)

        const statuses = {
            [publishActionTypes.UPDATE_ADMIN_FEE]: adminFeeStatus,
            [publishActionTypes.UPDATE_CONTRACT_PRODUCT]: updateContractStatus,
            [publishActionTypes.CREATE_CONTRACT_PRODUCT]: createContractStatus,
            [publishActionTypes.REDEPLOY_PAID]: redeployPaidStatus,
            [publishActionTypes.PUBLISH_FREE]: publishFreeStatus,
            [publishActionTypes.PUBLISH_PENDING_CHANGES]: publishPendingStatus,
        }

        return (
            <PublishTransactionProgress
                publishMode={publishModes.REPUBLISH}
                onCancel={action('cancel')}
                status={statuses}
                isPrompted={boolean('Prompted', false)}
            />
        )
    })
    .add('Redeploy', () => {
        const adminFeeStatus = select('Admin Fee', options, transactionStates.STARTED)
        const updateContractStatus = select('Edit product price', options, transactionStates.STARTED)
        const createContractStatus = select('Create contract product', options, transactionStates.STARTED)
        const redeployPaidStatus = select('Redeploy paid', options, transactionStates.STARTED)
        const publishFreeStatus = select('Publish free', options, transactionStates.STARTED)
        const publishPendingStatus = select('Publish penging changes', options, transactionStates.STARTED)

        const statuses = {
            [publishActionTypes.UPDATE_ADMIN_FEE]: adminFeeStatus,
            [publishActionTypes.UPDATE_CONTRACT_PRODUCT]: updateContractStatus,
            [publishActionTypes.CREATE_CONTRACT_PRODUCT]: createContractStatus,
            [publishActionTypes.REDEPLOY_PAID]: redeployPaidStatus,
            [publishActionTypes.PUBLISH_FREE]: publishFreeStatus,
            [publishActionTypes.PUBLISH_PENDING_CHANGES]: publishPendingStatus,
        }

        return (
            <PublishTransactionProgress
                publishMode={publishModes.REDEPLOY}
                onCancel={action('cancel')}
                status={statuses}
                isPrompted={boolean('Prompted', false)}
            />
        )
    })
    .add('Unpublish', () => {
        const unpublishFreeStatus = select('Unpublish free', options, transactionStates.STARTED)
        const undeployPaidStatus = select('Undeploy paid', options, transactionStates.STARTED)

        const statuses = {
            [publishActionTypes.UNPUBLISH_FREE]: unpublishFreeStatus,
            [publishActionTypes.UNDEPLOY_CONTRACT_PRODUCT]: undeployPaidStatus,
        }

        return (
            <PublishTransactionProgress
                publishMode={publishModes.UNPUBLISH}
                onCancel={action('cancel')}
                status={statuses}
            />
        )
    })

story('Product Editor/PublishComplete')
    .add('Publish', () => (
        <PublishComplete
            onClose={action('onClose')}
            onContinue={action('onContinue')}
            productId={text('Product id', '1ff644fdb6ba40a287af2e607b131f32aaad9872ddd54e79b1106ff916e12890')}
            publishMode={publishModes.PUBLISH}
        />
    ))
    .add('Redeploy', () => (
        <PublishComplete
            onClose={action('onClose')}
            onContinue={action('onContinue')}
            productId={text('Product id', '1ff644fdb6ba40a287af2e607b131f32aaad9872ddd54e79b1106ff916e12890')}
            publishMode={publishModes.REDEPLOY}
        />
    ))
    .add('Republish', () => (
        <PublishComplete
            onClose={action('onClose')}
            onContinue={action('onContinue')}
            productId={text('Product id', '1ff644fdb6ba40a287af2e607b131f32aaad9872ddd54e79b1106ff916e12890')}
            publishMode={publishModes.REPUBLISH}
        />
    ))
    .add('Unpublish', () => (
        <PublishComplete
            onClose={action('onClose')}
            onContinue={action('onContinue')}
            productId={text('Product id', '1ff644fdb6ba40a287af2e607b131f32aaad9872ddd54e79b1106ff916e12890')}
            publishMode={publishModes.UNPUBLISH}
        />
    ))

story('Product Editor/PublishError')
    .add('Publish', () => {
        const adminFeeStatus = select('Admin Fee', options, transactionStates.STARTED)
        const updateContractStatus = select('Edit product price', options, transactionStates.STARTED)
        const createContractStatus = select('Create contract product', options, transactionStates.STARTED)
        const redeployPaidStatus = select('Redeploy paid', options, transactionStates.STARTED)
        const publishFreeStatus = select('Publish free', options, transactionStates.STARTED)
        const publishPendingStatus = select('Publish penging changes', options, transactionStates.STARTED)

        const statuses = {
            [publishActionTypes.UPDATE_ADMIN_FEE]: adminFeeStatus,
            [publishActionTypes.UPDATE_CONTRACT_PRODUCT]: updateContractStatus,
            [publishActionTypes.CREATE_CONTRACT_PRODUCT]: createContractStatus,
            [publishActionTypes.REDEPLOY_PAID]: redeployPaidStatus,
            [publishActionTypes.PUBLISH_FREE]: publishFreeStatus,
            [publishActionTypes.PUBLISH_PENDING_CHANGES]: publishPendingStatus,
        }

        return (
            <PublishError
                onClose={action('onClose')}
                status={statuses}
                publishMode={publishModes.PUBLISH}
            />
        )
    })
    .add('Republish', () => {
        const adminFeeStatus = select('Admin Fee', options, transactionStates.STARTED)
        const updateContractStatus = select('Edit product price', options, transactionStates.STARTED)
        const createContractStatus = select('Create contract product', options, transactionStates.STARTED)
        const redeployPaidStatus = select('Redeploy paid', options, transactionStates.STARTED)
        const publishFreeStatus = select('Publish free', options, transactionStates.STARTED)
        const publishPendingStatus = select('Publish penging changes', options, transactionStates.STARTED)

        const statuses = {
            [publishActionTypes.UPDATE_ADMIN_FEE]: adminFeeStatus,
            [publishActionTypes.UPDATE_CONTRACT_PRODUCT]: updateContractStatus,
            [publishActionTypes.CREATE_CONTRACT_PRODUCT]: createContractStatus,
            [publishActionTypes.REDEPLOY_PAID]: redeployPaidStatus,
            [publishActionTypes.PUBLISH_FREE]: publishFreeStatus,
            [publishActionTypes.PUBLISH_PENDING_CHANGES]: publishPendingStatus,
        }

        return (
            <PublishError
                onClose={action('onClose')}
                status={statuses}
                publishMode={publishModes.REPUBLISH}
            />
        )
    })
    .add('Redeploy', () => {
        const adminFeeStatus = select('Admin Fee', options, transactionStates.STARTED)
        const updateContractStatus = select('Edit product price', options, transactionStates.STARTED)
        const createContractStatus = select('Create contract product', options, transactionStates.STARTED)
        const redeployPaidStatus = select('Redeploy paid', options, transactionStates.STARTED)
        const publishFreeStatus = select('Publish free', options, transactionStates.STARTED)
        const publishPendingStatus = select('Publish penging changes', options, transactionStates.STARTED)

        const statuses = {
            [publishActionTypes.UPDATE_ADMIN_FEE]: adminFeeStatus,
            [publishActionTypes.UPDATE_CONTRACT_PRODUCT]: updateContractStatus,
            [publishActionTypes.CREATE_CONTRACT_PRODUCT]: createContractStatus,
            [publishActionTypes.REDEPLOY_PAID]: redeployPaidStatus,
            [publishActionTypes.PUBLISH_FREE]: publishFreeStatus,
            [publishActionTypes.PUBLISH_PENDING_CHANGES]: publishPendingStatus,
        }

        return (
            <PublishError
                onClose={action('onClose')}
                status={statuses}
                publishMode={publishModes.REDEPLOY}
            />
        )
    })
    .add('Unpublish', () => {
        const unpublishFreeStatus = select('Unpublish free', options, transactionStates.STARTED)
        const undeployPaidStatus = select('Undeploy paid', options, transactionStates.STARTED)

        const statuses = {
            [publishActionTypes.UNPUBLISH_FREE]: unpublishFreeStatus,
            [publishActionTypes.UNDEPLOY_CONTRACT_PRODUCT]: undeployPaidStatus,
        }

        return (
            <PublishError
                onClose={action('onClose')}
                status={statuses}
                publishMode={publishModes.UNPUBLISH}
            />
        )
    })

story('Product Editor/ReadyToPublishDialog')
    .add('Publish', () => (
        <ReadyToPublishDialog
            onCancel={action('onCancel')}
            onContinue={action('onContinue')}
            publishMode={publishModes.PUBLISH}
        />
    ))
    .add('Republish', () => (
        <ReadyToPublishDialog
            onCancel={action('onCancel')}
            onContinue={action('onContinue')}
            publishMode={publishModes.REPUBLISH}
        />
    ))
    .add('Redeploy', () => (
        <ReadyToPublishDialog
            onCancel={action('onCancel')}
            onContinue={action('onContinue')}
            publishMode={publishModes.REDEPLOY}
        />
    ))
    .add('Unpublish', () => (
        <ReadyToPublishDialog
            onCancel={action('onCancel')}
            onContinue={action('onContinue')}
            publishMode={publishModes.UNPUBLISH}
        />
    ))

story('Product Editor/GuidedDeployDataUnionDialog')
    .add('default', () => (
        <GuidedDeployDataUnionDialog
            // $FlowFixMe missing properties are fine here
            product={{
                id: '1',
                name: 'Example product',
                type: 'DATAUNION',
            }}
            onClose={action('onClose')}
            onContinue={action('onContinue')}
        />
    ))

story('Product Editor/ConfirmDeployDataUnionDialog')
    .add('default', () => (
        <ConfirmDeployDataUnionDialog
            // $FlowFixMe missing properties are fine here
            product={{
                id: '1',
                name: 'Example product',
                type: 'DATAUNION',
            }}
            onClose={action('onClose')}
            onContinue={action('onContinue')}
            onShowGuidedDialog={action('onShowGuidedDialog')}
        />
    ))

story('Product Editor/DeployingCommunityDialog')
    .add('default', () => (
        <DeployingDataUnionDialog
            // $FlowFixMe missing properties are fine here
            product={{
                id: '1',
                name: 'Example product',
                type: 'DATAUNION',
            }}
            estimate={number('Estimate', 360)}
            onClose={action('onClose')}
            onContinue={action('onContinue')}
        />
    ))
    .add('minimized', () => (
        <DeployingDataUnionDialog
            // $FlowFixMe missing properties are fine here
            product={{
                id: '1',
                name: 'Example product',
                type: 'DATAUNION',
            }}
            estimate={number('Estimate', 360)}
            onClose={action('onClose')}
            onContinue={action('onContinue')}
            minimized
        />
    ))

story('Marketplace/GetDataTokensDialog')
    .add('default', () => (
        <GetDataTokensDialog
            onCancel={action('onCancel')}
        />
    ))
    .add('default iPhone', () => (
        <GetDataTokensDialog
            onCancel={action('onCancel')}
        />
    ), {
        viewport: {
            defaultViewport: 'iPhone',
        },
    })

story('Marketplace/GetCryptoDialog')
    .add('default', () => (
        <GetCryptoDialog
            onCancel={action('onCancel')}
        />
    ))
    .add('default (iPhone)', () => (
        <GetCryptoDialog
            onCancel={action('onCancel')}
        />
    ), {
        viewport: {
            defaultViewport: 'iPhone',
        },
    })

story('Marketplace/InsufficientDataDialog')
    .add('default', () => (
        <InsufficientDataDialog
            onCancel={action('onCancel')}
        />
    ))
    .add('default (iPhone)', () => (
        <InsufficientDataDialog
            onCancel={action('onCancel')}
        />
    ), {
        viewport: {
            defaultViewport: 'iPhone',
        },
    })

story('Marketplace/InsufficientDaiDialog')
    .add('default', () => (
        <InsufficientDaiDialog
            onCancel={action('onCancel')}
        />
    ))
    .add('default (iPhone)', () => (
        <InsufficientDaiDialog
            onCancel={action('onCancel')}
        />
    ), {
        viewport: {
            defaultViewport: 'iPhone',
        },
    })

story('Marketplace/InsufficientEthDialog')
    .add('default', () => (
        <InsufficientEthDialog
            onCancel={action('onCancel')}
        />
    ))
    .add('default (iPhone)', () => (
        <InsufficientEthDialog
            onCancel={action('onCancel')}
        />
    ), {
        viewport: {
            defaultViewport: 'iPhone',
        },
    })

story('Marketplace/NoBalanceDialog')
    .add('eth balance 0', () => (
        <NoBalanceDialog
            required={{
                gas: BN(0),
            }}
            balances={{
                eth: BN(0),
            }}
            paymentCurrency="DATA"
            onCancel={action('onCancel')}
        />
    ))
    .add('eth balance < required', () => (
        <NoBalanceDialog
            required={{
                gas: BN(1),
                eth: BN(2),
            }}
            balances={{
                eth: BN(1),
                data: BN(0),
            }}
            paymentCurrency="ETH"
            onCancel={action('onCancel')}
        />
    ))
    .add('DATA balance 0', () => (
        <NoBalanceDialog
            required={{
                gas: BN(0),
                eth: BN(2),
            }}
            balances={{
                eth: BN(3),
                data: BN(0),
            }}
            paymentCurrency="DATA"
            onCancel={action('onCancel')}
        />
    ))
    .add('DATA balance < required', () => (
        <NoBalanceDialog
            required={{
                gas: BN(0),
                eth: BN(2),
                data: BN(3),
            }}
            balances={{
                eth: BN(3),
                data: BN(2),
            }}
            paymentCurrency="DATA"
            onCancel={action('onCancel')}
        />
    ))
    .add('DAI balance < required', () => (
        <NoBalanceDialog
            required={{
                gas: BN(0),
                eth: BN(2),
                dai: BN(3),
            }}
            balances={{
                eth: BN(3),
                dai: BN(2),
            }}
            paymentCurrency="DAI"
            onCancel={action('onCancel')}
        />
    ))

story('Marketplace/ChooseAccessPeriodDialog')
    .add('default', () => (
        <ChooseAccessPeriodDialog
            dataPerUsd={BN(10)}
            pricePerSecond={BN(1).dividedBy(3600)}
            priceCurrency="DATA"
            balances={{
                ETH: BN(10),
                DATA: BN(200),
                DAI: BN(999),
            }}
            onCancel={action('onCancel')}
            onNext={action('onNext')}
        />
    ))
    .add('default (iPhone)', () => (
        <ChooseAccessPeriodDialog
            dataPerUsd={BN(10)}
            pricePerSecond={BN(1).dividedBy(3600)}
            priceCurrency="DATA"
            balances={{
                ETH: BN(10),
                DATA: BN(200),
                DAI: BN(999),
            }}
            onCancel={action('onCancel')}
            onNext={action('onNext')}
        />
    ), {
        viewport: {
            defaultViewport: 'iPhone',
        },
    })
    .add('initial values', () => (
        <ChooseAccessPeriodDialog
            dataPerUsd={BN(10)}
            pricePerSecond={BN(1).dividedBy(3600)}
            priceCurrency="DATA"
            balances={{
                ETH: BN(10),
                DATA: BN(200),
                DAI: BN(999),
            }}
            onCancel={action('onCancel')}
            onNext={action('onNext')}
            initialValues={{
                time: '1',
                timeUnit: 'day',
                paymentCurrency: 'ETH',
                price: '-',
                approxUsd: '-',
            }}
        />
    ))

story('Marketplace/PurchaseSummaryDialog')
    .add('default', () => (
        <PurchaseSummaryDialog
            name="Example Product"
            price={BN(123)}
            paymentCurrency="DATA"
            time={text('Time', '24')}
            timeUnit={select('Time unit', timeUnits, 'hour')}
            approxUsd="0.11"
            onBack={action('onBack')}
            onCancel={action('onCancel')}
            onPay={action('onPay')}
        />
    ))
    .add('default (iPhone)', () => (
        <PurchaseSummaryDialog
            name="Example Product"
            price={BN(123)}
            paymentCurrency="DATA"
            time="24"
            timeUnit="hour"
            approxUsd="0.11"
            onBack={action('onBack')}
            onCancel={action('onCancel')}
            onPay={action('onPay')}
        />
    ), {
        viewport: {
            defaultViewport: 'iPhone',
        },
    })
    .add('waiting', () => (
        <PurchaseSummaryDialog
            name="Example Product"
            price={BN(123)}
            paymentCurrency="DATA"
            time="24"
            timeUnit="hour"
            approxUsd="0.11"
            onBack={action('onBack')}
            onCancel={action('onCancel')}
            onPay={action('onPay')}
            waiting
        />
    ))
    .add('waiting (iPhone)', () => (
        <PurchaseSummaryDialog
            name="Example Product"
            price={BN(123)}
            paymentCurrency="DATA"
            time="24"
            timeUnit="hour"
            approxUsd="0.11"
            onBack={action('onBack')}
            onCancel={action('onCancel')}
            onPay={action('onPay')}
            waiting
        />
    ), {
        viewport: {
            defaultViewport: 'iPhone',
        },
    })

story('Marketplace/PurchaseTransactionProgress')
    .add('default', () => {
        const resetDataAllowanceStatus = select('Reset DATA Allowance', options, transactionStates.STARTED)
        const setDataAllowanceStatus = select('Set DATA Allowance', options, transactionStates.STARTED)
        const resetDaiAllowanceStatus = select('Reset DAI Allowance', options, transactionStates.STARTED)
        const setDaiAllowanceStatus = select('Set DAI Allowance', options, transactionStates.STARTED)
        const purchaseStateStatus = select('Purchase', options, transactionStates.STARTED)

        const statuses = {
            [purchaseActionTypes.RESET_DATA_ALLOWANCE]: resetDataAllowanceStatus,
            [purchaseActionTypes.SET_DATA_ALLOWANCE]: setDataAllowanceStatus,
            [purchaseActionTypes.RESET_DAI_ALLOWANCE]: resetDaiAllowanceStatus,
            [purchaseActionTypes.SET_DAI_ALLOWANCE]: setDaiAllowanceStatus,
            [purchaseActionTypes.SUBSCRIPTION]: purchaseStateStatus,
        }

        const prompt = select('Prompt', {
            none: undefined,
            ...purchaseActionTypes,
        })

        return (
            <PurchaseTransactionProgress
                onCancel={action('cancel')}
                status={statuses}
                prompt={prompt}
            />
        )
    })

story('Marketplace/ConnectEthereumAddressDialog')
    .add('default', () => (
        <ConnectEthereumAddressDialog
            onCancel={action('close')}
            onSet={action('onSet')}
        />
    ))
    .add('default (iPhone)', () => (
        <ConnectEthereumAddressDialog
            onCancel={action('close')}
            onSet={action('onSet')}
        />
    ), {
        viewport: {
            defaultViewport: 'iPhone',
        },
    })
    .add('waiting', () => (
        <ConnectEthereumAddressDialog
            onCancel={action('close')}
            onSet={action('onSet')}
            waiting
        />
    ))

story('Marketplace/PurchaseComplete')
    .add('default', () => (
        <PurchaseComplete
            onContinue={action('onContinue')}
            onClose={action('onClose')}
            txHash="0x68dda92ba60240b74b2a79c2b7c87c3316273b40b6d93d6367d95b5a467fe885"
        />
    ))

story('Marketplace/PurchaseError')
    .add('default', () => {
        const resetDataAllowanceStatus = select('Reset DATA Allowance', options, transactionStates.STARTED)
        const setDataAllowanceStatus = select('Set DATA Allowance', options, transactionStates.STARTED)
        const resetDaiAllowanceStatus = select('Reset DAI Allowance', options, transactionStates.STARTED)
        const setDaiAllowanceStatus = select('Set DAI Allowance', options, transactionStates.STARTED)
        const purchaseStateStatus = select('Purchase', options, transactionStates.STARTED)

        const statuses = {
            [purchaseActionTypes.RESET_DATA_ALLOWANCE]: resetDataAllowanceStatus,
            [purchaseActionTypes.SET_DATA_ALLOWANCE]: setDataAllowanceStatus,
            [purchaseActionTypes.RESET_DAI_ALLOWANCE]: resetDaiAllowanceStatus,
            [purchaseActionTypes.SET_DAI_ALLOWANCE]: setDaiAllowanceStatus,
            [purchaseActionTypes.SUBSCRIPTION]: purchaseStateStatus,
        }

        return (
            <PurchaseError
                onClose={action('onClose')}
                status={statuses}
            />
        )
    })

story('Marketplace/ErrorDialog')
    .add('default', () => (
        <ErrorDialog
            onClose={action('close')}
            title={text('Dialog title', 'Dialog title')}
            message={text('Dialog text', 'Dialog text')}
        />
    ))
    .add('waiting', () => (
        <ErrorDialog
            onClose={action('close')}
            title={text('Dialog title', 'Dialog title')}
            message={text('Dialog text', 'Dialog text')}
            waiting
        />
    ))

story('Product Editor/CropImageModal')
    .add('default', () => (
        <CropImageModal
            imageUrl={croppedImage}
            onClose={action('onClose')}
            onSave={action('onSave')}
        />
    ))

story('Product Editor/Whitelist/AddWhitelistedAddress')
    .add('default', () => (
        <AddWhitelistedAddressDialog
            onClose={action('onClose')}
            onContinue={action('onContinue')}
        />
    ))

story('Product Editor/Whitelist/RemoveWhitelistedAddressDialog')
    .add('default', () => (
        <RemoveWhitelistedAddressDialog
            onClose={action('onClose')}
            onContinue={action('onContinue')}
        />
    ))

story('Product Editor/Whitelist/WhitelistEditProgressDialog')
    .add('default', () => {
        const setWhitelistStatus = select('Enable whitelist', options, transactionStates.STARTED)
        const addWhitelistedAddressStatus = select('Add whitelisted address', options, transactionStates.STARTED)
        const removeWhitelistedAddressStatus = select('Remove whitelisted address', options, transactionStates.STARTED)

        const statuses = {
            [whitelistActionTypes.SET_REQUIRES_WHITELIST]: setWhitelistStatus,
            [whitelistActionTypes.ADD_WHITELIST_ADDRESS]: addWhitelistedAddressStatus,
            [whitelistActionTypes.REMOVE_WHITELIST_ADDRESS]: removeWhitelistedAddressStatus,
        }

        return (
            <WhitelistEditProgressDialog
                onCancel={action('onCancel')}
                status={statuses}
                isPrompted={boolean('Prompted', false)}
            />
        )
    })

story('Product Editor/Whitelist/WhitelistEditErrorDialog')
    .add('default', () => {
        const setWhitelistStatus = select('Enable whitelist', options, transactionStates.STARTED)
        const addWhitelistedAddressStatus = select('Add whitelisted address', options, transactionStates.STARTED)
        const removeWhitelistedAddressStatus = select('Remove whitelisted address', options, transactionStates.STARTED)

        const statuses = {
            [whitelistActionTypes.SET_REQUIRES_WHITELIST]: setWhitelistStatus,
            [whitelistActionTypes.ADD_WHITELIST_ADDRESS]: addWhitelistedAddressStatus,
            [whitelistActionTypes.REMOVE_WHITELIST_ADDRESS]: removeWhitelistedAddressStatus,
        }

        return (
            <WhitelistEditErrorDialog
                onClose={action('onClose')}
                status={statuses}
            />
        )
    })

story('Marketplace/WhitelistRequestAccessDialog')
    .add('default', () => (
        <WhitelistRequestAccessDialog
            contactEmail="tester1@streamr.com"
            productName="Test Product"
            onClose={action('onClose')}
        />
    ))

story('Streams/SnippetDialog')
    .add('default', () => (
        <SnippetDialog
            snippets={subscribeSnippets({
                id: 'stream-id',
            })}
            onClose={action('onClose')}
        />
    ))

story('Shared/ConfirmDialog')
    .add('default', () => (
        <ConfirmDialog
            title="Dangerous action"
            message="Are you sure?"
            onAccept={action('onAccept')}
            onReject={action('onReject')}
        />
    ))
    .add('centered buttons', () => (
        <ConfirmDialog
            title="Dangerous action"
            message="Are you sure?"
            centerButtons
            onAccept={action('onAccept')}
            onReject={action('onReject')}
        />
    ))
    .add('don\'t show again selection', () => (
        <ConfirmDialog
            title="Dangerous action"
            message="Are you sure?"
            dontShowAgain
            onAccept={action('onAccept')}
            onReject={action('onReject')}
        />
    ))
    .add('customButtons', () => (
        <ConfirmDialog
            title="Dangerous action"
            message="Are you sure?"
            acceptButton={{
                title: 'Delete',
                kind: 'destructive',
            }}
            cancelButton={{
                title: 'Don\'t delete',
                kind: 'secondary',
            }}
            centerButtons
            onAccept={action('onAccept')}
            onReject={action('onReject')}
        />
    ))

story('Shared/ConfirmSaveDialog')
    .add('default', () => (
        <ConfirmSaveDialog
            onClose={action('onClose')}
            onContinue={action('onContinue')}
            onSave={action('onSave')}
        >
            <p>{text('Dialog text', 'Dialog text')}</p>
        </ConfirmSaveDialog>
    ))

story('Shared/UnlockWalletDialog')
    .add('default', () => (
        <UnlockWalletDialog
            title={text('Dialog title', 'Dialog title')}
            onClose={action('onClose')}
        />
    ))
    .add('with text', () => (
        <UnlockWalletDialog
            title={text('Dialog title', 'Dialog title')}
            onClose={action('onClose')}
        >
            {text('Dialog text', 'Please unlock your wallet')}
        </UnlockWalletDialog>
    ))
    .add('with address', () => (
        <UnlockWalletDialog
            title={text('Dialog title', 'Dialog title')}
            onClose={action('onClose')}
            requiredAddress="0x4178baBE9E5148c6D5fd431cD72884B07Ad855a0"
        >
            {text('Dialog text', 'Please unlock your wallet')}
        </UnlockWalletDialog>
    ))
    .add('with address (iPhone)', () => (
        <UnlockWalletDialog
            title={text('Dialog title', 'Dialog title')}
            onClose={action('onClose')}
            requiredAddress="0x4178baBE9E5148c6D5fd431cD72884B07Ad855a0"
        >
            {text('Dialog text', 'Please unlock your wallet')}
        </UnlockWalletDialog>
    ), {
        viewport: {
            defaultViewport: 'iPhone',
        },
    })
    .add('with different icon', () => (
        <UnlockWalletDialog
            title={text('Dialog title', 'Dialog title')}
            onClose={action('onClose')}
            icon={select('Icon', PngIcon.names, 'walletError')}
        >
            {text('Dialog text', 'Please unlock your wallet')}
        </UnlockWalletDialog>
    ))
    .add('waiting', () => (
        <UnlockWalletDialog
            waiting
            title={text('Dialog title', 'Dialog title')}
            onClose={action('onClose')}
        />
    ))

story('Shared/Web3NotDetectedDialog')
    .add('install Metamask', () => (
        <InstallMetaMaskDialog
            onClose={action('onClose')}
        />
    ))
    .add('install Metamask (iPhone)', () => (
        <InstallMetaMaskDialog
            onClose={action('onClose')}
        />
    ), {
        viewport: {
            defaultViewport: 'iPhone',
        },
    })
    .add('install mobile app', () => (
        <InstallMobileApplicationDialog
            onClose={action('onClose')}
        />
    ))
    .add('install mobile app (iPhone)', () => (
        <InstallMobileApplicationDialog
            onClose={action('onClose')}
        />
    ), {
        viewport: {
            defaultViewport: 'iPhone',
        },
    })
    .add('install supported browser', () => (
        <InstallSupportedBrowserDialog
            onClose={action('onClose')}
        />
    ))
    .add('install supported browser (iPhone)', () => (
        <InstallSupportedBrowserDialog
            onClose={action('onClose')}
        />
    ), {
        viewport: {
            defaultViewport: 'iPhone',
        },
    })

story('Profile/AvatarUploadDialog')
    .add('default', () => (
        <AvatarUploadDialog
            originalImage=""
            onClose={action('onClose')}
            onUpload={action('onUpload')}
        />
    ))
    .add('with original image', () => (
        <AvatarUploadDialog
            originalImage="https://miro.medium.com/fit/c/256/256/1*NfJkA-ChiQtYLRBOLryZxQ.jpeg"
            onClose={action('onClose')}
            onUpload={action('onUpload')}
        />
    ))

story('Profile/CropAvatarDialog')
    .add('default', () => (
        <CropAvatarDialog
            originalImage={croppedImage}
            onClose={action('onClose')}
            onSave={action('onSave')}
        />
    ))
    .add('waiting', () => (
        <CropAvatarDialog
            originalImage={croppedImage}
            onClose={action('onClose')}
            onSave={action('onSave')}
            waiting
        />
    ))

story('Profile/DeleteAccountDialog')
    .add('default', () => (
        <DeleteAccountDialogComponent
            onClose={action('onClose')}
            onSave={action('onSave')}
        />
    ))
    .add('waiting', () => (
        <DeleteAccountDialogComponent
            onClose={action('onClose')}
            onSave={action('onSave')}
            waiting
        />
    ))
