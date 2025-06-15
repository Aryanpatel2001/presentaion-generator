import Image from "next/image";
import React from "react";
import UploadImage from "./UploadImage";

type Props = {
  src: string;
  alt: string;
  className?: string;
  isPreview?: boolean;
  contentId: string;
  onContentChange: (
    contentId: string,
    newContent: string | string[] | string[][]
  ) => void;
  isEditable?: boolean;
};

const CustomImage = ({
  src,
  alt,
  className,
  isPreview = false,
  contentId,
  onContentChange,
  isEditable = true,
}: Props) => {
  return (
    <div className={`relative group w-full h-full rounded-lg`}>
      <Image
        src={
          src
          // "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        }
        width={isPreview ? 48 : 800}
        height={isPreview ? 48 : 800}
        alt={alt}
        className={`object-fill w-full h-full rounded-lg ${className}`}
      />
      {!isPreview && isEditable && (
        <div className="absolute top-0 left-0 hidden group-hover:block">
          <UploadImage
            contentId={contentId}
            onContentChange={onContentChange}
          />
        </div>
      )}
    </div>
  );
};

export default CustomImage;
