import React, { HTMLAttributes } from "react";
import styled from "styled-components";
import Colors from "../../constants/colors";
import { FilterNames, Filters } from "../../constants/filters";
import { Container } from "../container";

type TabProps = { selected?: boolean };
export const Tab = styled.div<TabProps & HTMLAttributes<HTMLDivElement>>`
  padding: 0.5em 1em;
  background: ${(props) =>
    props.selected ? Colors.TAB_SELECTED : Colors.TAB_UNFOCUSED};
  margin: 0.5em;
  margin-left: 0;
  border-radius: 6px;
  box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.3);
  font-family: "Inter", sans-serif;
  cursor: pointer;
  transition: 0.2s;
`;

interface FilterProps {
  onTabClick: (tab: Filters) => void;
  selected: string;
}
export const ProjectFilter: React.FC<FilterProps> = ({
  selected,
  onTabClick,
}) => (
  <Container direction="row">
    <Tab
      onClick={() => onTabClick(FilterNames.ALL)}
      selected={selected === FilterNames.ALL}
    >
      All
    </Tab>
    <Tab
      onClick={() => onTabClick(FilterNames.MAINTAINED)}
      selected={selected === FilterNames.MAINTAINED}
    >
      Maintained
    </Tab>
  </Container>
);
