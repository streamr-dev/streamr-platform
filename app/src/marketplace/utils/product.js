// @flow

import BN from 'bignumber.js'
import * as yup from 'yup'

import type { NumberString } from '$shared/flowtype/common-types'
import { contractCurrencies as currencies, productStates } from '$shared/utils/constants'
import InvalidHexStringError from '$shared/errors/InvalidHexStringError'
import type { Product, ProductId, SmartContractProduct, ProductType } from '../flowtype/product-types'
import { isEthereumAddress } from './validate'
import { isPriceValid } from './price'

import { productTypes } from './constants'
import { fromAtto, fromNano, toAtto, toNano } from './math'
import { getPrefixedHexString, getUnprefixedHexString, isValidHexString } from './smartContract'

export const isPaidProduct = (product: Product) => product.isFree === false || BN(product.pricePerSecond).isGreaterThan(0)

export const isDataUnionProduct = (productOrProductType?: Product | ProductType) => {
    const { type } = (typeof productOrProductType === 'string') ? {
        type: productOrProductType,
    } : (productOrProductType || {})

    return type === productTypes.DATAUNION
}

export const validateProductPriceCurrency = (priceCurrency: string) => {
    const currencyIndex = Object.keys(currencies).indexOf(priceCurrency)
    if (currencyIndex < 0) {
        throw new Error(`Invalid currency: ${priceCurrency}`)
    }
}

export const validateApiProductPricePerSecond = (pricePerSecond: NumberString | BN) => {
    if (BN(pricePerSecond).isLessThan(0)) {
        throw new Error('Product price must be equal to or greater than 0')
    }
}

export const validateContractProductPricePerSecond = (pricePerSecond: NumberString | BN) => {
    if (BN(pricePerSecond).isLessThanOrEqualTo(0)) {
        throw new Error('Product price must be greater than 0 to publish')
    }
}

export const mapPriceFromContract = (pricePerSecond: NumberString): string => fromAtto(pricePerSecond).toString()

export const mapProductFromContract = (id: ProductId, result: any): SmartContractProduct => {
    const minimumSubscriptionSeconds = parseInt(result.minimumSubscriptionSeconds, 10)

    return {
        id,
        name: result.name,
        ownerAddress: result.owner,
        beneficiaryAddress: result.beneficiary,
        pricePerSecond: mapPriceFromContract(result.pricePerSecond),
        priceCurrency: Object.keys(currencies)[result.currency],
        minimumSubscriptionInSeconds: Number.isNaN(minimumSubscriptionSeconds) ? 0 : minimumSubscriptionSeconds,
        state: Object.keys(productStates)[result.state],
        requiresWhitelist: result.requiresWhitelist,
    }
}

export const mapPriceToContract = (pricePerSecond: NumberString | BN): string => toAtto(pricePerSecond).toFixed(0)

export const mapPriceFromApi = (pricePerSecond: NumberString): string => fromNano(pricePerSecond).toString()

export const mapPriceToApi = (pricePerSecond: NumberString | BN): string => toNano(pricePerSecond).toFixed(0)

export const mapProductFromApi = (product: Product): Product => {
    const pricePerSecond = mapPriceFromApi(product.pricePerSecond)
    return {
        ...product,
        pricePerSecond,
    }
}

export const mapAllProductsFromApi = (products: Array<Product>): Array<Product> => products.map(mapProductFromApi)

export const mapProductToPostApi = (product: Product): Product => {
    const pricePerSecond = mapPriceToApi(product.pricePerSecond)
    validateApiProductPricePerSecond(pricePerSecond)
    validateProductPriceCurrency(product.priceCurrency)
    return {
        ...product,
        pricePerSecond,
    }
}

export const isPublishedProduct = (p: Product) => p.state === productStates.DEPLOYED

export const mapProductToPutApi = (product: Product): Object => {
    // For published paid products, the some fields can only be updated on the smart contract
    if (isPaidProduct(product) && isPublishedProduct(product)) {
        const {
            ownerAddress,
            beneficiaryAddress,
            pricePerSecond,
            priceCurrency,
            minimumSubscriptionInSeconds,
            ...otherData
        } = product

        return otherData
    }

    const pricePerSecond = mapPriceToApi(product.pricePerSecond)

    return {
        ...product,
        pricePerSecond,
    }
}

export const getValidId = (id: string, prefix: boolean = true): string => {
    if (!isValidHexString(id) || parseInt(id, 16) === 0) {
        throw new InvalidHexStringError(id)
    }
    return prefix ? getPrefixedHexString(id) : getUnprefixedHexString(id)
}

const urlValidator = yup.string().trim().url()
const emailValidator = yup.string().trim().email()

export const validate = (product: Product): Object => {
    const invalidFields = {};

    ['name', 'description', 'category'].forEach((field) => {
        invalidFields[field] = !product[field]
    })

    invalidFields.imageUrl = (!product.imageUrl && !product.newImageToUpload)
    invalidFields.streams = (!product.streams || product.streams.length <= 0)
    invalidFields.termsOfUse = !!(product.termsOfUse != null && product.termsOfUse.termsUrl)

    const isPaid = isPaidProduct(product)

    // applies only to data union
    if (isDataUnionProduct(product)) {
        invalidFields.adminFee = (product.adminFee === undefined || +product.adminFee < 0 || +product.adminFee > 1)
        invalidFields.beneficiaryAddress = false
    } else {
        invalidFields.beneficiaryAddress = (isPaid && (!product.beneficiaryAddress || !isEthereumAddress(product.beneficiaryAddress)))
        invalidFields.adminFee = false
    }

    if (isPaid) {
        invalidFields.pricePerSecond = (!isPriceValid(product.pricePerSecond))
    } else {
        invalidFields.pricePerSecond = false
    }

    if (product.contact) {
        ['url', 'social1', 'social2', 'social3', 'social4'].forEach((field) => {
            // $FlowFixMe product.contact exists
            if (product.contact[field] && product.contact[field].length > 0) {
                // $FlowFixMe product.contact exists
                invalidFields[`contact.${field}`] = !urlValidator.isValidSync(product.contact[field])
            } else {
                invalidFields[`contact.${field}`] = false
            }
        })

        // $FlowFixMe product.contact exists
        if (product.contact.email && product.contact.email.length > 0) {
            const result = emailValidator.isValidSync(product.contact.email)
            // $FlowFixMe product.contact exists
            invalidFields['contact.email'] = (!result && product.contact.email)
        } else {
            invalidFields['contact.email'] = false
        }
    }

    if (product.requiresWhitelist && (product.contact == null || product.contact.email == null || product.contact.email.length === 0)) {
        invalidFields['contact.email'] = true
    } else if (!product.requiresWhitelist) {
        invalidFields['contact.email'] = false
    }

    return invalidFields
}
