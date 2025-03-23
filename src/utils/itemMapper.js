// src/utils/itemMapper.js

import {FrameData, FrameStyle, ItemRs, TextData, TextStyle} from '../model/ItemDto';
import { ItemCreateRq } from '../model/ItemCreateRq';
import { ItemUpdateRq } from '../model/ItemUpdateRq';

// СТАРЫЙ КОД
// ===================================================================================================
/**
 * Преобразует объект ItemRs (с сервера) в объект Node для React Flow.
 * При этом копируются все поля data, но в data добавляется (или перезаписывается) поле label:
 * - Для элементов типов app_card, card, frame, image: label = data.title
 * - Для элементов типов shape, sticky_note, text: label = data.content
 */

// export const itemRsToNode = (itemRs) => {
//     const { id, type, boardId, parentId, position, geometry, style, data } = itemRs;
//     let label = '';
//     if (['app_card', 'card', 'frame', 'image'].includes(type)) {
//         label = data.title || '';
//     } else if (['shape', 'sticky_note', 'text'].includes(type)) {
//         label = data.content || '';
//     }
//     // Копируем все данные и добавляем/заменяем поле label
//     const nodeData = { ...data, label, style };
//     return {
//         id: id.toString(),
//         type,
//         boardId,
//         parentId,
//         position: { x: position.x, y: position.y },
//         geometry,
//         style,
//         data: nodeData,
//     };
// };
// ===================================================================================================

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
    console.log("[itemMapper][itemToNode] Пришедшие данные с сервера перед мыаппингом", item);
    const itemRs = new ItemRs(item);
    console.log("[itemMapper][itemToNode] Созданная модель ItemRs", itemRs);
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

// СТАРЫЙ КОД
// ===================================================================================================
/**
 * Преобразует объект Node (React Flow) в объект, пригодный для отправки на сервер (ItemRs).
 * При этом в data заменяется поле label на:
 * - title, если тип: app_card, card, frame, image
 * - content, если тип: shape, sticky_note, text
 * Остальные поля data остаются без изменений.
 */
// export const nodeToItemRs = (node) => {
//     const { id, type, boardId, parentId, position, geometry, style, data } = node;
//     // Создаем копию data
//     const mappedData = { ...data };
//     if (['app_card', 'card', 'frame', 'image'].includes(type)) {
//         mappedData.title = data.label;
//         delete mappedData.label;
//     } else if (['shape', 'sticky_note', 'text'].includes(type)) {
//         mappedData.content = data.label;
//         delete mappedData.label;
//     }
//     return {
//         id,
//         boardId,
//         parentId,
//         type,
//         position,
//         geometry,
//         style,
//         data: mappedData,
//     };
// };
// ===================================================================================================

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

export const toCreateItem = ({boardId, parentId, position, geometry, type}) => {
    return new ItemCreateRq({
        position: {
            ...position,
            x: position.x + geometry.width / 2,
            y: position.y + geometry.height / 2,
        },
        boardId: boardId,
        parentId: parentId,
        type: type
    });
};

