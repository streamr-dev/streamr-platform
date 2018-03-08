// @flow

import React, { Component } from 'react'
import { connect } from 'react-redux'
import type { Match } from 'react-router-dom'

import ProductPageComponent from '../../components/ProductPage'
import type { Props as ProductPageProps } from '../../components/ProductPage'
import type { StoreState } from '../../flowtype/store-state'
import type { ProductId } from '../../flowtype/product-types'
import type { ErrorInUi } from '../../flowtype/common-types'

import { getProductById } from '../../modules/product/actions'
import { selectFetchingProduct, selectProduct, selectProductError } from '../../modules/product/selectors'
import { selectStreams, selectFetchingStreams, selectStreamsError } from '../../modules/streams/selectors'

export type OwnProps = {
    match: Match,
}

export type StateProps = ProductPageProps & {
    productError: ?ErrorInUi,
    streamsError: ?ErrorInUi,
}

export type DispatchProps = {
    getProductById: (ProductId) => void,
}

type Props = OwnProps & StateProps & DispatchProps

class ProductPage extends Component<Props> {
    componentDidMount() {
        this.props.getProductById(this.props.match.params.id)
    }

    render() {
        const { product, streams, fetchingProduct, fetchingStreams } = this.props

        return !!product && (
            <ProductPageComponent product={product} streams={streams} fetchingStreams={fetchingProduct || fetchingStreams} />
        )
    }
}

const mapStateToProps = (state: StoreState): StateProps => ({
    product: selectProduct(state),
    streams: selectStreams(state),
    fetchingProduct: selectFetchingProduct(state),
    productError: selectProductError(state),
    fetchingStreams: selectFetchingStreams(state),
    streamsError: selectStreamsError(state),
})

const mapDispatchToProps = (dispatch: Function): DispatchProps => ({
    getProductById: (id: ProductId) => dispatch(getProductById(id))
})

export default connect(mapStateToProps, mapDispatchToProps)(ProductPage)
