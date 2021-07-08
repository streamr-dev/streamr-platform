// @flow

import { createSelector } from 'reselect'
import { denormalize } from 'normalizr'

import type { EntitiesState } from '$shared/flowtype/store-state'
import type { StreamList, StreamIdList } from '$shared/flowtype/stream-types'
import type { ErrorInUi } from '$shared/flowtype/common-types'

import { selectEntities } from '$shared/modules/entities/selectors'
import { streamsSchema } from '$shared/modules/entities/schema'
import type { StreamsState, StoreState } from '../../flowtype/store-state'

const selectStreamsState = (state: StoreState): StreamsState => state.streams

export const selectStreamIds: (StoreState) => StreamIdList = createSelector(
    selectStreamsState,
    (subState: StreamsState): StreamIdList => subState.ids,
)

export const selectStreams: (StoreState) => StreamList = createSelector(
    selectStreamIds,
    selectEntities,
    (result: StreamIdList, entities: EntitiesState): StreamList => denormalize(result, streamsSchema, entities),
)

export const selectFetchingStreams: (StoreState) => boolean = createSelector(
    selectStreamsState,
    (subState: StreamsState): boolean => subState.fetching,
)

export const selectStreamsError: (StoreState) => ?ErrorInUi = createSelector(
    selectStreamsState,
    (subState: StreamsState): ?ErrorInUi => subState.error,
)
