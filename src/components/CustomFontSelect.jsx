import React from 'react';
import Select from 'react-select';

const customStyles = {
    control: (provided) => ({
        ...provided,
        width: '200px', // задаёт ширину поля выбора
        border: 'none',
        boxShadow: 'none',
        background: 'transparent',
        cursor: 'pointer',
    }),
    indicatorSeparator: () => null,
    dropdownIndicator: (provided) => ({
        ...provided,
        color: 'inherit',
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: '8px',
    }),
};

export const CustomFontSelect = ({ fontFamilies, value, onChange }) => {
    const fontOptions = fontFamilies.map((f) => ({
        value: f,
        label: f,
    }));
    const selectedOption = fontOptions.find((option) => option.value === value);
    return (
        <div className="nowheel">
            <Select
                styles={customStyles}
                value={selectedOption}
                onChange={(option) => onChange(option.value)}
                options={fontOptions}
                isSearchable={true}
            />
        </div>
    );
};

