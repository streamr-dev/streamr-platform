// @flow

import React, { useContext, useMemo, useState, useCallback, useRef, useEffect } from 'react'

import Scrollspy from 'react-scrollspy'
import { isDataUnionProduct, isPaidProduct } from '$mp/utils/product'
import EditorNavComponent, { statuses } from '$mp/components/ProductPage/EditorNav'

import useEditableProduct from '../ProductController/useEditableProduct'
import useNewProductMode from '../ProductController/useNewProductMode'
import { Context as ValidationContext } from '../ProductController/ValidationContextProvider'
import { Context as EditControllerContext } from './EditControllerProvider'
import { isPublished } from './state'

import styles from './editorNav.pcss'

const SCROLLSPY_OFFSET = -40
const CLICK_OFFSET = -130

const includeIf = (condition: boolean, elements: Array<any>) => (condition ? elements : [])

const EditorNav = () => {
    const product = useEditableProduct()
    const productRef = useRef()
    productRef.current = product
    const isNewProduct = useNewProductMode()

    const [activeSectionId, setActiveSectionId] = useState(undefined)

    const { isValid, isTouched, isPendingChange } = useContext(ValidationContext)
    // lastSectionRef is stored EditControllerContext so it remembers its state when toggling
    const { lastSectionRef, publishAttempted } = useContext(EditControllerContext)

    const isDataUnion = isDataUnionProduct(product)
    const isPublic = isPublished(product)
    const isPaid = isPaidProduct(product)

    const getStatus = useCallback((name: string) => {
        if (isNewProduct && !isTouched(name)) {
            return statuses.EMPTY
        }

        const pending = !isNewProduct && !!isPublic && isPendingChange(name)

        const validState = pending ? statuses.UNPUBLISHED : statuses.VALID

        return isValid(name) ? validState : statuses.ERROR
    }, [isPublic, isPendingChange, isValid, isNewProduct, isTouched])

    const priceStatus = useMemo(() => {
        const price = getStatus('pricePerSecond')

        if (!isDataUnion) {
            return price
        }
        const address = getStatus('beneficiaryAddress')

        if (price === statuses.ERROR || address === statuses.ERROR) {
            return statuses.ERROR
        } else if (price === statuses.UNPUBLISHED || address === statuses.UNPUBLISHED) {
            return statuses.UNPUBLISHED
        } else if (price === statuses.VALID || address === statuses.VALID) {
            return statuses.VALID
        }

        return statuses.EMPTY
    }, [getStatus, isDataUnion])

    const detailsStatus = useMemo(() => {
        const category = getStatus('category')
        const adminFee = getStatus('adminFee')
        const url = getStatus('contact.url')
        const email = getStatus('contact.email')
        const social1 = getStatus('contact.social1')
        const social2 = getStatus('contact.social2')
        const social3 = getStatus('contact.social3')
        const social4 = getStatus('contact.social4')

        const details = [category, url, email, social1, social2, social3, social4]
        if (isDataUnion) {
            details.push(adminFee)
        }

        if (details.includes(statuses.ERROR)) {
            return statuses.ERROR
        } else if (details.includes(statuses.UNPUBLISHED)) {
            return statuses.UNPUBLISHED
        } else if (details.includes(statuses.VALID)) {
            return statuses.VALID
        }

        return statuses.EMPTY
    }, [getStatus, isDataUnion])

    const clickTargetRef = useRef(null)

    const scrollTo = useCallback((id, smooth = true) => {
        const anchor = document.getElementById(id)

        if (anchor) {
            const offsetTop = anchor.getBoundingClientRect().top + window.pageYOffset + CLICK_OFFSET
            window.scroll({
                top: offsetTop,
                behavior: smooth ? 'smooth' : undefined,
            })
            clickTargetRef.current = id
        }
    }, [clickTargetRef])

    const onClickFn = useCallback((id, e) => {
        e.preventDefault()
        scrollTo(id)
    }, [scrollTo])

    const sharedSecretStatus = useMemo(() => {
        if (!publishAttempted) {
            return statuses.EMPTY
        }
        return statuses.VALID
    }, [publishAttempted])

    const sections = useMemo(() => {
        const nextSections = [{
            id: 'product-name',
            heading: 'Name',
            status: getStatus('name'),
        }, {
            id: 'cover-image',
            heading: 'Cover image',
            status: getStatus('imageUrl'),
        }, {
            id: 'description',
            heading: 'Description',
            status: getStatus('description'),
        }, {
            id: 'streams',
            heading: 'Streams',
            status: getStatus('streams'),
        }, {
            id: 'price',
            heading: 'Set price',
            status: priceStatus,
        }, {
            id: 'details',
            heading: 'Details',
            status: detailsStatus,
        },
        ...includeIf(!!isPaid, [{
            id: 'whitelist',
            heading: 'Whitelist',
            status: getStatus('requiresWhitelist'),
        }]),
        ...includeIf(!!isDataUnion, [{
            id: 'shared-secrets',
            heading: 'Shared secrets',
            status: sharedSecretStatus,
        }])]

        return nextSections
    }, [
        getStatus,
        priceStatus,
        detailsStatus,
        isDataUnion,
        sharedSecretStatus,
        isPaid,
    ])

    const sectionWithLinks = useMemo(() => sections.map((section) => ({
        ...section,
        onClick: onClickFn.bind(null, section.id),
    })), [onClickFn, sections])
    const sectionAnchors = useMemo(() => sections.map(({ id }) => id), [sections])

    const onUpdate = useCallback((el) => {
        if (el && typeof el.getAttribute === 'function') {
            const scrolledId = el.getAttribute('id')

            // don't update active position if clicked on a menu item
            if (!clickTargetRef.current || clickTargetRef.current === scrolledId) {
                setActiveSectionId(scrolledId)
                clickTargetRef.current = null
            }
        }
    }, [clickTargetRef])

    const activeSectionRef = useRef()
    activeSectionRef.current = activeSectionId

    useEffect(() => {
        if (lastSectionRef.current) {
            scrollTo(lastSectionRef.current, false)
            setActiveSectionId(lastSectionRef.current)
            lastSectionRef.current = undefined
        }

        return () => {
            lastSectionRef.current = activeSectionRef.current
        }
    }, [scrollTo, lastSectionRef])

    return (
        <Scrollspy
            items={sectionAnchors}
            componentTag="div"
            onUpdate={onUpdate}
            offset={SCROLLSPY_OFFSET}
            className={styles.sticky}
        >
            <EditorNavComponent
                sections={sectionWithLinks}
                activeSection={activeSectionId}
                showErrors={publishAttempted}
                trackScrolling={isNewProduct}
            />
        </Scrollspy>
    )
}

export default EditorNav
