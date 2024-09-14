import React, { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import axiosInstance from "../../axiosInstance.ts";

interface FileUploadWithIconProps {
  onAvatarChange: (base64String: string) => void;
}
const basePublisherUrl = "https://suipump.top";
// const numEpochs = 1;
let ImageUrl = "";

const FileUploadWithIcon: React.FC<FileUploadWithIconProps> = ({
  onAvatarChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        // const PublishUrl = `https://suipump.top/v1/store?epochs=1`;
        const ImageResponse = await axiosInstance.put('/v1/store?epochs=1', file);
        console.log(ImageResponse);
        if (ImageResponse.status === 200) {
          const info = await ImageResponse.data;
          console.log("ImageResponse",info);
          if('alreadyCertified' in info  && 'blobId' in info.alreadyCertified) {
            ImageUrl = `${basePublisherUrl}/v1/${info.alreadyCertified.blobId}`;
          }
          if('newlyCreated' in info && 'blobObject' in info.newlyCreated && 'blobId' in info.newlyCreated.blobObject) {
            ImageUrl = `${basePublisherUrl}/v1/${info.newlyCreated.blobObject.blobId}`;
          }
          // return { info: info, media_type: inputFile.type };
        } else {
          throw new Error("Something went wrong when storing the blob!");
        }
        onAvatarChange(ImageUrl);
      } catch (error) {
        console.error("Failed to upload file", error);
      }


    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <FontAwesomeIcon
        icon={faUpload}
        onClick={handleIconClick}
        style={{ cursor: "pointer" }}
      />
    </>
  );
};

export default FileUploadWithIcon;
