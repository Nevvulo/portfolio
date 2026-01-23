import {
  BookOpen,
  Briefcase,
  Code,
  ExternalLink,
  Gamepad2,
  Heart,
  MapPin,
  Music,
  Video,
} from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import nevuloImg from "../../assets/img/nevulo.jpg";
import { SocialLinks } from "../../components/generics";
import { Footer } from "../../components/generics/footer";
import { SimpleNavbar } from "../../components/navbar/simple";
import { ROUTES } from "../../constants/routes";

export default function About() {
  return (
    <PageWrapper>
      <Background />
      <SimpleNavbar />

      <MainContent>
        {/* Classic "Hi, I'm Blake" Hero */}
        <HeroSection>
          <HeroInner>
            <FadeUp $delay={50}>
              <ProfilePic src={nevuloImg} alt="Blake" width={48} height={48} />
            </FadeUp>
            <TitleRow>
              <Border />
              <Title>
                <FadeUp $bounce $delay={0}>
                  Hi,
                </FadeUp>{" "}
                <FadeUp $bounce $delay={200}>
                  I'm
                </FadeUp>{" "}
                <FadeUp $bounce $delay={310}>
                  Blake
                </FadeUp>
              </Title>
            </TitleRow>
            <Subtitle>
              <FadeUp $delay={400}>I'm a full-stack software engineer and content producer.</FadeUp>
            </Subtitle>
            <FadeUp $delay={500}>
              <MetaRow>
                <MetaItem>
                  <MapPin size={14} />
                  Melbourne, Australia
                </MetaItem>
                <MetaItem>
                  <Briefcase size={14} />
                  Engineer @ Unloan (CBA)
                </MetaItem>
              </MetaRow>
            </FadeUp>
            <FadeUp $delay={600}>
              <SocialLinks direction="row" />
            </FadeUp>
          </HeroInner>
        </HeroSection>

        {/* What is Nevulo? - Cinematic Section */}
        <WhatIsSection>
          <WhatIsTitle>what is nevulo?</WhatIsTitle>

          <ScopeGrid>
            <ScopeCard $color="#9074f2">
              <ScopeIcon>
                <BookOpen size={24} />
              </ScopeIcon>
              <ScopeTitle>Learn</ScopeTitle>
              <ScopeDesc>Articles, tutorials, and deep-dives on web development</ScopeDesc>
            </ScopeCard>

            <ScopeCard $color="#f59e0b">
              <ScopeIcon>
                <Briefcase size={24} />
              </ScopeIcon>
              <ScopeTitle>Software</ScopeTitle>
              <ScopeDesc>Professional work and open-source contributions</ScopeDesc>
            </ScopeCard>

            <ScopeCard $color="#10b981">
              <ScopeIcon>
                <Gamepad2 size={24} />
              </ScopeIcon>
              <ScopeTitle>Games</ScopeTitle>
              <ScopeDesc>Roblox and Steam (soon)</ScopeDesc>
            </ScopeCard>

            <ScopeCard $color="#ec4899">
              <ScopeIcon>
                <Music size={24} />
              </ScopeIcon>
              <ScopeTitle>Music</ScopeTitle>
              <ScopeDesc>Drum & bass production, DJ sets</ScopeDesc>
            </ScopeCard>

            <ScopeCard $color="#9146ff">
              <ScopeIcon>
                <Video size={24} />
              </ScopeIcon>
              <ScopeTitle>Videos & Live</ScopeTitle>
              <ScopeDesc>Twitch streams and YouTube content</ScopeDesc>
            </ScopeCard>

            <ScopeCard $color="#ef4444">
              <ScopeIcon>
                <Heart size={24} />
              </ScopeIcon>
              <ScopeTitle>Community</ScopeTitle>
              <ScopeDesc>Discord server, legends, and more</ScopeDesc>
            </ScopeCard>
          </ScopeGrid>
        </WhatIsSection>

        {/* Bio Section */}
        <Section>
          <SectionTitle>About Me</SectionTitle>
          <BioText>
            I'm a passionate software engineer who believes users deserve the best experiences in
            every application they use. Currently, I'm building the future of home loans at{" "}
            <HighlightLink href="https://unloan.com.au" target="_blank">
              Unloan
            </HighlightLink>
            , a digital-first home loan platform by the Commonwealth Bank of Australia.
          </BioText>
          <BioText>
            I primarily work with <strong>TypeScript</strong> and <strong>JavaScript</strong>, but I
            have experience with lower level languages like <strong>Java</strong> and{" "}
            <strong>Swift</strong> for native app development. I'm proficient with{" "}
            <strong>React</strong> for building front-end interfaces with layouts and performance
            built for the modern web. I also spend just as much time working on the back-end -
            handling business logic, solving problems at scale, and server management.
          </BioText>
          <BioText>
            When I'm not writing code, you'll find me producing music, streaming on Twitch, or
            working on game development projects.
          </BioText>
        </Section>

        {/* Skills Section */}
        <Section>
          <SectionTitle>What I Work With</SectionTitle>
          <SkillsGrid>
            <SkillCategory>
              <SkillCategoryTitle>
                <Code size={16} /> Languages
              </SkillCategoryTitle>
              <SkillTags>
                <SkillTag $primary>TypeScript</SkillTag>
                <SkillTag $primary>JavaScript</SkillTag>
                <SkillTag>Python</SkillTag>
                <SkillTag>Swift</SkillTag>
                <SkillTag>Java</SkillTag>
                <SkillTag>Lua</SkillTag>
              </SkillTags>
            </SkillCategory>

            <SkillCategory>
              <SkillCategoryTitle>Frontend</SkillCategoryTitle>
              <SkillTags>
                <SkillTag $primary>React</SkillTag>
                <SkillTag $primary>Next.js</SkillTag>
                <SkillTag>Vue</SkillTag>
                <SkillTag>React Native</SkillTag>
                <SkillTag>Tailwind</SkillTag>
              </SkillTags>
            </SkillCategory>

            <SkillCategory>
              <SkillCategoryTitle>Backend & Cloud</SkillCategoryTitle>
              <SkillTags>
                <SkillTag $primary>Node.js</SkillTag>
                <SkillTag>Firebase</SkillTag>
                <SkillTag>AWS</SkillTag>
                <SkillTag>Vercel</SkillTag>
                <SkillTag>PostgreSQL</SkillTag>
              </SkillTags>
            </SkillCategory>
          </SkillsGrid>
        </Section>

        {/* Quick Links */}
        <Section>
          <SectionTitle>Explore</SectionTitle>
          <QuickLinks>
            <QuickLink href={ROUTES.BLOG.ROOT}>
              <span>Blog</span>
              <ExternalLink size={14} />
            </QuickLink>
            <QuickLink href={ROUTES.PROJECTS.ROOT}>
              <span>Projects</span>
              <ExternalLink size={14} />
            </QuickLink>
            <QuickLink href="/games">
              <span>Games</span>
              <ExternalLink size={14} />
            </QuickLink>
            <QuickLink href="/learn">
              <span>Learn</span>
              <ExternalLink size={14} />
            </QuickLink>
            <QuickLink href="/live">
              <span>Live</span>
              <ExternalLink size={14} />
            </QuickLink>
            <QuickLink href="/support">
              <span>Support</span>
              <ExternalLink size={14} />
            </QuickLink>
          </QuickLinks>
        </Section>

        {/* CTA */}
        <CTASection>
          <CTATitle>Let's have a chat!</CTATitle>
          <CTAText>Want to work together or just say hi? I'd love to hear from you.</CTAText>
          <CTAButtons>
            <CTAButton href="/contact" $primary>
              Get in Touch
            </CTAButton>
            <CTAButton href="/support">Support My Work</CTAButton>
          </CTAButtons>
        </CTASection>
      </MainContent>

      <Head key="about">
        <title>About - Nevulo</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Protest+Revolution&display=swap"
          rel="stylesheet"
        />
        <meta
          name="description"
          content="Learn about Blake (Nevulo), a software engineer based in Melbourne, Australia. Building exceptional digital experiences at Unloan."
        />
        <meta property="og:title" content="About Nevulo" />
        <meta
          property="og:description"
          content="Software engineer based in Melbourne, Australia. Building exceptional digital experiences."
        />
        <meta property="og:url" content="https://nev.so/about" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=About%20Blake&subtitle=Software%20Engineer%20%7C%20Melbourne%2C%20Australia"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Nevulo" />
        <meta
          name="twitter:description"
          content="Software engineer based in Melbourne, Australia."
        />
      </Head>
    </PageWrapper>
  );
}

