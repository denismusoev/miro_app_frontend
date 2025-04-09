import React from 'react';

const TriangleNode = ({ data }) => {
    return (
        <svg width={100} height={100}>
            <polygon points="50,15 90,85 10,85" fill="lightblue" stroke="black" strokeWidth={2} />
            {/* Дополнительно можно вывести данные или добавить обработчики */}
            <text x="50%" y="50%" textAnchor="middle" fill="black">
                {data.label}
            </text>
        </svg>
    );
};

export default TriangleNode;
