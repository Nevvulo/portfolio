import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import { Hero } from "../../components/hero";
import { AnimatedContainer, Container } from "../../components/container";
import { Header, Title } from "../../components/generics";
import { BackButton } from "../../components/generics/button";
import {
  ProjectPreview,
  ProjectProps,
  ProjectStyleProps,
} from "../../components/project";
import { AnimatedProject } from "../../components/project/animated-project";
import { ProjectFilter } from "../../components/project/filter";
import { FilterNames } from "../../constants/filters";
import DankMemer, { DankMemerPreview } from "./dankmemer";
import Flux, { FluxPreview } from "./flux";
import Poplet, { PopletPreview } from "./poplet";
import Powercord, { PowercordPreview } from "./powercord";
import zBot, { zBotPreview } from "./zbot";
import Background from "./../../assets/img/alt.jpg";
import { ProjectView } from "../../components/views/project";
import { Page } from "../../components/views/page";

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
    background: "linear-gradient(to right,#16222a, #3a6073);",
    preview: zBotPreview,
    component: zBot,
    links: {
      github: "https://github.com/nevvulo/zBot",
    },
  },
  {
    projectId: "poplet",
    background: "linear-gradient(to right, #8e2de2, #4a00e0);",
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
    const unsub = history.listen(() => {
      if (history.action === "POP") setSelectedItem(undefined);
    });
    return unsub;
  }, [history]);

  useEffect(() => {
    if (!selectedTab) setSelectedTab(FilterNames.ALL);
  }, [selectedTab]);

  return (
    <>
      <ProjectView>
        <Page>
          <Hero
            style={{ marginBottom: "24px", height: "150px" }}
            image={Background}
          >
            <Header direction="column">
              <Container alignItems="center">
                <BackButton to="/" />
                <Title fontSize="36px" color="white">
                  🛠 Projects
                </Title>
              </Container>
              <ProjectFilter
                selected={selectedTab}
                onTabClick={(tab) => setSelectedTab(tab)}
              />
            </Header>
          </Hero>

          {Projects.map((item) => (
            <ProjectPreview
              key={item.projectId}
              hidden={!shouldShowItem(item, selectedTab)}
              onClick={() => {
                setSelectedItem(item);
                if (selectedItem) return;
                history.push(`/projects/${item.projectId}`);
              }}
              style={{
                filter: selectedItem ? "blur(4px)" : "",
                transition: "0.2s opacity",
              }}
              {...item}
            />
          ))}
        </Page>
      </ProjectView>
      <AnimatePresence initial={true} exitBeforeEnter>
        {selectedItem && (
          <AnimatedProject
            key="selected"
            layout
            onClose={() => setSelectedItem(undefined)}
            {...selectedItem}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ProjectsPage;
