// BorderSettingsPopover.jsx
import React from 'react';
import { Popover, Select, InputNumber } from 'antd';
import { MdBorderHorizontal } from "react-icons/md";
import { BorderStyleType } from '../../model/Enums';

export const BorderSettingsPopover = ({
                                          visible,
                                          onVisibleChange,
                                          borderOpacity,
                                          onChangeBorderOpacity,
                                          borderStyle,
                                          onChangeBorderStyle,
                                          borderWidth,
                                          onChangeBorderWidth,
                                          borderColor,
                                          onChangeBorderColor,
                                          opacityOptions,
                                          borderColorOptions,
                                      }) => {
    // Формируем опции стиля обводки
    const borderStyleOptions = Object.values(BorderStyleType).map(style => ({
        value: style,
        label: style,
    }));

    const content = (
        <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Border Opacity */}
            <div>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>Border Opacity</div>
                <Select
                    value={borderOpacity}
                    onChange={(val) => onChangeBorderOpacity(val)}
                    bordered={false}
                    style={{ width: 100, background: 'transparent' }}
                    options={opacityOptions}
                />
            </div>
            {/* Border Style */}
            <div>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>Border Style</div>
                <Select
                    value={borderStyle}
                    onChange={onChangeBorderStyle}
                    bordered={false}
                    style={{ width: 100, background: 'transparent' }}
                    options={borderStyleOptions}
                />
            </div>
            {/* Border Width */}
            <div>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>Border Width</div>
                <InputNumber
                    value={borderWidth}
                    onChange={onChangeBorderWidth}
                    variant={"underlined"}
                    min={0}
                    style={{ width: 60, background: 'transparent', textAlign: 'center' }}
                />
            </div>
            {/* Border Color */}
            <div>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>Border Color</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {borderColorOptions.map((bc) => (
                        <button
                            key={bc}
                            onClick={() => {
                                onChangeBorderColor(bc);
                                onVisibleChange(false);
                            }}
                            style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: bc,
                                border: borderColor === bc ? '2px solid #000' : 'none',
                                cursor: 'pointer',
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <Popover
            content={content}
            title="Border Settings"
            trigger="click"
        >
            <button
                className="btn btn-link p-0 text-muted"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
                <MdBorderHorizontal size={16} />
            </button>
        </Popover>
    );
};
