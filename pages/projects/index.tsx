import { useRouter } from "next/router";
import React, { useState } from "react";
import styled from "styled-components";
import Image from "next/image";
import { Container } from "../../components/container";
import { Header, Title } from "../../components/generics";
import { BackButton } from "../../components/generics/button";
import { HeroContainer, HeroImage } from "../../components/hero";
import { ProjectPreview } from "../../components/project";
import { ProjectFilter } from "../../components/project/filter";
import { ProjectView } from "../../components/views/project";
import { Emoji } from "../../components/generics/emoji";
import { Project, Projects } from "../../constants/projects";

const ProjectContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 1em;
  width: 100%;
  min-width: 300px;

  @media (min-width: 1024px) {
    align-items: flex-start;
    min-width: 700px;
    width: 50%;
  }
`;

const Background = styled.div`
  width: 100%;
  background: url("/alt-background.png");
  height: 100%;
  opacity: 0.5;
  z-index: -1;
  position: fixed;
  top: 0;
`;

function ProjectsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("all");

  return (
    <ProjectView>
      <Background />
      <Header justifyContent="center" direction="column">
        <Container alignItems="center">
          <BackButton href="/" />
          <Title fontSize="36px" color="white">
            <Emoji>🛠</Emoji> Projects
          </Title>
        </Container>
        <ProjectFilter
          selected={selectedTab}
          onTabClick={(tab) => setSelectedTab(tab)}
        />
      </Header>

      <ProjectContainer>
        {Projects.filter((m) => filter(m, selectedTab)).map((item) => (
          <ProjectPreview
            key={item.projectId}
            onClick={() => router.push(`/projects/${item.projectId}`)}
            {...item}
          />
        ))}
      </ProjectContainer>
    </ProjectView>
  );
}

function filter(project: Project, tab: string) {
  switch (tab) {
    case "maintained":
      return project.maintained;
    case "all":
      return true;
  }
}

export default ProjectsPage;
