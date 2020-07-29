// @flow

import React, { Fragment, useEffect, useMemo, useCallback, useState, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link as RouterLink } from 'react-router-dom'
import { push } from 'connected-react-router'
import { Translate, I18n } from 'react-redux-i18n'
import { Helmet } from 'react-helmet'
import styled from 'styled-components'

import type { Canvas, CanvasId } from '$userpages/flowtype/canvas-types'

import Layout from '$userpages/components/Layout'
import { getCanvases, deleteCanvas } from '$userpages/modules/canvas/actions'
import { selectCanvases, selectFetching } from '$userpages/modules/canvas/selectors'
import { getFilters } from '$userpages/utils/constants'
import Popover from '$shared/components/Popover'
import Search from '../../Header/Search'
import confirmDialog from '$shared/utils/confirm'
import NoCanvasesView from './NoCanvases'
import DocsShortcuts from '$userpages/components/DocsShortcuts'
import { getResourcePermissions } from '$userpages/modules/permission/actions'
import { selectFetchingPermissions, selectCanvasPermissions } from '$userpages/modules/permission/selectors'
import Notification from '$shared/utils/Notification'
import { NotificationIcon } from '$shared/utils/constants'
import ListContainer from '$shared/components/Container/List'
import Button from '$shared/components/Button'
import useFilterSort from '$userpages/hooks/useFilterSort'
import useCopy from '$shared/hooks/useCopy'
import { CanvasTile } from '$shared/components/Tile'
import Grid from '$shared/components/Tile/Grid'
import Sidebar from '$shared/components/Sidebar'
import SidebarProvider, { SidebarContext } from '$shared/components/Sidebar/SidebarProvider'
import ShareSidebar from '$userpages/components/ShareSidebar'
import routes from '$routes'
import resourceUrl from '$shared/utils/resourceUrl'
import { MD, LG } from '$shared/utils/styled'

const DesktopOnlyButton = styled(Button)`
     && {
         display: none;
     }

     @media (min-width: ${LG}px) {
         && {
             display: inline-flex;
         }
     }
`

const StyledListContainer = styled(ListContainer)`
    && {
        margin-top: 16px;
    }

    @media (min-width: ${MD}px) {
        && {
            margin-top: 34px;
        }
    }

    @media (min-width: ${LG}px) {
        && {
            margin-top: 0;
        }
    }
`

function CanvasPageSidebar({ canvas }) {
    const sidebar = useContext(SidebarContext)
    return (
        <Sidebar
            isOpen={sidebar.isOpen()}
            onClose={() => sidebar.close()}
        >
            {sidebar.isOpen('share') && (
                <ShareSidebar
                    onClose={() => sidebar.close('share')}
                    resourceTitle={canvas && canvas.name}
                    resourceType="CANVAS"
                    resourceId={canvas && canvas.id}
                />
            )}
        </Sidebar>
    )
}

const CreateCanvasButton = () => (
    <DesktopOnlyButton
        tag={RouterLink}
        to={routes.canvases.edit({
            id: null,
        })}
    >
        <Translate value="userpages.canvases.createCanvas" />
    </DesktopOnlyButton>
)

