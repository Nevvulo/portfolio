import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { Page } from "../../components/views/page";
import { ProjectView } from "../../components/views/project";
import { Projects } from "../../constants/projects";
import ProjectNotFound from "./not-found";

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
