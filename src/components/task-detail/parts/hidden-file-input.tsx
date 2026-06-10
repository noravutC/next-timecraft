import { forwardRef } from "react";

type Props = {
  accept: string;
  onFiles: (files: FileList) => void;
};

export const HiddenFileInput = forwardRef<HTMLInputElement, Props>(
  function HiddenFileInput({ accept, onFiles }, ref) {
    return (
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    );
  },
);
