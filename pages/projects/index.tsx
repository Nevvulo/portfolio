import Head from "next/head";
import React, { useState } from "react";
import styled from "styled-components";
import { ProjectView } from "../../components/layout/project";
import { SimpleNavbar } from "../../components/navbar/simple";
import { ProjectPreview } from "../../components/project";
import { ProjectFilter } from "../../components/project/filter";
import { Project, Projects } from "../../constants/projects";

export default function ProjectsPage() {
  const [selectedTab, setSelectedTab] = useState("all");

  return (
    <ProjectView>
      <Background />

      <SimpleNavbar emoji="🛠" title="Projects">
        <ProjectFilter
          selected={selectedTab}
          onTabClick={(tab) => setSelectedTab(tab)}
        />
      </SimpleNavbar>

      <ProjectContainer>
        {Projects.filter((m) => filter(m, selectedTab)).map((item) => (
          <ProjectPreview
            key={item.projectId}
            href={`/projects/${item.projectId}`}
            {...item}
          />
        ))}
      </ProjectContainer>

      <Head key="projects">
        <title>Projects - Nevulo</title>
        <meta property="og:title" content="Projects I've worked on" />
        <meta
          property="og:description"
          content={`${Projects.length} projects ▪ Get more information on projects I'm currently working on and projects I've worked on in the past`}
        />
      </Head>
    </ProjectView>
  );
}

const Background = styled.div`
  width: 100%;
  background: url("/images/alt-background.png");
  height: 100%;
  opacity: 0.5;
  z-index: -1;
  position: fixed;
  top: 0;
`;

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

function filter(project: Project, tab: string) {
  switch (tab) {
    case "maintained":
      return project.maintained;
    case "all":
      return true;
  }
}
