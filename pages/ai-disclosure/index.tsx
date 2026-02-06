import { useQuery as useRQ } from "@tanstack/react-query";
import { ArrowRight, Bot, Calendar, CheckCircle, Eye, Search, Sparkles } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import styled from "styled-components";
import nevuloImg from "../../assets/img/nevulo.jpg";
import { TopNavView } from "../../components/layout/topnav";
import { SimpleNavbar } from "../../components/navbar/simple";
import { getPreLLMPosts } from "@/src/db/client/queries";

export default function AIDisclosure() {
  const { data: preLLMPosts } = useRQ({
    queryKey: ["preLLMPosts"],
    queryFn: () => getPreLLMPosts(6),
    staleTime: 60_000,
  });

  return (
    <TopNavView>
      <SimpleNavbar />

      <Container>
        <Header>
          <HeaderIconWrapper>
            <HidingPhoto src={nevuloImg.src} alt="" />
            <HeaderIcon>
              <Bot size={32} />
            </HeaderIcon>
          </HeaderIconWrapper>
          <HeaderTitle>AI Disclosure</HeaderTitle>
          <HeaderSubtitle>Transparency about how content is created</HeaderSubtitle>
        </Header>

        <InfoBox>
          <InfoBoxIcon>
            <CheckCircle size={20} />
          </InfoBoxIcon>
          <InfoBoxContent>
            <InfoBoxTitle>No clankers here! I do not use AI to generate my content.</InfoBoxTitle>
            <InfoBoxText>
              Every article, tutorial, opinion piece, etc. on this site is written by me. I'm
              passionate about teaching difficult concepts to real people, and creating content
              which represents my unique (sometimes strange) style.
            </InfoBoxText>
          </InfoBoxContent>
        </InfoBox>

        <Section>
          <SectionHeader>Disclosures on learning content</SectionHeader>
          <Paragraph>
            At the bottom of the credits in articles, you'll see small writing disclosing exactly
            how the content you're reading was produced. Whether AI was or wasn't involved (even in
            a small way), you'll see three distinct disclosures, explained below:
          </Paragraph>
        </Section>

        <BadgeSection>
          <BadgeCard>
            <BadgeHeader>
              <BadgeIconWrapper $variant="none">
                <Bot size={16} />
              </BadgeIconWrapper>
              <BadgeTitle>Written without AI assistance</BadgeTitle>
            </BadgeHeader>
            <BadgeDescription>
              <b>The vast majority of content on this site has no AI involvement whatsoever</b>.
              <br />
              There are plenty of articles available now that were written prior to the rise of
              large language models. I'm proud to continue putting in the same amount of effort and
              remain committed to authentic, human-created content.
              <br />
            </BadgeDescription>
            <BadgeNote>
              When you see this status, you can be confident the content was written, edited, and
              refined entirely by human effort.
            </BadgeNote>
          </BadgeCard>

          <BadgeCard>
            <BadgeHeader>
              <BadgeIconWrapper $variant="reviewed">
                <Eye size={16} />
              </BadgeIconWrapper>
              <BadgeTitle>AI-reviewed for clarity</BadgeTitle>
            </BadgeHeader>
            <BadgeDescription>
              In rare cases, I may use AI tools to review my writing for grammar, spelling
              corrections, clarity improvements in technical explanations, and formatting
              consistency.
              <br />
              <br />
              After completing a draft, I'll use one of the latest AI models (ie. Opus 4.5) to act
              as a proofreader & flow checker.
              <br />
              <br />
              My main workflow involves writing the entire content myself, and using an AI model for
              a few minutes for discoverability on improvements.
              <br />
            </BadgeDescription>
            <BadgeNote>
              <strong>This is fundamentally different from AI-generated content.</strong> Think of
              it like using a spell-checker or asking a colleague to proofread. The AI does not
              contribute ideas, opinions, or original content. The substance, voice, and perspective
              remain entirely mine.
            </BadgeNote>
          </BadgeCard>

          <BadgeCard>
            <BadgeHeader>
              <BadgeIconWrapper $variant="assisted">
                <Sparkles size={16} />
              </BadgeIconWrapper>
              <BadgeTitle>AI-assisted (&lt;10% content)</BadgeTitle>
            </BadgeHeader>
            <BadgeDescription>
              For the sake of authenticity and value, I avoid AI involvement in writing.
              <br />
              <br />
              On very rare occasions, AI tools may have influenced a small portion (less than 10%)
              of the content. This might include helping phrase a particularly tricky technical
              explanation, suggesting alternative ways to structure a complex paragraph, or
              assisting with boilerplate code examples.
            </BadgeDescription>
            <BadgeNote>
              I do not use the final result from any LLM directly. I carefully consider suggestions,
              consult other sources, ensuring what comes out is what I wanted to convey.
            </BadgeNote>
          </BadgeCard>
        </BadgeSection>

        <Section>
          <SectionHeader>Why does this matter in the first place?</SectionHeader>
          <Paragraph>
            As AI becomes more prevalent, and the curiosity goes up around what is genuinely
            authentic, I want to provide the highest amount of transparency I can to readers to
            maintain trust.
            <br />
            <br />
            Trust is one thing (you can choose whether you want to trust or not!), but your
            experience also matters to me. I want everybody (human or bot, I guess), to have an
            exceptional experience, and I work really hard to make sure that happens.
          </Paragraph>
        </Section>

        <Section>
          <SectionHeader>What are my general thoughts on AI?</SectionHeader>
          <Paragraph>
            In the rough landscape we're in now, with autocomplete at every corner, and AI shoved
            down our throats, it's time for something different.
            <br />
            <br />
            Authenticity doesn't just <i>matter</i>, it's all we've got, what with "dead internet
            theory", and a storm of "AI slop".
          </Paragraph>
          <Paragraph>
            <i>Life</i> is special. Provided you're not a bot reading this, we shouldn't forget what
            made the Internet so great in the first place; the ability to connect, share knowledge,
            explore.
          </Paragraph>
          <Paragraph>
            That's why I'm committed to continue creating content that actively fights against
            delegating to AI.
            <br />
            I'm worried about a world of "abundance", where any possible data format can be
            generated in any possible permutation with enough effort. More than anything, I just
            want to continue providing and growing the content that readers know, and may prefer.
            <br />
            <br />
            I've spent years, nearly a decade building up my software engineering knowledge, working
            at various companies, building hundreds of tools in that time. It has been hard as hell.
            <br />
            <br />
            But, in a new world with AI, there's just a lot of confusion. Can I use AI to help me in
            my workflow? Should I? Defining and learning what is acceptable, and what isn't. Perhaps
            there's <i>no</i> use case for LLMs and this is a bigger problem than it seems.
            <br />
            <br />
            Though it's easy to generate whatever result you need, I'm hedging my bets on the idea
            that quality, <i>care</i>, and love, will prevail.
          </Paragraph>
        </Section>

        {preLLMPosts && preLLMPosts.length > 0 && (
          <PreLLMSection>
            <PreLLMHeader>
              <Calendar size={20} />
              <span>Need 100% guarantee? Content released before 2023</span>
            </PreLLMHeader>
            <PreLLMDescription>
              ChatGPT was launched on November 30th, 2022. <br />
              These articles were published before that time, when large language models weren't
              widely available or sophisticated.
            </PreLLMDescription>
            <PreLLMGrid>
              {preLLMPosts.map((post) => (
                <PreLLMCard key={post.id} href={`/blog/${post.slug}`}>
                  <PreLLMCardTitle>{post.title}</PreLLMCardTitle>
                  <PreLLMCardDate>
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </PreLLMCardDate>
                  <PreLLMCardArrow>
                    <ArrowRight size={14} />
                  </PreLLMCardArrow>
                </PreLLMCard>
              ))}
            </PreLLMGrid>
          </PreLLMSection>
        )}

        <Section>
          <SectionHeader>Questions?</SectionHeader>
          <Paragraph>
            If you have questions about any specific article or my content creation process, feel
            free to reach out at <LinkText href="mailto:support@nev.so">support@nev.so</LinkText>.
          </Paragraph>
        </Section>

        <LastUpdated>Last updated: January 2026</LastUpdated>
      </Container>

      <Head key="ai-disclosure">
        <title>nevulo - AI Disclosure</title>
        <meta
          name="description"
          content="Learn about how AI tools are (and aren't) used in creating content on nev.so. Committed to authentic, human-written content."
        />
        <meta property="og:title" content="nevulo - AI Disclosure" />
        <meta
          property="og:description"
          content="Learn about how AI tools are (and aren't) used in creating content on nev.so. Committed to authentic, human-written content."
        />
        <meta property="og:url" content="https://nev.so/ai-disclosure" />
        <meta property="og:site_name" content="nevulo" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=AI%20Disclosure&subtitle=Commitment%20to%20authentic%20content"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="nevulo - AI Disclosure" />
        <meta
          name="twitter:description"
          content="Learn about how AI tools are (and aren't) used in creating content on nev.so."
        />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=AI%20Disclosure&subtitle=Commitment%20to%20authentic%20content"
        />
      </Head>
    </TopNavView>
  );
}

