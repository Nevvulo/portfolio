import React from "react";
import { useParams } from "react-router-dom";
import { Projects } from "../../constants/projects";
import { Page } from "../../components/views/page";
import { ProjectView } from "../../components/views/project";
import ProjectNotFound from "./not-found";
import { Container } from "../../components/container";
import styled from "styled-components";

const ComponentContainer = styled.div`
  padding: 1em 0;
`;

function Project() {
  const { id } = useParams<{ id: string }>();
  const project = Projects.find((m) => m.projectId === id);
  if (!project) return <ProjectNotFound />;
  const { component: Component } = project;
  return (
    <ProjectView>
      <Page>
        <ComponentContainer>
          <Component />
        </ComponentContainer>
      </Page>
    </ProjectView>
  );
}

export default Project;
