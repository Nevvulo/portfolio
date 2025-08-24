import Image from "next/image";
import styled from "styled-components";

export const HeroContainer = styled.div`
  display: flex;
  position: relative;
  width: 100%;
  height: 100%;
  flex-direction: column;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
  color: white;
  font-family: "Inter", sans-serif;
`;

export const HeroImage = styled(Image)`
  position: absolute;
  height: 100%;
  z-index: -1;
`;
