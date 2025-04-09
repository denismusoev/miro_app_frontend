// FillSettingsPopover.jsx
import React from 'react';
import { Popover, Select } from 'antd';
import { IoMdColorFill } from 'react-icons/io';

/**
 * Поповер для настроек заливки: fillOpacity (Select) сверху, ниже fillColor.
 */
export const FillSettingsPopover = ({
                                        visible,
                                        onVisibleChange,
                                        fillOpacity,
                                        onChangeFillOpacity,
                                        fillColor,
                                        onChangeFillColor,
                                        opacityOptions,    // [{value:'0.5', label:'0.5'}, ...]
                                        fillColorOptions,
                                    }) => {
    const content = (
        <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Выбор fillOpacity */}
            <div>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>Fill Opacity</div>
                <Select
                    value={fillOpacity}
                    onChange={onChangeFillOpacity}
                    bordered={false}
                    style={{ width: 100, background: 'transparent' }}
                    options={opacityOptions}
                />
            </div>
            {/* Выбор fillColor */}
            <div>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>Fill Color</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {fillColorOptions.map((fc) => (
                        <button
                            key={fc}
                            onClick={() => {
                                onChangeFillColor(fc);
                                onVisibleChange(false);
                            }}
                            style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: fc,
                                border: fillColor === fc ? '2px solid #000' : 'none',
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
            title="Fill Settings"
            trigger="click"
            visible={visible}
            onVisibleChange={onVisibleChange}
        >
            <button
                className="btn btn-link p-0 text-muted"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
                <IoMdColorFill size={16} />
            </button>
        </Popover>
    );
};
