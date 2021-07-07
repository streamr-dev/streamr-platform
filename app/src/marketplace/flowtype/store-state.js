// @flow

import TransactionError from '$shared/errors/TransactionError'
import type { Hash, Address, HashList } from '$shared/flowtype/web3-types'
import type { StreamIdList } from '$shared/flowtype/stream-types'
import type { ErrorInUi, NumberString } from '$shared/flowtype/common-types'
import type { Filter as UserpagesFilter } from '$userpages/flowtype/common-types'
import type {
    ProductId,
    ProductIdList,
    Filter,
    Subscription,
    DataUnionId,
    DataUnionSecretId,
} from './product-types'
import type { CategoryIdList } from './category-types'

// categories
export type CategoryState = {
    ids: CategoryIdList,
    fetching: boolean,
    error: ?ErrorInUi,
}

// products
export type ProductListState = {
    ids: ProductIdList,
    filter: Filter,
    fetching: boolean,
    error: ?ErrorInUi,
    pageSize: number,
    offset: number,
    hasMoreSearchResults: ?boolean,
}

// my products
export type MyProductListState = {
    ids: ProductIdList,
    fetching: boolean,
    error: ?ErrorInUi,
}

// my purchases
export type MyPurchaseListState = {
    products: ProductIdList,
    subscriptions: ProductIdList,
    fetching: boolean,
    error: ?ErrorInUi,
    filter: ?UserpagesFilter,
}

// related products
export type RelatedProductListState = {
    ids: ProductIdList,
    fetching: boolean,
    error: ?ErrorInUi,
}

// product
export type ProductState = {
    id: ?ProductId,
    fetchingProduct: boolean,
    productError: ?ErrorInUi,
    streams: StreamIdList,
    fetchingStreams: boolean,
    streamsError: ?ErrorInUi,
    fetchingContractSubscription: boolean,
    contractSubscriptionError: ?ErrorInUi,
    contractSubscription: ?Subscription,
}

// contract product
export type ContractProductState = {
    id: ?ProductId,
    fetchingContractProduct: boolean,
    contractProductError: ?ErrorInUi,
    whitelistedAddresses: Array<Address>,
}

// Data union
export type DataUnionState = {
    id: ?DataUnionId,
    fetching: boolean,
    requested: Array<DataUnionId>,
    ready: Array<DataUnionId>,
    fetchingStats: Array<DataUnionId>,
    secrets: Array<DataUnionSecretId>,
}

// streams
export type StreamsState = {
    ids: StreamIdList,
    fetching: boolean,
    error: ?ErrorInUi,
}

// Purchase
export type PurchaseState = {
    productId: ?ProductId,
    processing: boolean,
    error: ?ErrorInUi,
    purchaseTx: ?Hash,
}

// Allowance
export type AllowanceState = {
    // DATA
    dataAllowance: NumberString,
    pendingDataAllowance: ?NumberString,
    gettingDataAllowance: boolean,
    getDataAllowanceError: ?ErrorInUi,
    settingDataAllowance: boolean,
    setDataAllowanceTx: ?Hash,
    setDataAllowanceError: ?ErrorInUi,
    resettingDataAllowance: boolean,
    resetDataAllowanceTx: ?Hash,
    resetDataAllowanceError: ?ErrorInUi,
    // DAI
    daiAllowance: NumberString,
    pendingDaiAllowance: ?NumberString,
    gettingDaiAllowance: boolean,
    getDaiAllowanceError: ?ErrorInUi,
    settingDaiAllowance: boolean,
    setDaiAllowanceTx: ?Hash,
    setDaiAllowanceError: ?ErrorInUi,
    resettingDaiAllowance: boolean,
    resetDaiAllowanceTx: ?Hash,
    resetDaiAllowanceError: ?ErrorInUi,
}

// web3
export type Web3State = {
    accountId: ?Address,
    error: ?ErrorInUi,
    enabled: boolean,
    ethereumNetworkId: ?NumberString,
}

// global things
export type GlobalState = {
    dataPerUsd: ?NumberString,
    ethereumNetworkIsCorrect: ?boolean,
    checkingNetwork: boolean,
    fetchingDataPerUsdRate: boolean,
    dataPerUsdRateError: ?TransactionError,
    ethereumNetworkError: ?TransactionError,
}

// transactions
export type TransactionsState = {
    pending: HashList,
    completed: HashList,
}

// all combined
export type StoreState = {
    allowance: AllowanceState,
    categories: CategoryState,
    contractProduct: ContractProductState,
    dataUnion: DataUnionState,
    global: GlobalState,
    myProductList: MyProductListState,
    myPurchaseList: MyPurchaseListState,
    product: ProductState,
    productList: ProductListState,
    purchase: PurchaseState,
    relatedProducts: RelatedProductListState,
    streams: StreamsState,
    web3: Web3State,
    transactions: TransactionsState,
}
