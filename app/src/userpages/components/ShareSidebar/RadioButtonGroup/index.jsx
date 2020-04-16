// @flow

import React, { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import cx from 'classnames'
import { type Ref } from '$shared/flowtype/common-types'
import startCase from 'lodash/startCase'

import styles from './RadioButtonGroup.pcss'

type Props = {
    name: string,
    options: Array<string>,
    selectedOption?: string,
    className?: string,
    onChange?: (string) => void,
    disabled?: boolean,
}

const RadioButtonGroup = ({
    name,
    options,
    selectedOption,
    className,
    onChange,
    disabled = false,
}: Props) => {
    const [selection, setSelection] = useState(selectedOption)
    const [transitionEnabled, setTransitionEnabled] = useState(false)

    // Reflect outside changes of 'selectedOption' into the state
    useEffect(() => {
        setSelection(selectedOption)
    }, [selectedOption, setSelection])

    const onCheck = useCallback((option: string) => {
        if (disabled || selection === option) {
            return
        }
        setTransitionEnabled(true) // only enable transitions once user clicks
        setSelection(option)

        if (onChange) {
            onChange(option)
        }
    }, [disabled, selection, onChange])

    const buttonGridRef: Ref<HTMLDivElement> = useRef(null)
    const [dimensions, setDimensions] = useState({})
    useLayoutEffect(() => {
        // capture size and offset of selected button for use as slider
        if (!buttonGridRef.current) { return }
        const el = buttonGridRef.current.querySelector('[data-selected=true]')
        if (!el) { return }
        const dimensions = el.getBoundingClientRect()
        setDimensions({
            width: dimensions.width,
            height: dimensions.height,
            top: el.offsetTop,
            left: el.offsetLeft,
        })
    }, [selection])

    return (
        <div className={cx(styles.root, className)}>
            <div className={styles.inner}>
                <div
                    className={styles.slider}
                    style={Object.assign({
                        // have to set these or flow whines
                        width: undefined,
                        height: undefined,
                        transform: undefined,
                        transition: transitionEnabled ? 'all 250ms ease-in' : '',
                    }, Object.keys(dimensions).length ? {
                        width: dimensions.width,
                        height: dimensions.height,
                        transform: `translate3D(${dimensions.left}px, ${dimensions.top}px, 0px)`,
                    } : {})}
                />
                <div className={styles.buttonGrid} ref={buttonGridRef}>
                    {options.map((option, index) => (
                        <div key={option} data-selected={selection === option}>
                            <input
                                id={`${name}-${index}`}
                                type="radio"
                                name={name}
                                value={option}
                                className={styles.radio}
                                onChange={() => onCheck(option)}
                                checked={selection === option}
                                disabled={disabled}
                            />
                            <label
                                htmlFor={`${name}-${index}`}
                                className={styles.label}
                            >
                                {startCase(option)}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default RadioButtonGroup