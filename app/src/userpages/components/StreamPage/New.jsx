import React, { useCallback, useState, useMemo, useRef, useEffect, useReducer } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import { useTransition, animated } from 'react-spring'
import { Link, useHistory } from 'react-router-dom'

import { MEDIUM } from '$shared/utils/styled'
import TOCPage, { Title } from '$shared/components/TOCPage'
import TOCSection from '$shared/components/TOCPage/TOCSection'
import BackButton from '$shared/components/BackButton'
import Toolbar from '$shared/components/Toolbar'
import { scrollTop } from '$shared/hooks/useScrollToTop'
import Notification from '$shared/utils/Notification'
import { NotificationIcon } from '$shared/utils/constants'
import StatusLabel from '$shared/components/StatusLabel'
import Nav from '$shared/components/Layout/Nav'
import useIsMounted from '$shared/hooks/useIsMounted'
import { createStream } from '$userpages/modules/userPageStreams/actions'
import { selectUserData } from '$shared/modules/user/selectors'
import Layout from '$shared/components/Layout/Core'
import StatusIcon from '$shared/components/StatusIcon'
import Activity, { actionTypes, resourceTypes } from '$shared/utils/Activity'
import Select from '$ui/Select'
import Errors, { MarketplaceTheme } from '$ui/Errors'
import useModal from '$shared/hooks/useModal'
import ConfirmDialog from '$shared/components/ConfirmDialog'
import SvgIcon from '$shared/components/SvgIcon'
import usePreventNavigatingAway from '$shared/hooks/usePreventNavigatingAway'
import { getEnsDomains } from '$shared/modules/integrationKey/services'
import Spinner from '$shared/components/Spinner'
import Button from '$shared/components/Button'
import { truncate } from '$shared/utils/text'
import { isEthereumAddress } from '$mp/utils/validate'
import CodeSnippets from '$shared/components/CodeSnippets'
import routes from '$routes'
import PartitionsView from './Edit/PartitionsView'
import HistoryView from './Edit/HistoryView'
import ConfigureView from './Edit/ConfigureView'
import { StatusView } from './Edit/StatusView'
import SecurityView from './Edit/SecurityView'
import Preview from './Edit/PreviewView'
import {
    StreamIdFormGroup,
    FormGroup,
    Field,
    Text,
} from './shared/FormGroup'
import docsLinks from '$shared/../docsLinks'

const Description = styled.p`
    margin-bottom: 3rem;
`

const PathnameWrapper = styled.div`
    position: relative;
`

const Tooltip = styled.div`
    position: absolute;
    visibility: hidden;
    background: #323232;
    width: 250px;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    color: white;
    line-height: 1rem;
    top: 28px;
    right: 6px;
    z-index: 1;

    strong {
        font-family: var(--mono);
        font-weight: var(--medium);
        font-size: 0.9em;
    }

    a {
        color: var(--white);
        text-decoration: none;
    }
`

const QuestionIcon = styled.div`
    position: absolute;
    color: #CDCDCD;
    line-height: 0;
    top: -30px;
    right: -6px;
    width: 32px;
    height: 32px;

    svg {
        position: absolute;
        width: 16px;
        height: 16px;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }

    &:hover {
        color: #323232;

        ${Tooltip} {
            visibility: visible;
        }
    }
`

const DisabledDomain = styled.div`
    background-color: #efefef;
    color: #525252;
    border: 1px solid #EFEFEF;
    border-radius: 4px;
    font-size: 0.875rem;
    height: 40px;
    padding: 0 1rem;
    width: 100%;
    display: flex;
    align-items: center;

    > span {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
`

const StreamIdText = styled(Text)`
    padding: 0 3rem 0 1rem;
    text-overflow: ellipsis;
`

const ClearButton = styled.button`
    width: 40px;
    height: 40px;
    color: #989898;
    position: absolute;
    top: 0;
    line-height: 16px;
    right: 0;
    border: 0;
    background: none;
    outline: none;
    appearance: none;

    :focus {
        outline: none;
    }

    svg {
        width: 16px;
        height: 16px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    :hover {
        circle {
            fill: #525252;
            stroke: #525252;
        }
    }
`

// this default data is only used for display purposes
const defaultStreamData = {
    id: 'newStream',
    config: {
        fields: [],
    },
    storageDays: 365,
    inactivityThresholdHours: 48,
    partitions: 1,
}

export const ADD_DOMAIN_URL = 'https://ens.domains'
const ADD_ENS_DOMAIN = '::ens/add_domain'

