import type React from "react";
import type { HTMLAttributes } from "react";
import styled from "styled-components";
import Colors from "../../constants/colors";
import { FilterNames, type Filters } from "../../constants/filters";
import { Container } from "../container";

type TabProps = { selected?: boolean };
export const Tab = styled.div<TabProps & HTMLAttributes<HTMLDivElement>>`
  padding: 0.35em 1em;
  background: ${(props) => (props.selected ? Colors.TAB_SELECTED : Colors.TAB_UNFOCUSED)};
  margin: 0.5em 0.65em;
  margin-left: 0;
  color: ${(props) => (!props.selected ? Colors.BLACK : Colors.WHITE)};
  border-radius: 4px;
  font-size: 14px;
  box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.3);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: 0.2s;
`;

const ProjectFilterContainer = styled(Container)`
  margin-left: 0;
`;

interface FilterProps {
  onTabClick: (tab: Filters) => void;
  selected: string;
}
export const ProjectFilter: React.FC<FilterProps> = ({ selected, onTabClick }) => (
  <ProjectFilterContainer direction="row">
    <Tab onClick={() => onTabClick(FilterNames.ALL)} selected={selected === FilterNames.ALL}>
      All
    </Tab>
    <Tab
      onClick={() => onTabClick(FilterNames.MAINTAINED)}
      selected={selected === FilterNames.MAINTAINED}
    >
      Maintained
    </Tab>
  </ProjectFilterContainer>
);
