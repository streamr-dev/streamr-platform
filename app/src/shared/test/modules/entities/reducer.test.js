import { normalize } from 'normalizr'

import reducer, { initialState } from '$shared/modules/entities/reducer'
import * as constants from '$shared/modules/entities/constants'
import * as schemas from '$shared/modules/entities/schema'

describe('entities - reducer', () => {
    it('has initial state', () => {
        expect(reducer(undefined, {})).toStrictEqual(initialState)
    })

    it('handles entities', () => {
        const categories = [
            {
                id: 1,
                name: 'Category 1',
            },
            {
                id: 2,
                name: 'Category 2',
            },
        ]
        const products = [
            {
                id: '123456789',
                title: 'Product 1',
            },
            {
                id: '1011121314',
                title: 'Product 2',
            },
        ]
        const { entities: categoryEntities } = normalize(categories, schemas.categoriesSchema)
        const { entities: productEntities } = normalize(products, schemas.productsSchema)

        const expectedState = {
            categories: categories.reduce((result, value) => ({
                ...result,
                [value.id]: value,
            }), {}),
            products: products.reduce((result, value) => ({
                ...result,
                [value.id]: value,
            }), {}),
            contractProducts: {},
            dataUnions: {},
            dataUnionStats: {},
            streams: {},
            relatedProducts: {},
            subscriptions: {},
            transactions: {},
            joinRequests: {},
            dataUnionSecrets: {},
            whitelistedAddresses: {},
        }

        let state = reducer(undefined, {
            type: constants.UPDATE_ENTITIES,
            payload: {
                entities: categoryEntities,
            },
        })
        state = reducer(state, {
            type: constants.UPDATE_ENTITIES,
            payload: {
                entities: productEntities,
            },
        })

        expect(state).toStrictEqual(expectedState)
    })

    it('handles subscriptions', () => {
        const products = [
            {
                id: '123456789',
                title: 'Product 1',
            },
            {
                id: '1011121314',
                title: 'Product 2',
            },
        ]
        const subscriptions = [
            {
                id: products[0].id,
                endsAt: Date(),
                product: {
                    ...products[0],
                },
            },
            {
                id: products[1].id,
                endsAt: Date(),
                product: {
                    ...products[1],
                },
            },
        ]

        const { entities } = normalize(subscriptions, schemas.subscriptionsSchema)

        const expectedState = {
            categories: {},
            products: products.reduce((result, value) => ({
                ...result,
                [value.id]: value,
            }), {}),
            contractProducts: {},
            dataUnions: {},
            dataUnionStats: {},
            streams: {},
            relatedProducts: {},
            transactions: {},
            subscriptions: subscriptions.reduce((result, value) => ({
                ...result,
                [value.product.id]: {
                    id: value.product.id,
                    endsAt: value.endsAt,
                    product: value.product.id,
                },
            }), {}),
            joinRequests: {},
            dataUnionSecrets: {},
            whitelistedAddresses: {},
        }

        expect(reducer(undefined, {
            type: constants.UPDATE_ENTITIES,
            payload: {
                entities,
            },
        })).toStrictEqual(expectedState)
    })
})