export const PathnameTooltip = () => (
    <QuestionIcon>
        <SvgIcon name="outlineQuestionMark" />
        <Tooltip>
            Stream paths can be single or multi-level.
            <br />
            Single <strong>streamr.eth/coffeemachine</strong>
            <br />
            Multi <strong>oxd93...52874/oracles/price</strong>
            <br />
            For more information, see the <Link to={docsLinks.streams}>docs</Link>.
        </Tooltip>
    </QuestionIcon>
)

const getValidId = ({ domain, pathname }) => {
    const id = `${domain}/${pathname}`

    if (pathname.indexOf('/') === 0) {
        throw new Error('Path name cannot start with a slash')
    }

    if (/\/\/+/.test(pathname)) {
        throw new Error('Use a single slash to separate paths.')
    }

    if (!(/\w$/.test(id))) {
        throw new Error('Path name must end with an alpha-numeric character.')
    }

    if (/[^\w.\-/]/.test(id)) {
        throw new Error('Path may only contain alpha-numeric characters, underscores, and dashes.')
    }

    return id
}

const ConfirmExitModal = () => {
    const { api, isOpen } = useModal('confirmExit')

    if (!isOpen) {
        return null
    }

    return (
        <ConfirmDialog
            title="You have unsaved changes"
            message="You have made changes to this stream. Do you still want to exit?"
            onAccept={() => api.close({ canProceed: true })}
            onReject={() => api.close({ canProceed: false })}
        />
    )
}

