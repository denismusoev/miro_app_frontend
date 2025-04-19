// customNodeTypes.js
import { TextNode } from './TextNode';
// import { FrameNode } from './FrameNode';
import { FrameNode } from './FrameNodeV2';
import { ImageNode } from './ImageNode';
import { ShapeNode } from './ShapeNode';
import { CardNode } from './CardNode';
import { StickyNoteNode } from './StickyNoteNode';

export const customNodeTypes = {
    text: TextNode,
    frame: FrameNode,
    // image: ImageNode,
    shape: ShapeNode,
    // card: CardNode,
    sticky_note: StickyNoteNode,
    // group: FrameNode,
};
