import Head from "next/head";
import { useState } from "react";
import styled from "styled-components";
import { ProjectView } from "../../components/layout/project";
import { SimpleNavbar } from "../../components/navbar/simple";
import { ProjectPreview } from "../../components/project";
import { FeaturedProjectPreview } from "../../components/project/featured-project";
import { ProjectFilter } from "../../components/project/filter";
import { type Game, Games } from "../../constants/games";

export default function GamesPage() {
  const [selectedTab, setSelectedTab] = useState("all");
  const featuredGames = Games.filter((m) => m.projectId === "golfquest");
  const otherGames = Games.filter((m) => filter(m, selectedTab)).filter(
    (m) => m.projectId !== "golfquest",
  );

  return (
    <ProjectView>
      <Background />

      <SimpleNavbar title="Games">
        <ProjectFilter selected={selectedTab} onTabClick={(tab) => setSelectedTab(tab)} />
      </SimpleNavbar>

      <GameContainer>
        {featuredGames.map((game) => (
          <FeaturedProjectPreview
            key={game.projectId}
            href={`/games/${game.projectId}`}
            {...game}
          />
        ))}

        {otherGames.map((item) => (
          <ProjectPreview key={item.projectId} href={`/games/${item.projectId}`} {...item} />
        ))}
      </GameContainer>

      <Head key="games">
        <title>Games - Nevulo</title>
        <meta
          name="description"
          content={`Explore ${Games.length} games I'm working on, including Roblox experiences and other game projects.`}
        />
        <meta property="og:title" content="Games by Nevulo" />
        <meta
          property="og:description"
          content={`Explore ${Games.length} games I'm working on, including Roblox experiences and other game projects.`}
        />
        <meta property="og:url" content="https://nevulo.xyz/games" />
        <meta
          property="og:image"
          content="https://nevulo.xyz/api/og?title=My%20Games&subtitle=Roblox%20%26%20Game%20Development"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Games by Nevulo" />
        <meta
          name="twitter:description"
          content={`Explore ${Games.length} games I'm working on.`}
        />
        <meta
          name="twitter:image"
          content="https://nevulo.xyz/api/og?title=My%20Games&subtitle=Roblox%20%26%20Game%20Development"
        />
      </Head>
    </ProjectView>
  );
}

const Background = styled.div`
  width: 100%;
  filter: ${(props) => (props.theme.contrast === "#000" ? "invert(1)" : "")};
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.03) 0%, rgba(22, 163, 74, 0.05) 100%);
  height: 100%;
  z-index: -1;
  position: fixed;
  top: 0;
`;

const GameContainer = styled.div`
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

function filter(game: Game, tab: string): boolean {
  switch (tab) {
    case "maintained":
      return game.maintained ?? false;
    case "all":
      return true;
    default:
      return false;
  }
}
