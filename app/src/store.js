// @flow

import thunk from 'redux-thunk'
import { createStore, applyMiddleware, compose, combineReducers } from 'redux'

import entitiesReducer from '$shared/modules/entities/reducer'
import userReducer from '$shared/modules/user/reducer'
import productsReducer from './marketplace/modules/productList/reducer'
import myProductsReducer from './marketplace/modules/myProductList/reducer'
import myPurchasesReducer from './marketplace/modules/myPurchaseList/reducer'
import productReducer from './marketplace/modules/product/reducer'
import contractProductReducer from './marketplace/modules/contractProduct/reducer'
import dataUnionReducer from './marketplace/modules/dataUnion/reducer'
import categoriesReducer from './marketplace/modules/categories/reducer'
import streamsReducer from './marketplace/modules/streams/reducer'
import globalReducer from './marketplace/modules/global/reducer'
import relatedProductsReducer from './marketplace/modules/relatedProducts/reducer'
import transactionsReducer from './marketplace/modules/transactions/reducer'
import userpagesReducers from './userpages/reducers'

import analytics from './analytics'

const middleware = [thunk, ...analytics.getMiddlewares()]
const toBeComposed = [applyMiddleware(...middleware)]

/* eslint-disable no-underscore-dangle */
if (window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()) {
    toBeComposed.push(window.__REDUX_DEVTOOLS_EXTENSION__())
}
/* eslint-enable no-underscore-dangle */

export function initStore() {
    const store = createStore(
        combineReducers({
            categories: categoriesReducer,
            contractProduct: contractProductReducer,
            dataUnion: dataUnionReducer,
            entities: entitiesReducer,
            global: globalReducer,
            myProductList: myProductsReducer,
            myPurchaseList: myPurchasesReducer,
            product: productReducer,
            productList: productsReducer,
            streams: streamsReducer,
            user: userReducer,
            relatedProducts: relatedProductsReducer,
            transactions: transactionsReducer,
            ...userpagesReducers,
        }),
        compose(...toBeComposed),
    )

    return store
}

export default initStore()
