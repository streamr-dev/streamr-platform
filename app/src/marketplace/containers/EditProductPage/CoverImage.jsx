// @flow

import React, { useContext } from 'react'
import cx from 'classnames'
import { Context as ValidationContext } from '../ProductController/ValidationContextProvider'

import useEditableProduct from '../ProductController/useEditableProduct'
import useValidation from '../ProductController/useValidation'
import useEditableProductActions from '../ProductController/useEditableProductActions'
import ImageUpload from '$shared/components/ImageUpload'
import InputError from '$mp/components/InputError'
import usePending from '$shared/hooks/usePending'

import styles from './coverImage.pcss'

const CoverImage = () => {
    const product = useEditableProduct()
    const { isTouched } = useContext(ValidationContext)
    const { updateImageFile } = useEditableProductActions()
    const { isValid, message } = useValidation('imageUrl')
    const { isPending } = usePending('product.SAVE')

    const hasError = isTouched('imageUrl') && !isValid

    return (
        <section id="cover-image" className={cx(styles.root, styles.CoverImage)}>
            <div>
                <h1>Add a cover image</h1>
                <p>This image will be shown as the tile image in the Marketplace browse view,
                    and also as the main image on your product page. For best quality,
                    an image size of around 1000 x 800px is recommended. PNG or JPEG format.
                    Need images? See the docs.
                </p>
                <ImageUpload
                    setImageToUpload={updateImageFile}
                    originalImage={(product.newImageToUpload && product.newImageToUpload.preview) || product.imageUrl}
                    className={styles.imageUpload}
                    dropzoneClassname={cx(styles.dropZone, {
                        [styles.dropZoneError]: !!hasError,
                    })}
                    disabled={!!isPending}
                />
                <InputError
                    eligible={hasError}
                    message={message}
                    preserved={false}
                />
            </div>
        </section>
    )
}

export default CoverImage