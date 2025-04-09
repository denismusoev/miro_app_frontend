// ColorPicker.jsx
import React from 'react';
import { Popover } from 'antd';
import { AiOutlineBgColors } from 'react-icons/ai';

/**
 * Поповер для выбора одного цвета из набора.
 * isOpen / onToggle / onClose можно заменить на controlled/uncontrolled подход
 * из AntD (visible / onVisibleChange).
 */
export const ColorPicker = ({
                                visible,
                                onVisibleChange,
                                currentColor,
                                colorOptions,
                                onChange,
                                title = "Color Picker"
                            }) => {
    const content = (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '6px' }}>
            {colorOptions.map((clr) => (
                <button
                    key={clr}
                    onClick={() => {
                        onChange(clr);
                        onVisibleChange(false); // закрываем поповер
                    }}
                    style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: clr,
                        border: currentColor === clr ? '2px solid #000' : 'none',
                        cursor: 'pointer',
                    }}
                />
            ))}
        </div>
    );

    return (
        <Popover
            content={content}
            title={title}
            trigger="click"
            visible={visible}
            onVisibleChange={onVisibleChange}
        >
            <button
                className="btn btn-link p-0 text-muted"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
                <AiOutlineBgColors size={16} />
            </button>
        </Popover>
    );
};
