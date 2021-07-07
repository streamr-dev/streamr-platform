// @flow

import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import styles from '@sambego/storybook-styles'

import KeyField from '.'

const stories =
    storiesOf('Userpages/KeyField', module)
        .addDecorator(styles({
            color: '#323232',
            padding: '3rem 0rem',
            background: 'white',
            border: '1px dashed #DDDDDD',
            margin: '3rem',
        }))
        .addDecorator(withKnobs)

stories.add('default', () => (
    <KeyField
        keyName="Key name"
        value={text('Value', 'Key value')}
    />
))

stories.add('value hidden', () => (
    <KeyField
        keyName="Key name"
        value={text('Value', 'Key value')}
        hideValue
        onSave={action('onSave')}
    />
))

stories.add('editable', () => {
    const saveAction = action('onSave')
    const onSave = (...args) => new Promise((resolve) => {
        saveAction(...args)
        setTimeout(resolve, 500)
    })

    return (
        <KeyField
            keyName="Key name"
            value={text('Value', 'Key value')}
            allowEdit
            onSave={onSave}
        />
    )
})

stories.add('active', () => (
    <KeyField
        keyName="Key name"
        value={text('Value', 'Key value')}
        active
    />
))
