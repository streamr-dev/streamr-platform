// @flow

import React, { useMemo, useCallback, useState, useEffect } from 'react'
import styled from 'styled-components'
import get from 'lodash/get'
import { useHistory } from 'react-router-dom'

import { type Product } from '$mp/flowtype/product-types'
import { ago } from '$shared/utils/time'
import { productStates, NotificationIcon, dataUnionMemberLimit } from '$shared/utils/constants'
import SvgIcon from '$shared/components/SvgIcon'
import UnstyledFallbackImage from '$shared/components/FallbackImage'
import UnstyledPopover from '$shared/components/Popover'
import Tooltip from '$shared/components/Tooltip'
import { isEthereumAddress } from '$mp/utils/validate'
import { getProductById, putProduct } from '$mp/modules/product/services'
import { validate as validateProduct } from '$mp/utils/product'
import { MEDIUM, SM, LG } from '$shared/utils/styled'
import { getSubscriberCount } from '$mp/modules/contractProduct/services'
import { getDataUnion } from '$mp/modules/dataUnion/services'
import { fromAtto } from '$mp/utils/math'
import useIsMounted from '$shared/hooks/useIsMounted'
import useJoinRequests from '$mp/modules/dataUnion/hooks/useJoinRequests'
import { withPendingChanges } from '$mp/containers/EditProductPage/state'
import useFilterSort from '$userpages/hooks/useFilterSort'
import { getFilters } from '$userpages/utils/constants'
import { truncate, numberToText } from '$shared/utils/text'
import useCopy from '$shared/hooks/useCopy'
import Notification from '$shared/utils/Notification'
import Link from '$shared/components/Link'
import useModal from '$shared/hooks/useModal'
import UnstyledLoadingIndicator from '$shared/components/LoadingIndicator'
import usePending from '$shared/hooks/usePending'
import { DataUnionMembersProvider } from '$mp/modules/dataUnion/hooks/useDataUnionMembers'
import Initials from '$shared/components/AvatarImage/Initials'
import useEntities from '$shared/hooks/useEntities'
import { productSchema } from '$shared/modules/entities/schema'
import routes from '$routes'

import Management from './Management'
import ManageJoinRequests from './ManageJoinRequests'
import ManageMembers from './ManageMembers'

const Container = styled.div`
    width: 100%;
    background: #FFFFFF;
    border: 1px solid #EFEFEF;
    border-radius: 4px;
    margin-bottom: 1rem;
    color: #323232;

    &:hover {
        box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);
    }
`

const LoadingIndicator = styled(UnstyledLoadingIndicator)`
    position: sticky !important;
    top: 0;
`

const Header = styled.div`
    display: grid;
    grid-template-columns: 80px 1fr auto;
    height: 80px;    
`

const ImageContainer = styled.div`
    overflow: hidden;
    position: relative;
    padding: 16px;
    cursor: pointer;
`

const FallbackImage = styled(UnstyledFallbackImage)`
    display: block;
    height: 48px;
    width: 48px;
`

const TitleContainer = styled.div`
    align-self: center;
    cursor: pointer;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
`

const Name = styled.div`
    font-weight: ${MEDIUM};
    font-size: 16px;
    line-height: 18px;
`

const Details = styled.div`
    line-height: 18px;
`

const State = styled.span`
    font-weight: ${MEDIUM};
    font-size: 12px;
    line-height: 18px;
    margin-right: 6px;
    color: ${({ published }) => (published ? '#2AC437' : '#323232')};
`

const Updated = styled.span`
    font-size: 12px;
    line-height: 18px;
    color: #ADADAD;
`

const Address = styled.span`
    font-size: 12px;
    line-height: 20px;
    color: #A3A3A3;
    background: #F8F8F8;
    border-radius: 2px;
    padding: 4px;

    &:hover {
        color: #323232;
    }
`

const Buttons = styled.div`
    align-self: center;
    margin-right: 24px;
    display: none;
    grid-template-columns: auto auto auto auto;
    grid-gap: 4px;

    @media (min-width: ${LG}px) {
        display: grid;
    }
`

