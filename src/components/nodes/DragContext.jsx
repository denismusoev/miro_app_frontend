// DragContext.js
import React, { createContext, useContext, useState } from 'react';

const DragContext = createContext({
    type: null,
    setType: () => {}
});

export const DragProvider = ({ children }) => {
    const [type, setType] = useState(null);

    return (
        <DragContext.Provider value={{ type, setType }}>
            {children}
        </DragContext.Provider>
    );
};

export const useDrag = () => useContext(DragContext);

