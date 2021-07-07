// @flow

import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import styles from '@sambego/storybook-styles'

import KeyFieldEditor from '.'

const stories =
    storiesOf('Userpages/KeyFieldEditor', module)
        .addDecorator(styles({
            color: '#323232',
            padding: '3rem 0rem',
            background: 'white',
            border: '1px dashed #DDDDDD',
            margin: '3rem',
        }))
        .addDecorator(withKnobs)

stories.add('default', () => (
    <KeyFieldEditor
        keyName="key"
        value="value"
        onCancel={action('onCancel')}
        onSave={action('onSave')}
    />
))

stories.add('default (address)', () => (
    <KeyFieldEditor
        keyName="key"
        value="value"
        onCancel={action('onCancel')}
        onSave={action('onSave')}
        labelType="address"
    />
))

stories.add('default (shared secret)', () => (
    <KeyFieldEditor
        keyName="key"
        value="value"
        onCancel={action('onCancel')}
        onSave={action('onSave')}
        labelType="sharedSecret"
    />
))

stories.add('edit value', () => (
    <KeyFieldEditor
        keyName="key"
        value="value"
        onCancel={action('onCancel')}
        onSave={action('onSave')}
        showValue
    />
))

stories.add('create new', () => (
    <KeyFieldEditor
        keyName="key"
        value="value"
        onCancel={action('onCancel')}
        onSave={action('onSave')}
        createNew
    />
))

stories.add('create new with value', () => (
    <KeyFieldEditor
        keyName="key"
        value="value"
        onCancel={action('onCancel')}
        onSave={action('onSave')}
        createNew
        showValue
    />
))

stories.add('waiting', () => (
    <KeyFieldEditor
        keyName="key"
        value="value"
        waiting
        onCancel={action('onCancel')}
        onSave={action('onSave')}
    />
))

stories.add('error', () => (
    <KeyFieldEditor
        keyName="key"
        value="value"
        onCancel={action('onCancel')}
        onSave={action('onSave')}
        error="Something went wrong"
    />
))

stories.add(' create error', () => (
    <KeyFieldEditor
        keyName="key"
        value="value"
        onCancel={action('onCancel')}
        onSave={action('onSave')}
        error="Something went wrong"
        createNew
    />
))
