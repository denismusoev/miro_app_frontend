import { ItemRs} from '../model/ItemDto';

/**
 * Преобразует объект ItemRs (с сервера) в объект Node для React Flow.
 * Пример входных данных (ItemRs):
 * {
 *   "id": 1,
 *   "position": { "x": "-2592.416059643877", "y": "-259.6763570310431", "relativeTo": null, "origin": "center" },
 *   "geometry": { "width": 1100, "height": 1127, "rotation": 0 },
 *   "data": { "title": "Frame 1", ... },
 *   "style": { ... },
 *   "parentId": null,
 *   "boardId": 7,
 *   "type": "frame"
 * }
 *
 * Результирующий Node будет таким:
 * {
 *   "id": "1",
 *   "position": { "x": "-2592.416059643877", "y": "-259.6763570310431" },
 *   "width": 1100,
 *   "height": 1127,
 *   "data": {
 *     "label": "Frame 1", // либо title, либо content, в зависимости от типа
 *     ... (остальные данные из itemRs.data, без title/content),
 *     "additionalGeometry": { "rotation": 0 },
 *     "additionalPosition": { "relativeTo": null, "origin": "center" },
 *     "style": { ... },
 *     "parentId": null,
 *     "boardId": 7,
 *     "functions": {}
 *   },
 *   "parentId": null,
 *   "type": "frame"
 * }
 */
export const itemToNode = (item) => {
    //console.log("[itemMapper][itemToNode] Пришедшие данные с сервера перед мыаппингом", item);
    const itemRs = new ItemRs(item);
    //console.log("[itemMapper][itemToNode] Созданная модель ItemRs", itemRs);
    const { id, type, boardId, parentId, position, geometry, style, data } = itemRs;
    let label = '';
    // Сохраняем копию остальных полей из data
    let restData = { ...data };

    if (['app_card', 'card', 'frame', 'image'].includes(type)) {
        label = data.title || '';
        delete restData.title;
    } else if (['shape', 'sticky_note', 'text'].includes(type)) {
        label = data.content || '';
        delete restData.content;
    }

    // Формируем внутренние данные узла
    const nodeData = {
        ...restData,
        label, // основное текстовое поле
        geometry: { ...geometry },
        additionalPosition: { relativeTo: position.relativeTo, origin: position.origin },
        style,     // стили из itemRs.style
        parentId,  // родительский id
        boardId,   // boardId
        functions: {}  // зарезервированное поле для функций
    };

    return {
        id: id.toString(),
        type: type,
        parentId: parentId,
        position: { x: position.x - geometry.width / 2, y: position.y - geometry.height / 2 },
        width: geometry.width,
        height: geometry.height,
        data: nodeData
    };
};

/**
 * Преобразует объект Node (React Flow) в объект ItemRs для отправки на сервер.
 * При обратном преобразовании:
 * - Внутри data записывается title или content в зависимости от типа,
 *   где значение берётся из data.label.
 * - Дополнительные поля additionalGeometry и additionalPosition используются для восстановления
 *   значения rotation, relativeTo и origin.
 *
 * Результирующий объект будет иметь следующую структуру:
 * {
 *   id: <id>,
 *   position: {
 *     x: <x>,
 *     y: <y>,
 *     relativeTo: <из additionalPosition.relativeTo>,
 *     origin: <из additionalPosition.origin>
 *   },
 *   geometry: {
 *     width: <width>,
 *     height: <height>,
 *     rotation: <из additionalGeometry.rotation>
 *   },
 *   data: {
 *     ... (остальные данные, при этом вместо data.label будет title или content)
 *   },
 *   style: <style из data.style>,
 *   parentId: <parentId>,
 *   boardId: <boardId>,
 *   type: <type>
 * }
 */
export const nodeToItem = (node) => {
    const { id, type, parentId, position, width, height, data } = node;
    // Извлекаем специальные поля из node.data
    const { label, geometry, additionalPosition, style, boardId, parentId: dataParentId, functions, ...restData } = data;

    // В зависимости от типа, устанавливаем title или content
    let newData = { ...restData };
    if (['app_card', 'card', 'frame', 'image'].includes(type)) {
        newData.title = label;
    } else if (['shape', 'sticky_note', 'text'].includes(type)) {
        newData.content = label;
    }

    return {
        id,
        position: {
            x: position.x + width / 2,
            y: position.y + height / 2,
            relativeTo: additionalPosition ? additionalPosition.relativeTo : null,
            origin: additionalPosition ? additionalPosition.origin : null,
        },
        geometry: { ...geometry },
        data: newData,
        style,
        parentId,
        boardId,
        type,
    };
};