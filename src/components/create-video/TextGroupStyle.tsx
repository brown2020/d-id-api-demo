import * as fabric from 'fabric';
import { Group } from 'lucide-react';
import { set } from 'react-hook-form';
import { text } from 'stream/consumers';

function fabricText(text: string, style: any) {
    return new fabric.IText(text, style);
}

function fabricGroup(canvas: fabric.Canvas | null, group: fabric.Group) {
    if (!canvas) return;
    canvas.add(group);
    canvas.renderAll();

    canvas.on('selection:cleared', () => {
        const items = group.getObjects();
        group.remove(...items);
        items.forEach((item: fabric.Object) => {
            item.set({ selectable: true });
            canvas.add(item);
        });

        canvas.remove(group);
        canvas.renderAll();
    });
}

export const TextGroup1 = (canvas: fabric.Canvas | null) => {
    if (!canvas) return;

    const maxWidth = 150;
    const set1 = new fabric.Textbox('Life is an', {
        left: 100,
        top: 100,
        fontSize: 22,
        fill: 'black',
        fontWeight: 'bold',
        width: maxWidth,
    });


    if (set1.width > maxWidth) {
        set1.width = maxWidth;
        set1.textAlign = 'center';
    }

    const set2 = new fabric.Text('Adventure', {
        left: 80,
        top: 140,
        fontSize: 38,
        fill: 'black',
        fontFamily: 'Rock Salt',
        fontStyle: 'italic',
    });

    const group = new fabric.Group([set1, set2], {
        left: 100,
        top: 100,
        selectable: true,
    });

    fabricGroup(canvas, group);
};

export const TextGroup2 = (canvas: fabric.Canvas | null) => {
    if (!canvas) return;

    const set1 = new fabric.Text('Congratulations!', {
        top: 100,
        fontSize: 62,
        fill: 'black',
        fontFamily: 'Bilbo Swash Caps',
        selectable: true,
    });

    const set2 = new fabric.Textbox(`You're a Big Brother`, {
        top: 170,
        fontSize: 18,
        fill: 'black',
        width: 250,
        textAlign: 'center',
    });

    set2.set({ left: set1.left + set1.width / 2 - set2.width / 3 });

    const group = new fabric.Group([set1, set2], {
        left: 100,
        top: 100,
        selectable: true,
    });

    fabricGroup(canvas, group);
};
