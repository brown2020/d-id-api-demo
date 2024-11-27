import * as fabric from 'fabric';
import { useEffect, useState } from 'react';

interface TextBoxProps {
    // textType: 'headline' | 'subTitle' | 'body';
    handleText: (textType: string) => void;
    canvas: fabric.Canvas | null;
}

export default function TextBox({ handleText, canvas }: TextBoxProps) {
    const [color, setColor] = useState("#000000"); // Default to black
    const [fontSize, setFontSize] = useState(16); // Default font size
    const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
    const [lineHeight, setLineHeight] = useState(1.5);

    useEffect(() => {
        if (canvas) {
            canvas.on('selection:created', (event) => {
                setSelectedObject(event.selected[0]);
            });

            canvas.on('selection:updated', (event) => {
                setSelectedObject(event.selected[0]);
            });

            canvas.on('selection:cleared', () => {
                setSelectedObject(null);
                clearSettings();
            });

            canvas.on('object:modified', (event) => {
                setSelectedObject(event.target);
            });

            canvas.on('object:scaling', (event) => {
                handleObjectSelection(event.target);
            });
        }
    }, [canvas]);

    const handleObjectSelection = (object: fabric.Object) => {
        if (!object) return;
        if (object.type === "i-text") {
            setColor(object.fill ? object.fill.toString() : "#000000");
            setFontSize((object as fabric.IText).fontSize ? (object as fabric.IText).fontSize : 16);
        }
    };

    const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setColor(value);

        if (selectedObject && canvas) {
            selectedObject.set({ fill: value });
            canvas.renderAll();
        }
    };

    const handleTextSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = parseInt(event.target.value);
        setFontSize(value);

        if (selectedObject && canvas) {
            selectedObject.set({ fontSize: value });
            canvas.renderAll();
        }
    };

    const handleLineHeight = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = parseFloat(event.target.value);
        console.log('Line Height:', value);
        setLineHeight(value);

        if (selectedObject && canvas) {
            selectedObject.set({ lineHeight: value });
            canvas.renderAll();
        }
    }

    const clearSettings = () => {
        setColor("#000000");
        setFontSize(16);
    };

    return (
        <div>
            {selectedObject && selectedObject.type === 'i-text' ? (
                <div className="flex flex-col gap-4 p-2 border rounded-md mb-2">
                    <div className="flex items-center w-full justify-between gap-2">
                        <p>Font Size</p>
                        <select
                            id="font-size"
                            value={fontSize}
                            onChange={(event) => handleTextSizeChange(event)}
                            className="p-2 border border-neutral-300 rounded-md w-20"
                        >
                            {Array.from({ length: 100 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {i + 1}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-between w-full gap-2">
                        <p>Text Color</p>
                        <input
                            id="color-picker"
                            type="color"
                            value={color}
                            onChange={handleColorChange}
                            className="w-20 h-10 rounded-md cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center w-full justify-between gap-2">
                        <p>Line Height</p>
                        <select
                            id="line-height"
                            value={lineHeight}
                            onChange={(event) => handleLineHeight(event)}
                            className="p-2 border border-neutral-300 rounded-md w-20"
                        >
                            {Array.from({ length: 100 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {i + 1}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : (
                <div className='flex flex-col gap-2'>
                    <button
                        className="w-full text-start pl-2 rounded-md bg-neutral-200 py-2 text-2xl font-semibold text-neutral-800 hover:bg-neutral-300 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => handleText('headline')}
                    >
                        Add a headline
                    </button>
                    <button
                        className="w-full text-start pl-2 rounded-md bg-neutral-200 py-2 text-lg font-semibold text-neutral-800 hover:bg-neutral-300 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => handleText('subTitle')}
                    >
                        Add a subtitle
                    </button>
                    <button
                        className="w-full text-start pl-2 rounded-md bg-neutral-200 py-2 text-sm hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => handleText('body')}
                    >
                        Add a body
                    </button>
                </div>
            )}
        </div>
    );
}
