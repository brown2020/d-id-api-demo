import React from 'react';
import { FlagIcon } from '../utils/FlagIcon';
import { Languages } from '../utils/Languages';
import { AudioDetails } from '@/types/did';
import { OptionProps } from 'react-select';

// Define the props interface
interface AudioOptionProps {
    data: AudioDetails;

}

const CustomOption = ({ data, innerProps }: OptionProps<AudioDetails>) => {
    
    const flagIcon = (accent : string) => {
        return FlagIcon.find(f => f.accent === accent);
    }

    const language = (code: string) => {
        return Languages.find(lang => lang.code === code) || { name: 'Unknown Language' };
    };

    return (
        <div className="p-2">
            <div {...innerProps} className="p-2 border rounded-md cursor-pointer">
                <span className="flex items-center">
                    {data.gender === 'male' ? (
                        <div className="opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12 2a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m-1.5 5h3a2 2 0 0 1 2 2v5.5H14V22h-4v-7.5H8.5V9a2 2 0 0 1 2-2" />
                            </svg>
                        </div>
                    ) : data.gender === 'female' ? (
                        <div className="opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12 2a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m-1.5 20v-6h-3l2.59-7.59C10.34 7.59 11.1 7 12 7s1.66.59 1.91 1.41L16.5 16h-3v6z" />
                            </svg>
                        </div>
                    ) : null}
                    {data.name}
                </span>
                <div className="flex items-center gap-1">
                    { flagIcon(data.accent)?.icon.src && <div>
                        <img src={flagIcon(data.accent)?.icon.src} width={20} height={20} alt="Flag" />
                    </div>}
                    <span className="">
                        {language(data.language).name} ( {data.accent} )
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CustomOption;
