// @flow

import React, { forwardRef } from 'react'
import { compose } from 'redux'
import FlushHistoryDecorator, { type Props as FlushHistoryProps } from './FlushHistoryDecorator'
import OnCommitDecorator, { type Props as OnCommitProps } from './OnCommitDecorator'
import RevertOnEscapeDecorator, { type Props as RevertOnEscapeProps } from './RevertOnEscapeDecorator'
import SelectAllOnFocusDecorator, { type Props as SelectAllOnFocusProps } from './SelectAllOnFocusDecorator'

type Props =
    & FlushHistoryProps
    & OnCommitProps
    & RevertOnEscapeProps
    & SelectAllOnFocusProps
    & {
        tag: 'input' | 'textarea',
    }

const Input = ({ tag: Tag = 'input', ...props }: Props, ref: any) => (
    <Tag {...props} ref={ref} />
)

export default compose(
    FlushHistoryDecorator,
    OnCommitDecorator,
    SelectAllOnFocusDecorator,
    RevertOnEscapeDecorator,
)(forwardRef(Input))
