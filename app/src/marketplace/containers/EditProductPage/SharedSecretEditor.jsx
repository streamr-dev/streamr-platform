// @flow

import React, { useCallback } from 'react'
import styled from 'styled-components'

import UnstyledKeyField from '$shared/components/KeyField'
import AddKeyField from '$shared/components/KeyField/AddKeyField'
import useDataUnionSecrets from '$mp/modules/dataUnion/hooks/useDataUnionSecrets'
import type { Secret } from '$mp/modules/dataUnion/types'
import { usePending } from '$shared/hooks/usePending'
import useProduct from '../ProductController/useProduct'

const KeyField = styled(UnstyledKeyField)``
const AddKeyFieldWrapper = styled.div``

type Props = {
    disabled?: boolean,
}

const UnstyledSharedSecretEditor = ({ disabled, ...props }: Props) => {
    const product = useProduct()
    const { secrets, edit, add, remove } = useDataUnionSecrets()
    const dataUnionId = (product && product.beneficiaryAddress) || ''
    const { isPending: isAddPending, wrap: wrapAddSecret } = usePending('product.ADD_SECRET')
    const { isPending: isEditPending, wrap: wrapEditSecret } = usePending('product.EDIT_SECRET')
    const { isPending: isRemovePending, wrap: wrapRemoveSecret } = usePending('product.REMOVE_SECRET')

    const addSecret = useCallback(async (name) => (
        wrapAddSecret(async () => {
            await add({
                dataUnionId,
                name,
            })
        })
    ), [wrapAddSecret, dataUnionId, add])

    const editSecret = useCallback(async (id, name) => (
        wrapEditSecret(async () => {
            await edit({
                dataUnionId,
                id,
                name,
            })
        })
    ), [wrapEditSecret, dataUnionId, edit])

    const removeSecret = useCallback(async (id) => (
        wrapRemoveSecret(async () => {
            await remove({
                dataUnionId,
                id,
            })
        })
    ), [wrapRemoveSecret, dataUnionId, remove])

    const isDisabled = !!(disabled || isAddPending || isEditPending || isRemovePending)

    return (
        <div {...props}>
            {secrets.map((s: Secret) => (
                <KeyField
                    key={s.id}
                    keyName={s.name}
                    value={s.secret}
                    hideValue
                    allowEdit={!isDisabled}
                    allowDelete={!isDisabled}
                    onSave={async (name) => editSecret(s.id, name)}
                    onDelete={async () => removeSecret(s.id)}
                    labelType="sharedSecret"
                />
            ))}
            <AddKeyFieldWrapper>
                <AddKeyField
                    label="Add shared secret"
                    addKeyFieldAllowed={!isDisabled}
                    labelType="sharedSecret"
                    onSave={async (name) => addSecret(name)}
                />
            </AddKeyFieldWrapper>
        </div>
    )
}

const SharedSecretEditor = styled(UnstyledSharedSecretEditor)`
    margin-top: 2rem;

    ${KeyField} + ${KeyField} {
        margin-top: 1.5rem;
    }

    ${AddKeyFieldWrapper} {
        margin-top: 2rem;
    }
`

export default SharedSecretEditor