const CanvasList = () => {
    const sortOptions = useMemo(() => {
        const filters = getFilters('canvas')
        return [
            filters.RECENT_DESC,
            filters.RUNNING,
            filters.STOPPED,
            filters.NAME_ASC,
            filters.NAME_DESC,
        ]
    }, [])
    const {
        defaultFilter,
        filter,
        setSearch,
        setSort,
        resetFilter,
    } = useFilterSort(sortOptions)

    const dispatch = useDispatch()
    const { copy } = useCopy()
    const canvases = useSelector(selectCanvases)
    const fetching = useSelector(selectFetching)
    const fetchingPermissions = useSelector(selectFetchingPermissions)
    const permissions = useSelector(selectCanvasPermissions)

    const sidebar = useContext(SidebarContext)

    useEffect(() => {
        dispatch(getCanvases(filter))
    }, [dispatch, filter])

    const deleteCanvasAndNotify = useCallback(async (id: CanvasId) => {
        try {
            await dispatch(deleteCanvas(id))

            Notification.push({
                title: I18n.t('userpages.canvases.deletedCanvas'),
                icon: NotificationIcon.CHECKMARK,
            })
        } catch (e) {
            Notification.push({
                title: e.message,
                icon: NotificationIcon.ERROR,
            })
        }
    }, [dispatch])

    const confirmDeleteCanvas = useCallback(async (id: CanvasId) => {
        const confirmed = await confirmDialog('canvas', {
            title: I18n.t('userpages.canvases.delete.confirmTitle'),
            message: I18n.t('userpages.canvases.delete.confirmMessage'),
            acceptButton: {
                title: I18n.t('userpages.canvases.delete.confirmButton'),
                kind: 'destructive',
            },
            centerButtons: true,
            dontShowAgain: false,
        })

        if (confirmed) {
            deleteCanvasAndNotify(id)
        }
    }, [deleteCanvasAndNotify])

    const [shareDialogCanvas, setShareDialogCanvas] = useState(undefined)
    const onOpenShareDialog = useCallback((canvas: Canvas) => {
        setShareDialogCanvas(canvas)
        sidebar.open('share')
    }, [sidebar])

    const onCopyUrl = useCallback((id: CanvasId) => {
        copy(resourceUrl('CANVAS', id))

        Notification.push({
            title: I18n.t('userpages.canvases.menu.copyUrlNotification'),
            icon: NotificationIcon.CHECKMARK,
        })
    }, [copy])

    const onToggleCanvasDropdown = useCallback((id: string) => async (open: boolean) => {
        if (open && !fetchingPermissions && !permissions[id]) {
            try {
                await dispatch(getResourcePermissions('CANVAS', id))
            } catch (e) {
                // Noop.
            }
        }
    }, [dispatch, fetchingPermissions, permissions])

    const canBeSharedByCurrentUser = useCallback((id: string): boolean => (
        !fetchingPermissions &&
        permissions[id] &&
        permissions[id].includes('canvas_share')
    ), [fetchingPermissions, permissions])

    const canBeDeletedByCurrentUser = useCallback((id: string): boolean => (
        !fetchingPermissions &&
        permissions[id] &&
        permissions[id].includes('canvas_delete')
    ), [fetchingPermissions, permissions])

    const navigate = useCallback((to) => dispatch(push(to)), [dispatch])

    const getActions = useCallback((canvas) => (
        <Fragment>
            <Popover.Item
                onClick={() => navigate(routes.canvases.edit({
                    id: canvas.id,
                }))}
            >
                <Translate value="userpages.canvases.menu.edit" />
            </Popover.Item>
            <Popover.Item
                disabled={!canBeSharedByCurrentUser(canvas.id)}
                onClick={() => onOpenShareDialog(canvas)}
            >
                <Translate value="userpages.canvases.menu.share" />
            </Popover.Item>
            <Popover.Item
                onClick={() => onCopyUrl(canvas.id)}
            >
                <Translate value="userpages.canvases.menu.copyUrl" />
            </Popover.Item>
            <Popover.Item
                disabled={!canBeDeletedByCurrentUser(canvas.id)}
                onClick={() => confirmDeleteCanvas(canvas.id)}
            >
                <Translate value="userpages.canvases.menu.delete" />
            </Popover.Item>
        </Fragment>
    ), [navigate, canBeSharedByCurrentUser, canBeDeletedByCurrentUser, onOpenShareDialog, onCopyUrl, confirmDeleteCanvas])

    return (
        <Layout
            headerAdditionalComponent={<CreateCanvasButton />}
            headerSearchComponent={
                <Search
                    placeholder={I18n.t('userpages.canvases.filterCanvases')}
                    value={(filter && filter.search) || ''}
                    onChange={setSearch}
                />
            }
            headerFilterComponent={
                <Popover
                    title={I18n.t('userpages.filter.sortBy')}
                    type="uppercase"
                    activeTitle
                    menuProps={{
                        right: true,
                    }}
                    onChange={setSort}
                    selectedItem={(filter && filter.id) || (defaultFilter && defaultFilter.id)}
                >
                    {sortOptions.map((s) => (
                        <Popover.Item key={s.filter.id} value={s.filter.id}>
                            {s.displayName}
                        </Popover.Item>
                    ))}
                </Popover>
            }
            loading={fetching}
        >
            <StyledListContainer>
                <Helmet title={`Streamr Core | ${I18n.t('userpages.canvases.title')}`} />
                {!fetching && canvases && !canvases.length && (
                    <NoCanvasesView
                        hasFilter={!!filter && (!!filter.search || !!filter.key)}
                        filter={filter}
                        onResetFilter={resetFilter}
                    />
                )}
                {canvases.length > 0 && (
                    <Grid>
                        {canvases.map((canvas) => (
                            <CanvasTile
                                actions={getActions(canvas)}
                                canvas={canvas}
                                key={canvas.id}
                                onMenuToggle={onToggleCanvasDropdown(canvas.id)}
                            />
                        ))}
                    </Grid>
                )}
            </StyledListContainer>
            <CanvasPageSidebar canvas={shareDialogCanvas} />
            <DocsShortcuts />
        </Layout>
    )
}

export default (props: any) => (
    <SidebarProvider>
        <CanvasList {...props} />
    </SidebarProvider>
)
