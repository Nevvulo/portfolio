import React from "react";
import { Title, Text, Link } from "../../components/generics";
import { ProjectView } from "../../components/views/project";

export default function ProjectNotFound() {
  return (
    <ProjectView>
      <Title>Oops!</Title>
      <Text>We couldn't find the project you were looking for.</Text>
      <Link href="/projects">Back to Projects</Link>
    </ProjectView>
  );
}
