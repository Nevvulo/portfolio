import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Container } from "../../components/container";
import { Header, Title } from "../../components/generics";
import { BackButton } from "../../components/generics/button";
import { Hero } from "../../components/hero";
import { ProjectPreview } from "../../components/project";
import { ProjectFilter } from "../../components/project/filter";
import { ProjectView } from "../../components/views/project";
import { FilterNames } from "../../constants/filters";
import { Projects } from "../../constants/projects";
import Background from "./../../assets/img/alt.jpg";

const ProjectContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-items: center;
  padding: 0 1em;
`;

function ProjectsPage() {
  const router = useRouter();

  return (
    <ProjectView>
      <Hero
        style={{ marginBottom: "24px", height: "150px" }}
        image={Background.src}
      >
        <Header direction="column">
          <Container alignItems="center">
            <BackButton href="/" />
            <Title fontSize="36px" color="white">
              🛠 Projects
            </Title>
          </Container>
          {/* <ProjectFilter
            selected={selectedTab}
            onTabClick={(tab) => setSelectedTab(tab)}
          /> */}
        </Header>
      </Hero>

      <ProjectContainer>
        {Projects.map((item) => (
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

export default ProjectsPage;
