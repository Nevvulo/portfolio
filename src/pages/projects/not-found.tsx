import React from "react";
import { Title, Text, Link, BackButton } from "../../components/generics";
import { Page } from "../../components/views/page";
import { ProjectView } from "../../components/views/project";

function ProjectNotFound() {
  return (
    <ProjectView>
      <Page>
        <Title>Oops!</Title>
        <Text>We couldn't find the project you were looking for.</Text>
        <Link to="/projects">
          <BackButton to="/projects" />
          Back to Projects
        </Link>
      </Page>
    </ProjectView>
  );
}

export default ProjectNotFound;
