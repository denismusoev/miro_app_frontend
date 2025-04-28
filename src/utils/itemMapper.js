import { ItemRs} from '../model/ItemDto';
import { ProjectContext } from '../components/ProjectProvider';


export const itemToNode = (item, userLogin = null) => {

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

    const lockData = {
        isLocked: item.isLocked || false,
        lockedBy: item.lockedBy === userLogin ? "me" : item.lockedBy
    };

    const nodeData = {
        ...restData,
        label,
        geometry: { ...geometry },
        style,
        position: { x: position.x, y: position.y },
        parentId,
        boardId,
        functions: {},
        ...lockData
    };


    const nodeBase = {
        id: String(id),
        type: type,
        // position: { x: position.x - geometry.width / 2, y: position.y - geometry.height / 2 },
        position: { x: position.x, y: position.y },
        measured:{
            width: geometry.width,
            height: geometry.height
        },
        data: nodeData
    };

    if (parentId) {
        nodeBase.parentId = String(parentId);
    } else {
        nodeBase.parentId = undefined;
    }

    return nodeBase;
};


export const nodeToItem = (node) => {
    const { id, type, parentId, position, data } = node;
    // Извлекаем специальные поля из node.data
    const { label, geometry, additionalPosition, style, boardId, functions, isLocked, lockedBy, ...restData } = data;
    console.log(label)

    // В зависимости от типа, устанавливаем title или content
    let newData = { ...restData };
    if (['app_card', 'card', 'frame', 'image'].includes(type)) {
        newData.title = label;
    } else if (['shape', 'sticky_note', 'text'].includes(type)) {
        newData.content = label;
    }

    console.log(newData);
    const finalParentId = parentId !== undefined ? parentId : null;
    console.log(parentId !== undefined);
    console.log(finalParentId);

    return {
        id,
        position: {
            x: position.x,
            y: position.y
        },
        geometry: { ...node.measured },
        data: newData,
        style,
        parentId: finalParentId, // Используем проверенное значение
        boardId,
        type,
    };
};