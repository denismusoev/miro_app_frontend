// src/dto/ItemCreateRq.js
export class ItemCreateRq {
    constructor({
                    position = { x: 0, y: 0 },
                    parentId = null,
                    boardId,
                    type
                } = {}) {
        this.position = position;
        this.parentId = parentId;
        this.boardId = boardId;
        this.type = type;
    }
}