const Container = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem;
  color: ${(props) => props.theme.contrast};

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const HeaderIconWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  isolation: isolate;
`;

const HidingPhoto = styled.img`
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  transform: rotate(20deg);
  top: -27px;
  right: -23px;
  z-index: 0;
  border: 2px solid rgba(144, 116, 242, 0.3);
  opacity: 0.9;
`;

const HeaderIcon = styled.div`
  position: relative;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: #1a1a2e;
  border: 1px solid rgba(144, 116, 242, 0.2);
  border-radius: 16px;
  color: #9074f2;
`;

const HeaderTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: ${(props) => props.theme.contrast};
`;

const HeaderSubtitle = styled.p`
  font-size: 1rem;
  color: ${(props) => props.theme.textColor};
  margin: 0;
  opacity: 0.7;
`;

const InfoBox = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(76, 175, 80, 0.08);
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-radius: 12px;
  margin-bottom: 2.5rem;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const InfoBoxIcon = styled.div`
  flex-shrink: 0;
  color: #4caf50;
  margin-top: 2px;
`;

const InfoBoxContent = styled.div`
  flex: 1;
`;

const InfoBoxTitle = styled.p`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.5rem;
`;

const InfoBoxText = styled.p`
  font-size: 0.875rem;
  line-height: 1.6;
  color: ${(props) => props.theme.textColor};
  margin: 0;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionHeader = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 1rem;
`;

