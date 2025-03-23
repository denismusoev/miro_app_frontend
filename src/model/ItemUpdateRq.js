// src/dto/ItemCreateRq.js
export class ItemCreateRq {
    constructor({
                    id,
                    position,
                    geometry,
                    parentId,
                    data,
                    style,
                    boardId,
                    type
                } = {}) {
        this.id = id; // создается на сервере
        this.position = position;
        this.geometry = geometry;
        this.parentId = parentId;
        this.data = data;
        this.style = style;
        this.boardId = boardId;
        this.type = type;
    }
}
