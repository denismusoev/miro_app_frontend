import { ItemRs} from '../model/ItemDto';


export const itemToNode = (item) => {

    const itemRs = new ItemRs(item);

    const { id, type, boardId, parentId, position, geometry, style, data } = itemRs;
    let label = '';

    let restData = { ...data };

    if (['app_card', 'card', 'frame', 'image'].includes(type)) {
        label = data.title || '';
        delete restData.title;
    } else if (['shape', 'sticky_note', 'text'].includes(type)) {
        label = data.content || '';
        delete restData.content;
    }


    const nodeData = {
        ...restData,
        label,
        geometry: { ...geometry },
        style,
        position: { x: position.x - geometry.width / 2, y: position.y - geometry.height / 2 },
        parentId,
        boardId,
        functions: {}
    };


    const nodeBase = {
        id: id.toString(),
        type: type,
        position: { x: position.x - geometry.width / 2, y: position.y - geometry.height / 2 },
        width: geometry.width,
        height: geometry.height,
        data: nodeData
    };
    //
    // const nodeBase = {
    //     id: id.toString(),
    //     type: type,
    //     position: { x: position.x, y: position.y },
    //     width: geometry.width,
    //     height: geometry.height,
    //     data: nodeData
    // };

    // Если у узла есть родитель, добавляем parentId и extent
    if (parentId) {
        // console.log(`Узел ${id} имеет родителя ${parentId}`);
        nodeBase.parentId = parentId.toString();
        
        // Для узлов с родителем, position определяется относительно родителя
        // console.log(`Позиция узла ${id}:`, nodeBase.position);
    } else {
        // Явно устанавливаем parentId в undefined, чтобы убедиться, что его нет
        // console.log(`Узел ${id} не имеет родителя`);
        nodeBase.parentId = undefined;
    }

    return nodeBase;
};


export const nodeToItem = (node) => {
    const { id, type, parentId, position, width, height, data, extent } = node;
    // Извлекаем специальные поля из node.data
    const { label, geometry, additionalPosition, style, boardId, functions, ...restData } = data;

    // В зависимости от типа, устанавливаем title или content
    let newData = { ...restData };
    if (['app_card', 'card', 'frame', 'image'].includes(type)) {
        newData.title = label;
    } else if (['shape', 'sticky_note', 'text'].includes(type)) {
        newData.content = label;
    }

    // Если есть extent, добавляем его в данные
    // if (extent) {
    //     newData.extent = extent;
    // }

    // console.log(`Преобразование узла ${id} в элемент, родитель=${parentId || 'нет'}`);
    
    // ВАЖНО: Проверяем, что parentId не является undefined или null
    // Если parentId не определен, устанавливаем явно в null для сервера
    const finalParentId = parentId !== undefined ? parentId : null;

    return {
        id,
        position: {
            x: position.x + geometry.width / 2,
            y: position.y + geometry.height / 2,
            relativeTo: additionalPosition ? additionalPosition.relativeTo : null,
            origin: additionalPosition ? additionalPosition.origin : null,
        },
        geometry: { ...geometry },
        data: newData,
        style,
        parentId: finalParentId, // Используем проверенное значение
        boardId,
        type,
    };
};