const Paragraph = styled.p`
  font-size: 0.9375rem;
  line-height: 1.7;
  color: ${(props) => props.theme.textColor};
  margin: 0 0 1rem;
`;

const List = styled.ul`
  margin: 0 0 1rem;
  padding-left: 0;
  list-style: none;
`;

const ListItem = styled.li`
  font-size: 0.9375rem;
  line-height: 1.7;
  color: ${(props) => props.theme.textColor};
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.6em;
    width: 6px;
    height: 6px;
    background: rgba(144, 116, 242, 0.5);
    border-radius: 50%;
  }

  strong {
    color: ${(props) => props.theme.contrast};
  }
`;

const BadgeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
`;

const BadgeCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
`;

const BadgeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const BadgeIconWrapper = styled.div<{ $variant: "none" | "reviewed" | "assisted" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;

  ${(p) => {
    switch (p.$variant) {
      case "none":
        return `
          background: rgba(128, 128, 128, 0.15);
          border: 1px solid rgba(128, 128, 128, 0.25);
          color: #888;
        `;
      case "reviewed":
        return `
          background: rgba(100, 149, 237, 0.15);
          border: 1px solid rgba(100, 149, 237, 0.25);
          color: #6495ed;
        `;
      case "assisted":
        return `
          background: rgba(255, 193, 7, 0.15);
          border: 1px solid rgba(255, 193, 7, 0.25);
          color: #ffc107;
        `;
    }
  }}
`;

const BadgeTitle = styled.h3`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0;
`;

const BadgeDescription = styled.p`
  font-size: 0.875rem;
  line-height: 1.6;
  color: ${(props) => props.theme.textColor};
  margin: 0 0 0.75rem;
`;

const BadgeNote = styled.p`
  font-size: 0.8125rem;
  line-height: 1.6;
  color: ${(props) => props.theme.textColor};
  margin: 0;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  opacity: 0.8;

  strong {
    color: ${(props) => props.theme.contrast};
  }
`;

const PreLLMSection = styled.div`
  background: rgba(144, 116, 242, 0.05);
  border: 1px solid rgba(144, 116, 242, 0.15);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2.5rem;
`;

const PreLLMHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin-bottom: 0.5rem;

  svg {
    color: #9074f2;
  }
`;

const PreLLMDescription = styled.p`
  font-size: 0.8125rem;
  line-height: 1.5;
  color: ${(props) => props.theme.textColor};
  margin: 0 0 1.25rem;
  opacity: 0.7;
`;

const PreLLMGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
`;

const PreLLMCard = styled(Link)`
  display: block;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: rgba(144, 116, 242, 0.1);
    border-color: rgba(144, 116, 242, 0.3);
  }
`;

const PreLLMCardTitle = styled.h4`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.375rem;
  line-height: 1.4;
  padding-right: 1.5rem;
`;

const PreLLMCardDate = styled.span`
  font-size: 0.6875rem;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const PreLLMCardArrow = styled.span`
  position: absolute;
  top: 0.875rem;
  right: 0.875rem;
  color: ${(props) => props.theme.textColor};
  opacity: 0.3;
  transition: all 0.2s ease;

  ${PreLLMCard}:hover & {
    opacity: 0.7;
    color: #9074f2;
    transform: translateX(2px);
  }
`;

const LinkText = styled.a`
  color: #9074f2;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const LastUpdated = styled.p`
  font-size: 0.75rem;
  color: ${(props) => props.theme.textColor};
  margin: 2rem 0 0;
  text-align: center;
  opacity: 0.5;
`;
