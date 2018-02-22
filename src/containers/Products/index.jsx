// @flow
import { connect } from 'react-redux'

import Products from '../../components/Products'
import type { StateProps, DispatchProps } from '../../components/Products'
import type { StoreState } from '../../flowtype/states/store'

import { getProducts } from './actions'
import { selectAllProducts, selectError } from './selectors'


const mapStateToProps = (state: StoreState): StateProps => ({
    products: selectAllProducts(state),
    error: selectError(state)
})

const mapDispatchToProps = (dispatch: Function): DispatchProps => ({
    getProducts: () => dispatch(getProducts())
})

export default connect(mapStateToProps, mapDispatchToProps)(Products)
