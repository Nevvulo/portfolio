import Head from "next/head";
import { useState } from "react";
import styled from "styled-components";
import { ProjectView } from "../../components/layout/project";
import { SimpleNavbar } from "../../components/navbar/simple";
import { ProjectPreview } from "../../components/project";
import { FeaturedProjectPreview } from "../../components/project/featured-project";
import { ProjectFilter } from "../../components/project/filter";
import { type Project, Projects } from "../../constants/projects";

export default function ProjectsPage() {
  const [selectedTab, setSelectedTab] = useState("all");
  const featuredProjects = Projects.filter(
    (m) => m.projectId === "unloan" || m.projectId === "flux",
  );
  const otherProjects = Projects.filter((m) => filter(m, selectedTab)).filter(
    (m) => m.projectId !== "unloan" && m.projectId !== "flux",
  );

  return (
    <ProjectView>
      <Background />

      <SimpleNavbar emoji="🛠" title="Projects">
        <ProjectFilter selected={selectedTab} onTabClick={(tab) => setSelectedTab(tab)} />
      </SimpleNavbar>

      <ProjectContainer>
        {featuredProjects.map((project) => (
          <FeaturedProjectPreview
            key={project.projectId}
            href={`/projects/${project.projectId}`}
            isSmaller={project.projectId === "flux"}
            {...project}
          />
        ))}

        {otherProjects.map((item) => (
          <ProjectPreview key={item.projectId} href={`/projects/${item.projectId}`} {...item} />
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
  filter: ${(props) => (props.theme.contrast === "#000" ? "invert(1)" : "")}
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
    align-items: center;
    min-width: 700px;
    width: 50%;
  }
`;

function filter(project: Project, tab: string): boolean {
  switch (tab) {
    case "maintained":
      return project.maintained ?? false;
    case "all":
      return true;
    default:
      return false;
  }
}
