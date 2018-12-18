// @flow

import React from 'react'
import { I18n } from 'react-redux-i18n'
import AvatarEditor from 'react-avatar-editor'

import Dialog from '$shared/components/Dialog'
import Slider from '$shared/components/Slider'

import styles from './cropAvatarDialog.pcss'

type Props = {
    originalImage: string,
    onClose: () => void,
    onSave: (string) => void,
}

type State = {
    sliderValue: number,
}

type Editor = {
    getImage: () => HTMLCanvasElement,
    getImageScaledToCanvas: () => HTMLCanvasElement,
}

class CropAvatarDialog extends React.Component<Props, State> {
    state = {
        sliderValue: 1,
    }

    editor: ?Editor = null

    onSliderChange = (value: number) => {
        this.setState({
            sliderValue: value,
        })
    }

    setCanvasRef = (editor: ?Editor) => {
        this.editor = editor
    }

    onSave = () => {
        if (this.editor) {
            this.props.onSave(this.editor.getImageScaledToCanvas().toDataURL())
        }
    }

    render() {
        const { originalImage, onClose } = this.props
        const { sliderValue } = this.state
        return (
            <Dialog
                title={I18n.t('modal.avatar.cropYourImage')}
                onClose={onClose}
                actions={{
                    cancel: {
                        title: I18n.t('modal.common.cancel'),
                        outline: true,
                        onClick: onClose,
                    },
                    save: {
                        title: I18n.t('modal.common.apply'),
                        color: 'primary',
                        onClick: this.onSave,
                    },
                }}
            >
                <AvatarEditor
                    ref={this.setCanvasRef}
                    className={styles.editor}
                    image={originalImage}
                    width={200}
                    height={200}
                    border={[132, 16]}
                    borderRadius={100}
                    color={[255, 255, 255, 0.6]} // RGBA
                    scale={1 + (sliderValue / 100)}
                    rotate={0}
                />
                <div>
                    <Slider
                        min={1}
                        max={200}
                        value={sliderValue}
                        onChange={this.onSliderChange}
                        className={styles.slider}
                    />
                </div>
            </Dialog>
        )
    }
}

export default CropAvatarDialog
