import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { Container } from "../../components/container";
import { Header, Title } from "../../components/generics";
import { BackButton } from "../../components/generics/button";
import { Hero } from "../../components/hero";
import { ProjectPreview } from "../../components/project";
import { ProjectFilter } from "../../components/project/filter";
import { Page } from "../../components/views/page";
import { ProjectView } from "../../components/views/project";
import { FilterNames } from "../../constants/filters";
import { Projects } from "../../constants/projects";
import Background from "./../../assets/img/alt.jpg";

const ProjectsPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [selectedTab, setSelectedTab] = useState<string>(id || FilterNames.ALL);
  const history = useHistory();

  return (
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
            onClick={() => history.push(`/projects/${item.projectId}`)}
            {...item}
          />
        ))}
      </Page>
    </ProjectView>
  );
};

export default ProjectsPage;
