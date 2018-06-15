// @flow

import isObject from 'lodash/isObject'
import last from 'lodash/last'
import queryString from 'query-string'

// Filter out objects, stringify others
const getUrlParts = (args: Array<string | number | Object>): Array<string> => args.filter((arg) => !isObject(arg)).map((arg) => arg.toString())

// Check if the last argument is object and form a query string if it is
const getQueryString = (args: Array<string | number | Object>): ?string => (isObject(last(args)) ? queryString.stringify(last(args)) : null)

// Joins url parts and removes extra slashes
const joinUrlParts = (args: Array<string>) => args.map((p) => p.replace(/^\/|\/$/g, '')).join('/')

/**
 * Formats a path that can be given for react-router (without the base url)
 * @param args url parts
 * @returns {string} path
 */
export const formatPath = (...args: Array<string | number | Object>): string => {
    const query = getQueryString(args)
    const urlParts = getUrlParts(args)

    const stringQuery = query ? `?${query}` : ''
    const uri = joinUrlParts(urlParts).replace(/^\/+$/g, '') // remove multiple consecutive occurences of '/'
    return `/${uri}${stringQuery}`
}

export const formatApiUrl = (...args: Array<string | number | Object>): string => {
    const rootUrl = process.env.STREAMR_API_URL.replace(/\/+$/, '')
    return `${rootUrl}${formatPath(...args)}`
}

export const formatExternalUrl = (...args: Array<string | number | Object>): string => {
    const query = getQueryString(args)
    const urlParts = getUrlParts(args)
    const stringQuery = query ? `?${query}` : ''
    const uri = urlParts.length > 1 ? joinUrlParts(urlParts) : urlParts[0]
    return `${uri}${stringQuery}`
}
