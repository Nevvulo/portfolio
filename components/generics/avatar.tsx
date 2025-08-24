import Image, { type ImageProps } from "next/image";
import type React from "react";
import NevuloImg from "../../assets/img/nevulo.jpg";
import COLORS from "../../constants/colors";

interface AvatarProps extends Omit<ImageProps, "src" | "alt"> {
  border?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ border, ...props }) => {
  return (
    <Image
      {...props}
      src={NevuloImg}
      alt="Nevulo profile picture"
      priority={true}
      style={{
        border: border ? `1px solid ${COLORS.PURPLE}` : undefined,
        borderRadius: "32px",
        ...props.style,
      }}
    />
  );
};