// Animations
const riseUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0px);
  }
`;

const riseUpBounce = keyframes`
  0% {
    opacity: 0.1;
    transform: scale(3);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const FadeUp = styled.span<{ $delay: number; $bounce?: boolean }>`
  display: inline-block;
  animation: 0.8s ${(props) => (!props.$bounce ? riseUp : riseUpBounce)} forwards;
  opacity: 0;
  transform: translateY(20px);
  animation-timing-function: cubic-bezier(0.33, 0.71, 0.58, 0.99);
  animation-delay: ${(props) => props.$delay}ms;

  @media (prefers-reduced-motion) {
    animation: none;
    opacity: 1;
    transform: translateY(0px);
  }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Background = styled.div`
  width: 100%;
  filter: ${(props) => (props.theme.contrast === "#000" ? "invert(1)" : "")};
  background: url("/images/alt-background.png");
  background-size: cover;
  height: 100%;
  opacity: 0.5;
  z-index: -1;
  position: fixed;
  top: 0;
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem 3rem;
  }
`;

// Classic "Hi, I'm Blake" Hero
const HeroSection = styled.div`
  margin-bottom: 4rem;
  padding: 2rem 0;
`;

const HeroInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProfilePic = styled(Image)`
  border-radius: 50%;
  margin-bottom: 1rem;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0;
`;

const Border = styled.div`
  background: #4f4dc1;
  width: 8px;
  border-radius: 12px;
  margin-right: 12px;
  flex-shrink: 0;
