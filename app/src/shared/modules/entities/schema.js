// @flow

import { schema } from 'normalizr'

export const categorySchema = new schema.Entity('categories')
export const categoriesSchema = [categorySchema]

export const productSchema = new schema.Entity('products')
export const productsSchema = [productSchema]

export const contractProductSchema = new schema.Entity('contractProducts')
export const contractProductsSchema = [contractProductSchema]

export const streamSchema = new schema.Entity('streams')
export const streamsSchema = [streamSchema]

export const subscriptionSchema = new schema.Entity(
    'subscriptions',
    {
        product: productSchema,
    },
)
export const subscriptionsSchema = [subscriptionSchema]

export const transactionSchema = new schema.Entity('transactions')
export const transactionsSchema = [transactionSchema]

export const dataUnionSchema = new schema.Entity('dataUnions')
export const dataUnionsSchema = [dataUnionSchema]

export const dataUnionStatSchema = new schema.Entity('dataUnionStats')
export const dataUnionStatsSchema = [dataUnionStatSchema]

export const joinRequestSchema = new schema.Entity('joinRequests')
export const joinRequestsSchema = [joinRequestSchema]

export const dataUnionSecretSchema = new schema.Entity('dataUnionSecrets')
export const dataUnionSecretsSchema = [dataUnionSecretSchema]

export const whiteListedAddressSchema = new schema.Entity('whitelistedAddresses', undefined, {
    idAttribute: 'address',
})
export const whiteListedAddressesSchema = [whiteListedAddressSchema]

export const dataUnionMemberSchema = new schema.Entity('dataUnionMembers', undefined, {
    idAttribute: 'address',
})
export const dataUnionMembersSchema = [dataUnionMemberSchema]
