// @flow

import React from 'react'
import { Route as RouterRoute, Redirect } from 'react-router-dom'

import { userIsAuthenticated } from '$auth/utils/userAuthenticated'
import withErrorBoundary from '$shared/utils/withErrorBoundary'

import ErrorPage from '$shared/components/ErrorPage'

// Userpages
import StreamPage from '$userpages/components/StreamPage'
import StreamInspectorPage from '$userpages/components/StreamPage/Inspector'
import NewStreamPage from '$userpages/components/StreamPage/New'
import StreamListView from '$userpages/components/StreamPage/List'
import TransactionList from '$userpages/components/TransactionPage/List'
import ProfilePage from '$userpages/components/ProfilePage'
import PurchasesPage from '$userpages/components/PurchasesPage'
import ProductsPage from '$userpages/components/ProductsPage'
import DataUnionPage from '$userpages/components/DataUnionPage'
import EditProductPage from '$mp/containers/EditProductPage'
import routes from '$routes'

const Route = withErrorBoundary(ErrorPage)(RouterRoute)

// Userpages Auth
const ProfilePageAuth = userIsAuthenticated(ProfilePage)
const StreamListViewAuth = userIsAuthenticated(StreamListView)
const TransactionListAuth = userIsAuthenticated(TransactionList)
const PurchasesPageAuth = userIsAuthenticated(PurchasesPage)
const ProductsPageAuth = userIsAuthenticated(ProductsPage)
const DataUnionPageAuth = userIsAuthenticated(DataUnionPage)
const EditProductAuth = userIsAuthenticated(EditProductPage)
const NewStreamPageAuth = userIsAuthenticated(NewStreamPage)

const UserpagesRouter = () => ([
    <Route exact path={routes.profile()} component={ProfilePageAuth} key="ProfilePage" />,
    <Route exact path={routes.streams.new()} component={NewStreamPageAuth} key="newStreamPage" />,
    <Route exact path={routes.streams.show()} component={StreamPage} key="streamPage" />,
    <Route exact path={routes.streams.public.show()} component={StreamPage} key="publicStreamPage" />,
    <Route exact path={routes.streams.public.preview()} component={StreamInspectorPage} key="publicStreamPreviewPage" />,
    <Route exact path={routes.streams.index()} component={StreamListViewAuth} key="StreamListView" />,
    <Route exact path={routes.transactions()} component={TransactionListAuth} key="TransactionList" />,
    <Route exact path={routes.subscriptions()} component={PurchasesPageAuth} key="PurchasesPage" />,
    <Route exact path={routes.products.index()} component={ProductsPageAuth} key="ProductsPage" />,
    <Route exact path={routes.dataunions.index()} component={DataUnionPageAuth} key="DataUnionPage" />,
    <Route exact path={routes.products.edit()} component={EditProductAuth} key="EditProduct" />,
    <Redirect from={routes.core()} to={routes.streams.index()} component={StreamListViewAuth} key="StreamListViewRedirect" />,
])

export default UserpagesRouter
