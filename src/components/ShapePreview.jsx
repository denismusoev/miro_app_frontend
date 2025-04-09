// ShapePreview.js
import React from 'react';
import { Stage, Layer } from 'react-konva';
import KonvaShape from './KonvaShape';

const ShapePreview = ({
                          shapeType,
                          width = 40,
                          height = 40,
                          fillColor = "#ffffff",
                          strokeColor = "#000000",
                          strokeWidth = 1,
                      }) => {
    return (
        <Stage width={width} height={height}>
            <Layer>
                <KonvaShape
                    shapeType={shapeType}
                    width={width}
                    height={height}
                    fillColor={fillColor}
                    strokeColor={strokeColor}
                    strokeWidth={strokeWidth}
                />
            </Layer>
        </Stage>
    );
};

export default ShapePreview;
