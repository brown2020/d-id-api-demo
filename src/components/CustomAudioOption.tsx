import React from "react";
import { Languages } from "../utils/Languages";
import { OptionProps } from "react-select";
import { ElevenLabs } from "@elevenlabs/elevenlabs-js";

const CustomAudioOption = ({ data, innerProps }: OptionProps<ElevenLabs.Voice>) => {
  const language = (code: string) => {
    return (
      Languages.find((lang) => lang.code === code) || {
        name: "Unknown Language",
      }
    );
  };

  const gender = data.labels?.gender;

  return (
    <div className="p-2">
      <div {...innerProps} className="p-2 border rounded-md cursor-pointer">
        <span className="flex items-center gap-2">
          {gender ? (
            <span className="text-xs uppercase opacity-50">{gender}</span>
          ) : null}
          <span className="font-medium">{data.name}</span>
          {data.labels?.accent ? (
            <span className="text-xs text-gray-500">({data.labels.accent})</span>
          ) : null}
        </span>
        {data.labels?.language ? (
          <div className="text-xs text-gray-500 mt-1">
            {language(data.labels.language).name}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CustomAudioOption;
