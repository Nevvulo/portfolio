import styled from "styled-components";
import { LOUNGE_COLORS } from "../../../constants/lounge";

interface BannerFocalSliderProps {
  focalY: number; // 0-100
  onChange: (value: number) => void;
}

/**
 * Y-axis focal point slider for banner positioning
 */
export function BannerFocalSlider({ focalY, onChange }: BannerFocalSliderProps) {
  return (
    <SliderContainer>
      <SliderLabel>Top</SliderLabel>
      <SliderTrack>
        <SliderInput
          type="range"
          min={0}
          max={100}
          value={focalY}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </SliderTrack>
      <SliderLabel>Bottom</SliderLabel>
    </SliderContainer>
  );
}

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 200px;
`;

const SliderLabel = styled.span`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
`;

const SliderTrack = styled.div`
  flex: 1;
  position: relative;
`;

const SliderInput = styled.input`
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${LOUNGE_COLORS.tier1};
    border: 2px solid #fff;
    cursor: pointer;
    transition: transform 0.15s ease;

    &:hover {
      transform: scale(1.1);
    }
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${LOUNGE_COLORS.tier1};
    border: 2px solid #fff;
    cursor: pointer;
    transition: transform 0.15s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
`;

export default BannerFocalSlider;
