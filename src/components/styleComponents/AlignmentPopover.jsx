// AlignmentPopover.jsx
import React from 'react';
import { Popover } from 'antd';
import { MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight, MdVerticalAlignTop } from 'react-icons/md';

export const AlignmentPopover = ({
                                     visible,
                                     onVisibleChange,
                                     currentHorizontal,
                                     onChangeHorizontal,
                                     currentVertical,
                                     onChangeVertical,
                                 }) => {
    const content = (
        <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Горизонтальное выравнивание */}
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <button onClick={() => onChangeHorizontal('left')}>
                    <MdFormatAlignLeft size={18} style={{ opacity: currentHorizontal === 'left' ? 1 : 0.5 }} />
                </button>
                <button onClick={() => onChangeHorizontal('center')}>
                    <MdFormatAlignCenter size={18} style={{ opacity: currentHorizontal === 'center' ? 1 : 0.5 }} />
                </button>
                <button onClick={() => onChangeHorizontal('right')}>
                    <MdFormatAlignRight size={18} style={{ opacity: currentHorizontal === 'right' ? 1 : 0.5 }} />
                </button>
            </div>
            {/* Вертикальное выравнивание */}
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <button onClick={() => onChangeVertical('top')}>
                    <MdVerticalAlignTop size={18} style={{ opacity: currentVertical === 'top' ? 1 : 0.5 }} />
                </button>
                <button onClick={() => onChangeVertical('middle')}>
                    <MdVerticalAlignTop size={18} style={{ opacity: currentVertical === 'middle' ? 1 : 0.5, transform: 'rotate(90deg)' }} />
                </button>
                <button onClick={() => onChangeVertical('bottom')}>
                    <MdVerticalAlignTop size={18} style={{ opacity: currentVertical === 'bottom' ? 1 : 0.5, transform: 'rotate(180deg)' }} />
                </button>
            </div>
        </div>
    );

    return (
        <Popover
            content={content}
            title="Alignment"
            trigger="click"
            visible={visible}
            onVisibleChange={onVisibleChange}
        >
            <button
                className="btn btn-link p-0 text-muted"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
                {/* Иконка, например, выравнивание по центру */}
                <MdFormatAlignCenter size={16} />
            </button>
        </Popover>
    );
};
