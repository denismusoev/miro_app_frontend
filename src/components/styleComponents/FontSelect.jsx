// FontSelect.jsx
import React from 'react';
import { Select } from 'antd';

/**
 * Компонент выбора семейства шрифтов на AntD.
 * - options: массив строк (или объектов) для шрифтов
 * - value: текущее значение
 * - onChange: (val) => void
 */
export const FontSelect = ({ options, value, onChange }) => {
    // Преобразуем массив строк в формат [{value, label}] если нужно
    const selectOptions = options.map((opt) => (typeof opt === 'string'
            ? { value: opt, label: opt }
            : opt
    ));

    return (
        <Select
            value={value}
            onChange={onChange}
            variant={"borderless"}
            style={{ width: 100, minWidth: 80, background: 'transparent' }}
            options={selectOptions}
        />
    );
};
