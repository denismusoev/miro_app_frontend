// KonvaShape.js
import React from 'react';
import { Rect, Circle, Line } from 'react-konva';
import { ShapeType } from '../model/Enums';

const KonvaShape = ({
                        shapeType,
                        width = 100,
                        height = 100,
                        fillColor = "#ffffff",
                        strokeColor = "#000000",
                        strokeWidth = 2,
                        cornerRadius = 10,
                    }) => {
    switch(shapeType) {
        case ShapeType.RECTANGLE:
            return (
                <Rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                />
            );
        case ShapeType.ROUND_RECTANGLE:
            return (
                <Rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    cornerRadius={cornerRadius}
                />
            );
        case ShapeType.CIRCLE:
            return (
                <Circle
                    x={width / 2}
                    y={height / 2}
                    radius={Math.min(width, height) / 2}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                />
            );
        case ShapeType.TRIANGLE:
            return (
                <Line
                    points={[width / 2, 0, 0, height, width, height]}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    closed
                />
            );
        case ShapeType.RHOMBUS:
            return (
                <Line
                    points={[width / 2, 0, width, height / 2, width / 2, height, 0, height / 2]}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    closed
                />
            );
        default:
            return null;
    }
};

export default KonvaShape;