const Button = styled(Link)`
    display: flex;
    padding: 0;
    border: none;
    background: none;
    outline: none;
    color: #ADADAD !important;
    transition: 200ms ease-in-out all;
    height: 32px;
    width: 32px;
    border-radius: 2px;

    &:hover {
        color: #323232 !important;
        background-color: #F8F8F8;;
    }

    &:active {
        color: #323232 !important;
        background-color: #EFEFEF;;
    }
`

const Icon = styled(SvgIcon)`
    width: 32px;
    height: 32px;
`

const Popover = styled(UnstyledPopover)`
    display: flex;
    height: 100%;
    border-radius: 2px;
    transition: 200ms ease-in-out all;

    div:first-of-type {
        display: flex;
        height: 100%;

        span {
            height: 100%;
        }

        &:hover {
            color: #323232 !important;
            background-color: #F8F8F8;;
        }

        &:active {
            color: #323232 !important;
            background-color: #EFEFEF;;
        }
    }

    svg {
        display: flex;
        height: 100%;
    }
`

const Stats = styled.div`
    border-top: 1px solid #EFEFEF;
    display: grid;
    grid-template-columns: repeat(3, 1fr);

    @media (min-width: ${SM}px) {
        grid-template-columns: repeat(5, 1fr);
    }

    @media (min-width: ${LG}px) {
        grid-template-columns: repeat(6, 1fr);
    }
`

const Stat = styled.div`
    margin: 16px 0;
    display: block;

    &:last-child {
        border-right: none;
    }

    @media (min-width: ${SM}px) {
        border-right: 1px solid #EFEFEF;

        &:nth-child(5) {
            display: none;
        }
    }

    @media (min-width: ${LG}px) {
        border-right: 1px solid #EFEFEF;

        &:nth-child(5) {
            display: block;
        }
    }
`

const Key = styled.div`
    display: flex;
    justify-content: center;
    font-size: 12px;
    line-height: 26px;
    color: #ADADAD;
`

const Value = styled.div`
    display: flex;
    justify-content: center;
    font-size: 16px;
    line-height: 21px;
    color: #323232;
`

const StyledManagement = styled(Management)`
    display: none;

    ${ManageJoinRequests} {
        display: none;
    }

    ${ManageMembers} {
        display: none;
    }

    @media (min-width: ${SM}px) {
        grid-template-columns: 1fr;
        display: grid;
    }

    @media (min-width: ${LG}px) {
        grid-template-columns: 1fr 1fr;

        ${ManageJoinRequests} {
            display: grid;
        }

        ${ManageMembers} {
            display: grid;
        }
    }
`

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000

type Props = {
    product: Product,
    stats: any,
}

