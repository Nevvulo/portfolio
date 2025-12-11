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

      <SimpleNavbar title="Projects">
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
        <meta
          name="description"
          content={`Explore ${Projects.length} projects showcasing my work in web development, from production applications to open source contributions.`}
        />
        <meta property="og:title" content="Projects by Nevulo" />
        <meta
          property="og:description"
          content={`Explore ${Projects.length} projects showcasing my work in web development, from production applications to open source contributions.`}
        />
        <meta property="og:url" content="https://nevulo.xyz/projects" />
        <meta
          property="og:image"
          content="https://nevulo.xyz/api/og?title=My%20Projects&subtitle=Web%20Development%20%26%20Software%20Engineering"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Projects by Nevulo" />
        <meta
          name="twitter:description"
          content={`Explore ${Projects.length} projects showcasing my work in web development.`}
        />
        <meta
          name="twitter:image"
          content="https://nevulo.xyz/api/og?title=My%20Projects&subtitle=Web%20Development%20%26%20Software%20Engineering"
        />
      </Head>
    </ProjectView>
  );
}

const Background = styled.div`
  width: 100%;
  filter: ${(props) => (props.theme.contrast === "#000" ? "invert(1)" : "")};
  background: linear-gradient(135deg, rgba(79, 77, 193, 0.03) 0%, rgba(107, 105, 214, 0.05) 100%);
  height: 100%;
  z-index: -1;
  position: fixed;
  top: 0;
`;

const ProjectContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0 1rem;
  gap: 1.5rem;
  width: 100%;
  max-width: 800px;
  margin: 2rem auto;

  @media (min-width: 1024px) {
    padding: 0 2rem;
  }

  @media (max-width: 768px) {
    gap: 1rem;
    margin: 1rem auto;
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
