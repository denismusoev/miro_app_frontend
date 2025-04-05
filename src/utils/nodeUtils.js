// nodeUtils.js
import React, { useRef, useEffect } from 'react';

export const editingInputStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    width: '100%',
    height: '100%',
    padding: '4px 8px',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    textAlign: 'center',
};

export const hexToRgba = (hex, opacity = 1) => {
    const normalizedHex = hex.replace('#', '');
    const bigint = parseInt(normalizedHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const convertFontName = (fontFamily) => {
    if (!fontFamily) return 'Arial, sans-serif';
    return fontFamily
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const getFlexAlignByVerticalTextAlign = (verticalAlign) => {
    switch (verticalAlign) {
        case 'top':
            return 'flex-start';
        case 'bottom':
            return 'flex-end';
        default:
            return 'center';
    }
};

// Простой Popover, который можно использовать для настройки (с Bootstrap‑оформлением)
export function Popover({ isOpen, anchorRef, onClose, children, customWidth = 'fit-content' }) {
    const popoverRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (
                (anchorRef?.current && anchorRef.current.contains(e.target)) ||
                (popoverRef?.current && popoverRef.current.contains(e.target))
            ) {
                return;
            }
            onClose && onClose();
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, anchorRef, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={popoverRef}
            onMouseDown={(e) => e.stopPropagation()}
            className="card shadow-sm"
            style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                width: customWidth,
                zIndex: 9999,
            }}
        >
            <div className="card-body p-2">{children}</div>
        </div>
    );
}
