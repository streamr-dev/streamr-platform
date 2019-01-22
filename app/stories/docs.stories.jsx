/* eslint-disable react/no-multi-comp */
import React from 'react'

import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import StoryRouter from 'storybook-react-router'
import styles from '@sambego/storybook-styles'
import links from '$shared/../links'

import SideNav from '$docs/DocsLayout/SideNav'

const story = (name) => storiesOf(`Docs/${name}`, module)
    .addDecorator(styles({
        color: '#323232',
        padding: '15px',
    }))
    .addDecorator(withKnobs)

story('SideNav')
    .addDecorator(StoryRouter())
    .addWithJSX('basic', () => {
        const subNavigationItems = {
            'streamr-tech-stack': 'Streamr Tech Stack',
            'realtime-engine': 'Realtime Engine',
        }

        const navigationItems = {
            Introduction: links.docs.introduction,
            'Getting Started': links.docs.home,
            Tutorials: links.docs.tutorials,
            'Visual Editor': links.docs.visualEditor,
            'Streamr Engine': links.docs.streamrEngine,
            Marketplace: links.docs.dataMarketplace,
            'Streamr APIs': links.docs.api,
        }

        return (<SideNav navigationItems={navigationItems} subNavigationItems={subNavigationItems} />)
    })

