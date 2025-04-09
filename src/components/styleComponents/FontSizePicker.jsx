// FontSizePicker.jsx
import React from 'react';
import { InputNumber } from 'antd';

/**
 * Компонент выбора размера шрифта (AntD).
 * Props:
 * - value (number)
 * - onChange (number => void)
 */
export const FontSizePicker = ({ value, onChange }) => {
    return (
        <InputNumber
            value={value}
            onChange={onChange}
            variant={"borderless"}
            min={1}
            style={{ width: 60, textAlign: 'center', background: 'transparent' }}
        />
    );
};
