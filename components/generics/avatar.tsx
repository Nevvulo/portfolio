import styled from "styled-components";
import NevuloImg from "../../assets/img/nevulo.jpg";
import Image from "next/image";
import COLORS from "../../constants/colors";

export const Avatar = styled(Image).attrs({
  src: NevuloImg,
  alt: "Nevulo profile picture",
  priority: true,
})<{ border?: boolean }>`
  border: ${(props) =>
    props.border ? `1px solid ${COLORS.PURPLE}` : ""} !important;
  border-radius: 32px;
`;