`;

const Title = styled.h1`
  display: block;
  color: ${(props) => props.theme.contrast};
  font-family: "Inter", var(--font-sans), sans-serif;
  font-weight: 900;
  line-height: 1;
  font-size: clamp(48px, 10vw, 80px);
  margin: 0;
  letter-spacing: -2px;
`;

const Subtitle = styled.h2`
  font-family: var(--font-sans);
  color: ${(props) => props.theme.textColor};
  font-weight: 400;
  font-size: 1.25rem;
  margin: 1rem 0;
  opacity: 0.8;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin: 0.5rem 0 1rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: ${(props) => props.theme.contrast}60;

  svg {
    color: #9074f2;
  }
`;

// "What is Nevulo?" Section
const WhatIsSection = styled.section`
  text-align: center;
  margin-bottom: 4rem;
  padding: 3rem 0;
`;

const WhatIsLabel = styled.span`
  display: block;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: ${(props) => props.theme.contrast}50;
  text-transform: lowercase;
  letter-spacing: 2px;
  margin-bottom: 0.5rem;
`;

const WhatIsTitle = styled.h2`
  font-family: 'Protest Revolution', cursive;
  font-size: clamp(40px, 8vw, 72px);
  color: ${(props) => props.theme.contrast};
  margin: 0 0 1rem 0;
  letter-spacing: 2px;
  transform: rotate(-2deg);
`;

const WhatIsDescription = styled.p`
  font-family: var(--font-sans);
  font-size: 1.125rem;
  color: ${(props) => props.theme.contrast}70;
  margin: 0 0 2.5rem 0;
`;

const ScopeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ScopeCard = styled.div<{ $color: string }>`
  background: ${(props) => props.theme.contrast}05;
  border: 1px solid ${(props) => props.theme.contrast}10;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => props.$color}10;
    border-color: ${(props) => props.$color}30;
    transform: translateY(-2px);
  }
`;

const ScopeIcon = styled.div`
  margin-bottom: 0.75rem;
  color: ${(props) => props.theme.contrast}80;
`;

const ScopeTitle = styled.h3`
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.25rem 0;
`;

const ScopeDesc = styled.p`
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  color: ${(props) => props.theme.contrast}60;
  margin: 0;
  line-height: 1.4;
`;

const InsaneText = styled.p`
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: ${(props) => props.theme.contrast}40;
  font-style: italic;
`;

// Sections
const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-family: var(--font-sans);
  font-size: 1.25rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 1rem 0;
`;

const BioText = styled.p`
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.75;
  color: ${(props) => props.theme.contrast}90;
  margin: 0 0 1rem 0;

  strong {
    color: ${(props) => props.theme.contrast};
    font-weight: 600;
  }
`;

const HighlightLink = styled.a`
  color: #f59e0b;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
`;

// Skills
const SkillsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const SkillCategory = styled.div``;

const SkillCategoryTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast}70;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SkillTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SkillTag = styled.span<{ $primary?: boolean }>`
  padding: 0.375rem 0.875rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 6px;
  background: ${(props) =>
    props.$primary ? "rgba(144, 116, 242, 0.15)" : `${props.theme.contrast}08`};
  color: ${(props) => (props.$primary ? "#9074f2" : `${props.theme.contrast}80`)};
  border: 1px solid ${(props) =>
    props.$primary ? "rgba(144, 116, 242, 0.3)" : `${props.theme.contrast}15`};
`;

// Quick Links
const QuickLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const QuickLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: ${(props) => props.theme.contrast}08;
  border: 1px solid ${(props) => props.theme.contrast}15;
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => props.theme.contrast};
  text-decoration: none;
  transition: all 0.2s ease;

  svg {
    opacity: 0.5;
  }

  &:hover {
    background: rgba(144, 116, 242, 0.15);
    border-color: rgba(144, 116, 242, 0.3);
    color: #9074f2;

    svg {
      opacity: 1;
    }
  }
`;

// CTA Section
const CTASection = styled.div`
  text-align: center;
  padding: 2.5rem;
  background: linear-gradient(135deg, rgba(144, 116, 242, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%);
  border: 1px solid rgba(144, 116, 242, 0.2);
  border-radius: 20px;
  margin-bottom: 2rem;
`;

const CTATitle = styled.h2`
  font-family: var(--font-sans);
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.5rem 0;
`;

const CTAText = styled.p`
  font-family: var(--font-sans);
  font-size: 1rem;
  color: ${(props) => props.theme.contrast}70;
  margin: 0 0 1.5rem 0;
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const CTAButton = styled(Link)<{ $primary?: boolean }>`
  padding: 0.75rem 1.5rem;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s ease;

  ${(props) =>
    props.$primary
      ? `
      background: linear-gradient(135deg, #9074f2, #6366f1);
      color: white;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(144, 116, 242, 0.4);
      }
    `
      : `
      background: ${props.theme.contrast}08;
      border: 1px solid ${props.theme.contrast}20;
      color: ${props.theme.contrast};

      &:hover {
        background: ${props.theme.contrast}12;
        border-color: ${props.theme.contrast}30;
      }
    `}
`;

const FooterText = styled.p`
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: ${(props) => props.theme.contrast}60;
  text-align: center;

  a {
    color: #9074f2;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;
