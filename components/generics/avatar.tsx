import styled from "styled-components";
import NevuloImg from "../../assets/img/nevulo.jpg";
import Image from "next/image";

export const Avatar = styled(Image).attrs({
  src: NevuloImg,
  alt: "Nevulo profile picture",
})`
  border-radius: 32px;
`;
