// @flow

// TODO: Use it for $editor/canvas/components/Ports/Value/Select. — Mariusz

import React, { useState, useCallback, useEffect, useMemo, type ChildrenArray, type Element } from 'react'
import cx from 'classnames'
import styles from './autosizedSelect.pcss'

type Props = {
    className?: ?string,
    value: string,
    onChange: (string) => void,
    children: ChildrenArray<Element<'option'>>,
}

const AutosizedSelect = ({
    children,
    className,
    onChange: onChangeProp,
    value: valueProp,
    ...props
}: Props) => {
    const [value, setValue] = useState(valueProp || '')

    const onChange = useCallback((e: SyntheticInputEvent<EventTarget>) => {
        const val = e.target.value || ''
        setValue(val)
        onChangeProp(val)
    }, [onChangeProp])

    useEffect(() => {
        setValue(valueProp || '')
    }, [valueProp])

    const currentLabel = useMemo(() => {
        const currentOption = React.Children.toArray(children).find((child) => String(value) === (String(child.props.value) || ''))
        return currentOption ? currentOption.props.children : null
    }, [value, children])

    return (
        <div
            className={cx(styles.root, className)}
        >
            <select
                className={styles.control}
                value={value}
                onChange={onChange}
                {...props}
                // Force single selected value. Other cases are unsupported.
                multiple={false}
            >
                {children}
            </select>
            <select className={styles.spaceholder}>
                {!!currentLabel && (
                    <option>{currentLabel}</option>
                )}
            </select>
        </div>
    )
}

export default AutosizedSelect
