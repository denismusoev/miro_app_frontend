import React from 'react';
import {
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from '@xyflow/react';
import { toPng } from 'html-to-image';

function downloadImage(dataUrl) {
  const a = document.createElement('a');

  a.setAttribute('download', 'reactflow.png');
  a.setAttribute('href', dataUrl);
  a.click();
}

const imageWidth = 1920;
const imageHeight = 1080;

function ExportButton() {
  const { getNodes } = useReactFlow();
  
  // Функция экспорта доски
  const exportAsImage = () => {
    // Вычисляем границы всех узлов для определения правильного масштаба
    const nodesBounds = getNodesBounds(getNodes());
    const viewport = getViewportForBounds(
      nodesBounds,
      imageWidth,
      imageHeight,
      0.5,
      2,
    );

    toPng(document.querySelector('.react-flow__viewport'), {
      backgroundColor: '#1a365d',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: imageWidth,
        height: imageHeight,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    }).then(downloadImage);
  };

  // Добавляем слушателя события exportBoard
  React.useEffect(() => {
    const handleExportEvent = (event) => {
      exportAsImage();
    };

    document.addEventListener('exportBoard', handleExportEvent);

    return () => {
      document.removeEventListener('exportBoard', handleExportEvent);
    };
  }, []);

  return null; // Компонент не отображает никакого интерфейса
}

export default ExportButton; 