const Item = ({ product, stats }: Props) => {
    const history = useHistory()
    const { copy } = useCopy()
    const isMounted = useIsMounted()
    const productId = product && product.id
    const productName = product && product.name
    const dataUnionId = product && product.beneficiaryAddress

    const [isOpen, setIsOpen] = useState(false)
    const [subscriberCount, setSubscriberCount] = useState(false)
    const [dataUnion, setDataUnion] = useState(null)
    const { update: updateEntities } = useEntities()
    const { wrap: wrapSubscriberLoad, isPending: loadingSubscriberCount } = usePending(`dataunion.item.${productId || ''}.SUBSCRIBERS`)
    const { wrap: wrapDataUnionLoad, isPending: loadingDataUnion } = usePending(`dataunion.item.${productId || ''}.DATAUNION`)
    const { wrap: wrapJoinRequestLoad, isPending: loadingJoinRequests } = usePending(`dataunion.item.${productId || ''}.JOINREQUESTS`)
    const { wrap: wrapPublish, isPending: isPublishPending } = usePending(`dataunion.item.${productId || ''}.PUBLISH`)
    const { wrap: wrapDeploy, isPending: isDeployPending } = usePending(`dataunion.item.${productId || ''}.DEPLOY`)
    const loading = loadingSubscriberCount || loadingDataUnion || loadingJoinRequests || isPublishPending || isDeployPending

    const { api: publishDialog } = useModal('publish')
    const { api: deployDataUnionDialog } = useModal('dataUnion.DEPLOY')
    const { load: loadJoinRequests, members: joinRequests } = useJoinRequests()
    const filters = getFilters('dataunion')
    const sortOptions = useMemo(() => ([
        filters.APPROVE,
    ]), [filters])
    const { filter } = useFilterSort(sortOptions)

    useEffect(() => {
        const load = async () => {
            if (productId) {
                const count = await getSubscriberCount(productId)

                if (isMounted()) {
                    setSubscriberCount(count)
                }
            }
        }
        wrapSubscriberLoad(() => load())
    }, [productId, isMounted, wrapSubscriberLoad])

    useEffect(() => {
        const load = async () => {
            if (dataUnionId) {
                const du = await getDataUnion(dataUnionId)

                if (isMounted()) {
                    setDataUnion(du)
                }
            }
        }
        wrapDataUnionLoad(() => load())
    }, [dataUnionId, isMounted, wrapDataUnionLoad])

    useEffect(() => {
        const load = async () => {
            if (dataUnionId) {
                await loadJoinRequests({
                    dataUnionId,
                    filter,
                })
            }
        }
        wrapJoinRequestLoad(() => load())
    }, [loadJoinRequests, dataUnionId, filter, wrapJoinRequestLoad])

    const productState = useMemo(() => {
        if (product.state === productStates.DEPLOYED &&
            isEthereumAddress(product.beneficiaryAddress)) {
            return 'Published'
        }
        return 'Draft'
    }, [product])

    const revenue = useMemo(() => fromAtto(get(stats, 'totalEarnings', 0)), [stats])

    const adminFees = useMemo(() => {
        if (dataUnion) {
            const { adminFee } = dataUnion
            const fee = Number.parseFloat(adminFee)

            if (fee) {
                return revenue * fee
            }
        }
        return 0
    }, [revenue, dataUnion])

    const avgUserRevenue = useMemo(() => {
        const memberCount = get(stats, 'memberCount.total', 0)
        const created = get(product, 'created', 0)
        const ageMs = Date.now() - Date.parse(created)
        const ageInWeeks = ageMs / WEEK_IN_MS

        if (revenue <= 0) {
            return 0
        }

        return revenue / ageInWeeks / memberCount
    }, [revenue, product, stats])

    const onHeaderClick = useCallback(() => {
        setIsOpen(!isOpen)
    }, [isOpen])

    const validate = useCallback((product) => {
        const invalidFields = validateProduct(product)
        const errors = Object.keys(invalidFields)
            .filter((field) => !!invalidFields[field])
            .map((field) => field)

        const valid = !!(errors.length <= 0)

        if (!!valid && isEthereumAddress(product.beneficiaryAddress)) {
            const { active: activeMembers } = (stats && stats.memberCount) || {}

            if ((activeMembers || 0) < dataUnionMemberLimit) {
                Notification.push({
                    title: `The minimum community size for a Data Union is ${dataUnionMemberLimit === 1 ?
                        'one member' :
                        `${numberToText(dataUnionMemberLimit)} members`
                    }.`,
                    icon: NotificationIcon.ERROR,
                })

                return {
                    valid: false,
                    redirect: false,
                }
            }
        }

        return {
            valid,
            redirect: !valid,
        }
    }, [stats])

    const redirectToEditProduct = useCallback((productId) => {
        if (!isMounted()) { return }
        history.push(routes.products.edit({
            id: productId,
            publishAttempted: 1,
        }))
    }, [
        isMounted,
        history,
    ])

    const publish = useCallback(async (productId) => wrapPublish(async () => {
        const product = await getProductById(productId || '')
        const productWithPendingChanges = withPendingChanges(product)

        const { valid, redirect } = validate(productWithPendingChanges)

        if (valid) {
            await publishDialog.open({
                product,
            })
        } else if (redirect) {
            redirectToEditProduct(productId)
        }
    }), [wrapPublish, validate, publishDialog, redirectToEditProduct])

    const deploy = useCallback(async (productId) => wrapDeploy(async () => {
        const product = await getProductById(productId || '')
        const productWithPendingChanges = withPendingChanges(product)

        const { valid, redirect } = validate(productWithPendingChanges)

        if (valid) {
            let updatedProduct = product
            const updateAddress = async (beneficiaryAddress) => {
                updatedProduct = await putProduct({
                    ...product,
                    beneficiaryAddress,
                }, product.id || '')
            }
            await deployDataUnionDialog.open({
                product,
                updateAddress,
            })
            updateEntities({
                data: updatedProduct,
                schema: productSchema,
            })
        } else if (redirect) {
            redirectToEditProduct(productId)
        }
    }), [
        wrapDeploy,
        validate,
        deployDataUnionDialog,
        updateEntities,
        redirectToEditProduct,
    ])

    const productInitials = useMemo(() => {
        const initials = (productName || '').split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2)
            .join('')
            .toUpperCase()

        return (
            <Initials>
                {initials}
            </Initials>
        )
    }, [productName])

    return (
        <Container>
            <Header>
                <ImageContainer onClick={onHeaderClick}>
                    <FallbackImage
                        alt={product.name || ''}
                        src={product.imageUrl || ''}
                        placeholder={productInitials}
                    />
                </ImageContainer>
                <TitleContainer onClick={onHeaderClick}>
                    <Name>
                        {product.name}
                    </Name>
                    <Details>
                        <State published={productState === 'Published'}>
                            {productState}
                        </State>
                        {dataUnion ? (
                            <Tooltip value="Copy DU address">
                                <Address
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        copy(dataUnion.id)
                                        Notification.push({
                                            title: 'DU address copied to clipboard',
                                            icon: NotificationIcon.CHECKMARK,
                                        })
                                    }}
                                >
                                    {truncate(dataUnion.id)}
                                </Address>
                            </Tooltip>
                        ) : (
                            <Updated>
                                Updated {ago(new Date(product.updated || 0))}
                            </Updated>
                        )}
                    </Details>
                </TitleContainer>
                <Buttons>
                    {dataUnion && (
                        <Tooltip value="View on Etherscan">
                            <Button
                                href={
                                    routes.etherscanAddress({
                                        address: dataUnion.id,
                                    })
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Icon name="externalLink" />
                            </Button>
                        </Tooltip>
                    )}
                    <Tooltip value="Edit product">
                        <Button
                            to={
                                routes.products.edit({
                                    id: product.id,
                                })
                            }
                        >
                            <Icon name="pencil" />
                        </Button>
                    </Tooltip>
                    {product.state === productStates.DEPLOYED && (
                        <Tooltip value="View on marketplace">
                            <Button
                                to={
                                    routes.marketplace.product({
                                        id: product.id,
                                    })
                                }
                            >
                                <Icon name="eye" />
                            </Button>
                        </Tooltip>
                    )}
                    <Popover
                        title="Options"
                        caret={false}
                        type="meatball"
                        menuProps={{
                            right: true,
                        }}
                    >
                        {!dataUnion && (
                            <Popover.Item
                                onClick={async () => {
                                    deploy(product.id)
                                }}
                                disabled={loading}
                            >
                                Deploy
                            </Popover.Item>
                        )}
                        {!!dataUnion && (
                            <Popover.Item
                                onClick={async () => {
                                    publish(product.id)
                                }}
                                disabled={loading}
                            >
                                {product.state === productStates.DEPLOYED ? 'Unpublish' : 'Publish'}
                            </Popover.Item>
                        )}
                    </Popover>
                </Buttons>
            </Header>
            <LoadingIndicator loading={loading} />
            <Stats>
                <Stat>
                    <Key>Join requests</Key>
                    <Value>{joinRequests.length}</Value>
                </Stat>
                <Stat>
                    <Key>Members</Key>
                    <Value>{get(stats, 'memberCount.total', '0')}</Value>
                </Stat>
                <Stat>
                    <Key>Revenue</Key>
                    <Value>{revenue.toFixed(2)}</Value>
                </Stat>
                <Stat>
                    <Key>Admin fees</Key>
                    <Value>{adminFees.toFixed(2)}</Value>
                </Stat>
                <Stat>
                    <Key>Avg user revenue / wk</Key>
                    <Value>{avgUserRevenue.toFixed(2)}</Value>
                </Stat>
                <Stat>
                    <Key>Subscribers</Key>
                    <Value>{subscriberCount}</Value>
                </Stat>
            </Stats>
            {isOpen && (
                <StyledManagement
                    product={product}
                    dataUnion={dataUnion}
                    joinRequests={joinRequests}
                />
            )}
        </Container>
    )
}

const WrappedItem = (props: Props) => (
    <DataUnionMembersProvider>
        <Item {...props} />
    </DataUnionMembersProvider>
)

export default WrappedItem
