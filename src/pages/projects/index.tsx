import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import { AnimatedContainer, Container } from "../../components/container";
import { BackButton } from "../../components/generics/button";
import {
  AnimatedProject,
  ProjectPreview,
  ProjectProps,
  ProjectStyleProps,
  ProjectView,
} from "../../components/project";
import { ProjectFilter } from "../../components/project/filter";
import { FilterNames } from "../../constants/filters";
import DankMemer, { DankMemerPreview } from "./dankmemer";
import Flux, { FluxPreview } from "./flux";
import Poplet, { PopletPreview } from "./poplet";
import Powercord, { PowercordPreview } from "./powercord";
import zBot, { zBotPreview } from "./zbot";

type Item = ProjectProps & ProjectStyleProps;
export const Projects: Item[] = [
  {
    projectId: "flux",
    background: "linear-gradient(to right,#6cea9c,#2faf60);",
    preview: FluxPreview,
    component: Flux,
    maintained: true,
    links: {
      github: "https://github.com/joinflux",
      website: "https://joinflux.com",
    },
  },
  {
    projectId: "zbot",
    background: "linear-gradient(to right,#1d2826,#1e2928);",
    preview: zBotPreview,
    component: zBot,
    links: {
      github: "https://github.com/nevvulo/zBot",
    },
  },
  {
    projectId: "poplet",
    background: "linear-gradient(to right,#6c4386,#9e599e);",
    preview: PopletPreview,
    component: Poplet,
    links: {
      github: "https://github.com/popletapp/web-app",
    },
  },
  {
    projectId: "dankmemer",
    background: "linear-gradient(to right,rgb(89 141 62),rgb(89 141 62));",
    preview: DankMemerPreview,
    component: DankMemer,
    links: {
      github: "https://github.com/dankmemer",
    },
  },
  {
    projectId: "powercord",
    background: "linear-gradient(to right,#7289da,#7289da);",
    preview: PowercordPreview,
    component: Powercord,
    links: {
      github: "https://github.com/powercord",
      website: "https://powercord.dev",
    },
    maintained: true,
  },
];

const shouldShowItem = (item: Item, selectedTab: string) => {
  switch (selectedTab) {
    case "maintained":
      return item.maintained;
    case "all":
    default:
      return true;
  }
};

const ProjectsPage: React.FC = () => {
  const { id = FilterNames.ALL } = useParams<{ id?: string }>();
  const [selectedTab, setSelectedTab] = useState<string>(id || FilterNames.ALL);
  const [selectedItem, setSelectedItem] = useState(
    Projects.find((item) => item.projectId === id)
  );
  const history = useHistory();

  useEffect(() => {
    if (!selectedTab) setSelectedTab(FilterNames.ALL);
  }, [selectedTab]);

  return (
    <>
      <ProjectView>
        <AnimatedContainer
          initial={{ x: 25, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -25, opacity: 0 }}
          transition={{ ease: "easeInOut", duration: 0.2 }}
          direction="column"
          style={{ width: "100%" }}
        >
          <Header direction="column" style={{ height: "200px" }}>
            <Container alignItems="center">
              <BackButton to="/" />
              <Title>Projects</Title>
            </Container>
            <ProjectFilter
              selected={selectedTab}
              onTabClick={(tab) => setSelectedTab(tab)}
            />
          </Header>
          <Page>
            {Projects.map((item, i) => (
              <div
                key={i}
                onClick={() => {
                  if (selectedItem) return;
                  setSelectedItem(item);
                  history.push(`/projects/${item.projectId}`);
                }}
              >
                <ProjectPreview
                  hidden={!shouldShowItem(item, selectedTab)}
                  style={{ filter: selectedItem ? "blur(4px)" : "" }}
                  {...item}
                />
              </div>
            ))}
          </Page>
        </AnimatedContainer>
      </ProjectView>
      <AnimatePresence>
        {selectedItem && (
          <AnimatedProject
            onClose={() => setSelectedItem(undefined)}
            key="selected"
            {...selectedItem}
          />
        )}
      </AnimatePresence>
    </>
  );
};

const Page = styled(motion.div)`
  width: auto;
  height: 100%;
  border-radius: 24px;
`;

const Title = styled.h1`
  font-family: "Inter", sans-serif;
  font-weight: 800;
  color: white;
  line-height: 62px;
  letter-spacing: -2.5px;
  font-size: clamp(24px, 15vw, 52px);
  margin-bottom: 12px;
  margin-top: 16px;
  padding-left: 8px;
  color: rgba(10, 10, 10);
`;

const Header = styled(Container)`
  margin: 12px;
  margin-top: clamp(24px, 10vw, 42px);
  display: revert !important;
`;

export default ProjectsPage;