const UnstyledNew = ({ currentUser, ...props }) => {
    const [{ domain, pathname, description }, updateStream] = useReducer((state, changeSet) => ({
        ...state,
        ...changeSet,
    }), {
        pathname: '',
        description: '',
        domain: undefined,
    })

    const [loading, setLoading] = useState(false)
    const [createAttempted, setCreateAttempted] = useState(false)
    const [finished, setFinished] = useState(false)
    const [validationError, setValidationError] = useState(undefined)
    const streamDataRef = useRef()
    const contentChangedRef = useRef(false)
    const dispatch = useDispatch()
    const history = useHistory()
    const { api: confirmExitDialog } = useModal('confirmExit')
    const [domains, setDomains] = useState([])
    const [loadingDomains, setLoadingDomains] = useState(true)
    const isMounted = useIsMounted()
    const currentUserRef = useRef(undefined)
    currentUserRef.current = currentUser

    const loadDomains = useCallback(async () => {
        const { username } = currentUserRef.current || {}
        const addresses = (!!username && isEthereumAddress(username)) ? [username] : []

        try {
            const { data } = await getEnsDomains({
                addresses,
            })

            if (isMounted() && data && data.domains && Array.isArray(data.domains)) {
                setDomains(data.domains)
            }
        } catch (e) {
            console.warn(e)
        } finally {
            if (isMounted()) {
                setLoadingDomains(false)
            }
        }
    }, [isMounted])

    useEffect(() => {
        loadDomains()
    }, [loadDomains])

    const [groupedOptions, domainOptions] = useMemo(() => {
        const { username } = currentUserRef.current || {}
        const ethAccountOptions = (!!username && isEthereumAddress(username)) ? [{
            label: truncate(username),
            value: username,
        }] : []

        const ensOptions = [
            ...domains.map(({ name }) => ({
                value: name,
                label: name,
            })),
            {
                value: ADD_ENS_DOMAIN,
                label: 'Add new domain',
            },
        ]

        const groupedOptions = [{
            label: 'ENS Domains',
            options: ensOptions,
        },
        {
            label: 'Eth Account',
            options: ethAccountOptions,
        }]

        const domainOptions = groupedOptions.flatMap((group) => group.options)

        return [groupedOptions, domainOptions]
    }, [domains])

    // update default domain if undefined
    useEffect(() => {
        if (domain) { return }

        if (isEthereumAddress(currentUser.username)) {
            updateStream({ domain: currentUser.username })
        }
    }, [domain, currentUser, domainOptions, updateStream])

    const confirmIsSaved = useCallback(async () => {
        const { pathname, description } = streamDataRef.current || {}

        if (!pathname && !description) {
            return true
        }

        const { canProceed } = await confirmExitDialog.open()

        if (!isMounted()) { return false }

        return !!canProceed
    }, [confirmExitDialog, isMounted])

    const onBack = useCallback(async () => {
        const canProceed = await confirmIsSaved()

        if (isMounted() && canProceed) {
            scrollTop()

            history.push(routes.streams.index())
        }
    }, [confirmIsSaved, history, isMounted])

    const onDomainChange = useCallback(({ value: domain }) => {
        if (domain === ADD_ENS_DOMAIN) {
            window.open(ADD_DOMAIN_URL, '_blank', 'noopener noreferrer')
        } else {
            updateStream({ domain })
        }
    }, [updateStream])

    const onPathnameChange = useCallback((e) => {
        const pathname = e.target.value

        updateStream({ pathname })
    }, [updateStream])

    const onDescriptionChange = useCallback((e) => {
        const description = e.target.value

        updateStream({ description })
    }, [updateStream])

    const onClearPathname = useCallback(() => {
        updateStream({ pathname: '' })
    }, [updateStream])

    useEffect(() => {
        setValidationError(() => {
            try {
                if (pathname) {
                    getValidId({
                        domain,
                        pathname,
                    })
                }

                return undefined
            } catch (e) {
                return e.message
            }
        })
    }, [domain, pathname])

    const onSave = useCallback(async () => {
        if (!streamDataRef.current) { return }

        setLoading(true)
        setCreateAttempted(true)

        try {
            const { domain, pathname, description } = streamDataRef.current

            const streamId = await dispatch(createStream({
                id: getValidId({
                    domain,
                    pathname,
                }),
                description,
            }))

            if (!isMounted()) { return }

            setFinished(true)

            Notification.push({
                title: 'Stream created successfully',
                icon: NotificationIcon.CHECKMARK,
            })
            Activity.push({
                action: actionTypes.CREATE,
                resourceId: streamId,
                resourceType: resourceTypes.STREAM,
            })

            // give time for fadeout animation to happen
            setTimeout(() => {
                if (isMounted()) {
                    history.push(routes.streams.show({
                        id: streamId,
                        newStream: 1,
                    }))
                }
            }, 300)
        } catch (e) {
            console.warn(e)

            if (!isMounted()) { return }

            // set validation error if another stream with the same id exists
            if (e.code === 'DUPLICATE_NOT_ALLOWED') {
                setValidationError('That path already exists, please try a different one')
            }

            Notification.push({
                title: e.message,
                icon: NotificationIcon.ERROR,
            })
        } finally {
            if (isMounted()) {
                setLoading(false)
            }
        }
    }, [dispatch, isMounted, history])

    useEffect(() => {
        streamDataRef.current = {
            domain,
            pathname,
            description,
        }
        contentChangedRef.current = !!(pathname || description)
    }, [domain, pathname, description])

    usePreventNavigatingAway(
        'You have unsaved changes. Are you sure you want to leave?',
        () => contentChangedRef.current,
    )

    const newStreamSnippet = useMemo(() => `
        // Create your stream above in order to get your code snippet.
    `, [])

    const saveEnabled = !!pathname && !!domain && !loading
    const isDisabled = !!loading
    const isDomainDisabled = isDisabled || domainOptions.length <= 1 || loadingDomains

    const transitions = useTransition(!finished, null, {
        config: {
            tension: 500,
            friction: 50,
            clamp: true,
            duration: 300,
        },
        from: {
            opacity: 1,
        },
        enter: {
            opacity: 1,
        },
        leave: {
            opacity: 0,
        },
    })

    return (
        <Layout
            {...props}
            nav={(
                <Nav noWide />
            )}
            loading={loading}
            navComponent={(
                <Toolbar
                    altMobileLayout
                    left={(
                        <BackButton onBack={onBack} />
                    )}
                    actions={{
                        cancel: {
                            kind: 'link',
                            title: 'Cancel',
                            outline: true,
                            onClick: () => onBack(),
                        },
                        saveChanges: {
                            title: 'Save & Exit',
                            kind: 'primary',
                            disabled: true,
                        },
                    }}
                />
            )}
        >
            {transitions.map(({ item, key, props: style }) => (
                item && (
                    <animated.div
                        key={key}
                        style={style}
                    >
                        <TOCPage title="Name your Stream">
                            <TOCSection
                                id="details"
                                title="Details"
                            >
                                <Description>
                                    <span>
                                        All streams require a unique path in the format <strong>domain/pathname</strong>.
                                        {' '}
                                        Your default domain will be an Ethereum address, but you can also use an existing ENS domain or
                                        {' '}
                                        <a href={ADD_DOMAIN_URL} target="_blank" rel="nofollow noopener noreferrer">
                                            register a new one
                                        </a>.
                                        {' '}
                                        Choose your stream name &amp; create it in order to adjust stream settings.
                                    </span>
                                </Description>
                                <StreamIdFormGroup hasDomain data-test-hook="StreamId">
                                    <Field
                                        label="Domain"
                                    >
                                        {!!isDomainDisabled && (
                                            <DisabledDomain>
                                                {!loadingDomains && (
                                                    <span>{domain || ''}</span>
                                                )}
                                                {!!loadingDomains && (
                                                    <React.Fragment>
                                                        <span>Loading domains</span>
                                                        <Spinner size="small" color="blue" />
                                                    </React.Fragment>
                                                )}
                                            </DisabledDomain>
                                        )}
                                        {!isDomainDisabled && (
                                            <Select
                                                options={groupedOptions}
                                                value={domainOptions.find(({ value }) => value === domain)}
                                                onChange={onDomainChange}
                                                disabled={isDisabled}
                                                name="domain"
                                            />
                                        )}
                                    </Field>
                                    <Field narrow>
                                        /
                                    </Field>
                                    <Field
                                        label="Path name"
                                    >
                                        <PathnameWrapper>
                                            <PathnameTooltip />
                                            <StreamIdText
                                                value={pathname || ''}
                                                onChange={onPathnameChange}
                                                disabled={isDisabled}
                                                placeholder="Enter a unique stream path name"
                                                name="pathname"
                                                invalid={!!createAttempted && !!validationError}
                                            />
                                            {(pathname || '').length > 0 && (
                                                <ClearButton type="button" onClick={() => onClearPathname()}>
                                                    <SvgIcon name="clear" />
                                                </ClearButton>
                                            )}
                                        </PathnameWrapper>
                                        {!!createAttempted && !!validationError && (
                                            <Errors overlap theme={MarketplaceTheme}>
                                                {validationError}
                                            </Errors>
                                        )}
                                    </Field>
                                    <Field narrow>
                                        <Button
                                            kind="secondary"
                                            onClick={() => onSave()}
                                            disabled={!saveEnabled}
                                        >
                                            Create stream
                                        </Button>
                                    </Field>
                                </StreamIdFormGroup>
                                <FormGroup>
                                    <Field label="Description">
                                        <Text
                                            value={description}
                                            onChange={onDescriptionChange}
                                            disabled={isDisabled}
                                            name="description"
                                            placeholder="Add a brief description"
                                            autoComplete="off"
                                        />
                                    </Field>
                                </FormGroup>
                            </TOCSection>
                            <TOCSection
                                id="snippets"
                                title="Code Snippets"
                                disabled
                            >
                                <CodeSnippets
                                    items={[
                                        ['javascript', 'Js', newStreamSnippet],
                                        ['java', 'Java', newStreamSnippet],
                                    ]}
                                    title="Subscribe"
                                    disabled
                                />
                                <CodeSnippets
                                    items={[
                                        ['javascript', 'Js', newStreamSnippet],
                                        ['java', 'Java', newStreamSnippet],
                                    ]}
                                    title="Publish"
                                    disabled
                                />
                            </TOCSection>
                            <TOCSection
                                id="security"
                                title="Security"
                                disabled
                            >
                                <SecurityView
                                    stream={defaultStreamData}
                                    disabled
                                />
                            </TOCSection>
                            <TOCPage.Section
                                id="configure"
                                title="Fields"
                                onlyDesktop
                                disabled
                            >
                                <ConfigureView
                                    stream={defaultStreamData}
                                    disabled
                                />
                            </TOCPage.Section>
                            <TOCPage.Section
                                id="status"
                                title="Status"
                                status={<StatusIcon
                                    tooltip
                                    status="inactive"
                                />}
                                onlyDesktop
                                disabled
                            >
                                <StatusView disabled stream={defaultStreamData} />
                            </TOCPage.Section>
                            <TOCSection
                                id="preview"
                                title="Preview"
                                disabled
                            >
                                <Preview
                                    stream={defaultStreamData}
                                    subscribe={false}
                                />
                            </TOCSection>
                            <TOCSection
                                id="historicalData"
                                title="Data storage"
                                disabled
                            >
                                <HistoryView
                                    stream={defaultStreamData}
                                    disabled
                                    showStorageOptions={false}
                                />
                            </TOCSection>
                            <TOCPage.Section
                                id="stream-partitions"
                                title="Stream partitions"
                                linkTitle="Partitions"
                                status={(<StatusLabel.Advanced />)}
                                disabled
                            >
                                <PartitionsView
                                    stream={defaultStreamData}
                                    disabled
                                />
                            </TOCPage.Section>
                        </TOCPage>
                    </animated.div>
                )
            ))}
            <ConfirmExitModal />
        </Layout>
    )
}

const New = styled(UnstyledNew)`
    p {
        line-height: 1.5em;
    }

    strong {
        font-weight: ${MEDIUM};
    }

    ${Text} + * {
        margin-left: 16px;
    }

    ${Title} {
        display: block;
    }
`

const NewStreamViewMaybe = (props) => {
    const currentUser = useSelector(selectUserData)

    if (!currentUser) {
        return (
            <Layout loading />
        )
    }

    return <New {...props} currentUser={currentUser} />
}

export default NewStreamViewMaybe
