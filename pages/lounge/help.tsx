import Head from "next/head";
import styled from "styled-components";
import { useState } from "react";
import {
  HelpCircle,
  Shield,
  FileText,
  Heart,
  AlertTriangle,
  MessageCircle,
  Ban,
  Mail,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { LoungeLayout } from "../../components/lounge/layout/LoungeLayout";
import { LOUNGE_COLORS } from "../../constants/lounge";

export const getServerSideProps = () => ({ props: {} });

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How do I get access to more channels?",
    answer:
      "Become a Super Legend to unlock exclusive channels! You can support through Clerk billing, Twitch subscription, or Discord server boost. Visit /support to learn more.",
  },
  {
    question: "What are the different supporter tiers?",
    answer:
      "There are two supporter tiers: Super Legend (Tier 1) and Super Legend II (Tier 2). Each tier unlocks additional channels, features, and rewards.",
  },
  {
    question: "How do mystery boxes and rewards work?",
    answer:
      "Supporters receive monthly mystery boxes with exclusive items. You can reveal them instantly or save them to your inventory. Free members can only claim items instantly (no inventory storage).",
  },
  {
    question: "Can I change my username?",
    answer:
      "Currently, usernames cannot be changed once set. Choose wisely! This may change in future updates.",
  },
  {
    question: "What is The Jungle?",
    answer:
      "The Jungle is a shared listening room where supporters can hang out together. Your avatar appears on stage and moves slowly. Music plays in sync for everyone.",
  },
  {
    question: "How do I report a user?",
    answer:
      "Click on a user's profile and select 'Report User'. Alternatively, contact the creator directly through Discord.",
  },
];

export default function HelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <>
      <Head>
        <title>Help & Rules | nevulounge</title>
      </Head>
      <LoungeLayout channelName="Help" customIcon={HelpCircle}>
        <Container>
          <Header>
            <HeaderIcon>
              <HelpCircle size={32} />
            </HeaderIcon>
            <HeaderTitle>Help & Guidelines</HeaderTitle>
            <HeaderSubtitle>
              Everything you need to know about nevulounge
            </HeaderSubtitle>
          </Header>

          {/* Community Rules */}
          <Section>
            <SectionHeader>
              <Shield size={20} />
              Community Rules
            </SectionHeader>
            <RulesList>
              <RuleItem>
                <RuleNumber>1</RuleNumber>
                <RuleContent>
                  <RuleTitle>Be Respectful</RuleTitle>
                  <RuleText>
                    Treat everyone with respect. No harassment, hate speech,
                    discrimination, or personal attacks of any kind.
                  </RuleText>
                </RuleContent>
              </RuleItem>
              <RuleItem>
                <RuleNumber>2</RuleNumber>
                <RuleContent>
                  <RuleTitle>No Spam or Self-Promotion</RuleTitle>
                  <RuleText>
                    Don't spam messages, links, or excessive self-promotion.
                    Share content naturally in relevant conversations.
                  </RuleText>
                </RuleContent>
              </RuleItem>
              <RuleItem>
                <RuleNumber>3</RuleNumber>
                <RuleContent>
                  <RuleTitle>Keep it Safe for Work</RuleTitle>
                  <RuleText>
                    No NSFW content, gore, or disturbing material. Keep
                    discussions and media appropriate for all ages.
                  </RuleText>
                </RuleContent>
              </RuleItem>
              <RuleItem>
                <RuleNumber>4</RuleNumber>
                <RuleContent>
                  <RuleTitle>No Illegal Activity</RuleTitle>
                  <RuleText>
                    Don't share pirated content, engage in fraud, or discuss
                    illegal activities. This includes sharing others' personal
                    information.
                  </RuleText>
                </RuleContent>
              </RuleItem>
              <RuleItem>
                <RuleNumber>5</RuleNumber>
                <RuleContent>
                  <RuleTitle>Follow Channel Guidelines</RuleTitle>
                  <RuleText>
                    Each channel may have specific rules. Check channel
                    descriptions and respect their intended purpose.
                  </RuleText>
                </RuleContent>
              </RuleItem>
              <RuleItem>
                <RuleNumber>6</RuleNumber>
                <RuleContent>
                  <RuleTitle>Use Common Sense</RuleTitle>
                  <RuleText>
                    If something feels wrong, it probably is. When in doubt,
                    don't do it. Moderators have final say on rule
                    interpretations.
                  </RuleText>
                </RuleContent>
              </RuleItem>
            </RulesList>
          </Section>

          {/* Enforcement */}
          <Section>
            <SectionHeader>
              <AlertTriangle size={20} />
              Enforcement
            </SectionHeader>
            <EnforcementGrid>
              <EnforcementCard>
                <EnforcementIcon $color="#eab308">
                  <AlertTriangle size={24} />
                </EnforcementIcon>
                <EnforcementTitle>Warning</EnforcementTitle>
                <EnforcementText>
                  First-time minor infractions typically result in a warning.
                </EnforcementText>
              </EnforcementCard>
              <EnforcementCard>
                <EnforcementIcon $color="#f97316">
                  <MessageCircle size={24} />
                </EnforcementIcon>
                <EnforcementTitle>Mute</EnforcementTitle>
                <EnforcementText>
                  Repeated violations may result in temporary chat restrictions.
                </EnforcementText>
              </EnforcementCard>
              <EnforcementCard>
                <EnforcementIcon $color="#ef4444">
                  <Ban size={24} />
                </EnforcementIcon>
                <EnforcementTitle>Ban</EnforcementTitle>
                <EnforcementText>
                  Severe or repeated violations will result in permanent removal.
                </EnforcementText>
              </EnforcementCard>
            </EnforcementGrid>
          </Section>

          {/* FAQ */}
          <Section>
            <SectionHeader>
              <HelpCircle size={20} />
              Frequently Asked Questions
            </SectionHeader>
            <FAQList>
              {FAQ_ITEMS.map((item, index) => (
                <FAQCard
                  key={index}
                  $isOpen={openFAQ === index}
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                >
                  <FAQQuestion>
                    {item.question}
                    {openFAQ === index ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </FAQQuestion>
                  {openFAQ === index && <FAQAnswer>{item.answer}</FAQAnswer>}
                </FAQCard>
              ))}
            </FAQList>
          </Section>

          {/* Terms of Service Summary */}
          <Section>
            <SectionHeader>
              <FileText size={20} />
              Terms of Service
            </SectionHeader>
            <TermsCard>
              <TermsText>
                By using nevulounge, you agree to our Terms of Service. Key
                points:
              </TermsText>
              <TermsList>
                <TermsItem>
                  You must be 16 years or older to use this service
                </TermsItem>
                <TermsItem>
                  Content you post remains yours, but you grant us license to
                  display it
                </TermsItem>
                <TermsItem>
                  We may terminate accounts that violate our rules
                </TermsItem>
                <TermsItem>
                  Supporter benefits are non-refundable except as required by
                  law
                </TermsItem>
                <TermsItem>
                  We're not liable for user-generated content
                </TermsItem>
              </TermsList>
              <FullTermsLink
                href="https://nev.so/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read Full Terms of Service
                <ExternalLink size={14} />
              </FullTermsLink>
            </TermsCard>
          </Section>

          {/* Privacy */}
          <Section>
            <SectionHeader>
              <Shield size={20} />
              Privacy
            </SectionHeader>
            <PrivacyCard>
              <PrivacyText>
                We collect minimal data necessary to provide the service:
              </PrivacyText>
              <PrivacyList>
                <PrivacyItem>
                  <strong>Account info:</strong> Email, username, avatar (from
                  Discord/Twitch)
                </PrivacyItem>
                <PrivacyItem>
                  <strong>Messages:</strong> Stored to display chat history
                </PrivacyItem>
                <PrivacyItem>
                  <strong>Usage data:</strong> Basic analytics to improve the
                  service
                </PrivacyItem>
              </PrivacyList>
              <PrivacyNote>
                We never sell your data. See our full privacy policy for details.
              </PrivacyNote>
              <FullTermsLink
                href="https://nev.so/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read Full Privacy Policy
                <ExternalLink size={14} />
              </FullTermsLink>
            </PrivacyCard>
          </Section>

          {/* Contact */}
          <Section>
            <SectionHeader>
              <Mail size={20} />
              Need Help?
            </SectionHeader>
            <ContactCard>
              <ContactText>
                Have questions or need to report an issue? Reach out!
              </ContactText>
              <ContactLinks>
                <ContactLink
                  href="https://discord.gg/nevulo"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Heart size={16} />
                  Discord Server
                  <ExternalLink size={14} />
                </ContactLink>
                <ContactLink href="mailto:support@nev.so">
                  <Mail size={16} />
                  support@nev.so
                </ContactLink>
              </ContactLinks>
            </ContactCard>
          </Section>
        </Container>
      </LoungeLayout>
    </>
  );
}

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  height: 100%;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const HeaderIcon = styled.div`
  color: ${LOUNGE_COLORS.tier1};
  margin-bottom: 1rem;
`;

const HeaderTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.5rem;
`;

const HeaderSubtitle = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
`;

const Section = styled.section`
  margin-bottom: 2.5rem;
`;

const SectionHeader = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 1rem;
`;

const RulesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RuleItem = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 10px;
`;

const RuleNumber = styled.div`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${LOUNGE_COLORS.tier1};
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
`;

const RuleContent = styled.div`
  flex: 1;
`;

const RuleTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.25rem;
`;

const RuleText = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.5;
`;

const EnforcementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const EnforcementCard = styled.div`
  padding: 1.25rem;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 10px;
  text-align: center;
`;

const EnforcementIcon = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: ${(props) => props.$color}22;
  border-radius: 12px;
  color: ${(props) => props.$color};
  margin-bottom: 0.75rem;
`;

const EnforcementTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.5rem;
`;

const EnforcementText = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
`;

const FAQList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FAQCard = styled.div<{ $isOpen: boolean }>`
  padding: 1rem;
  background: ${(props) =>
    props.$isOpen ? "rgba(144, 116, 242, 0.1)" : LOUNGE_COLORS.glassBackground};
  border: 1px solid
    ${(props) =>
      props.$isOpen ? "rgba(144, 116, 242, 0.3)" : LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: rgba(144, 116, 242, 0.3);
  }
`;

const FAQQuestion = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.95rem;
  font-weight: 500;
  color: #fff;
`;

const FAQAnswer = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0.75rem 0 0;
  line-height: 1.6;
`;

const TermsCard = styled.div`
  padding: 1.25rem;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 10px;
`;

const TermsText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1rem;
`;

const TermsList = styled.ul`
  margin: 0 0 1rem;
  padding-left: 1.25rem;
`;

const TermsItem = styled.li`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
  line-height: 1.5;
`;

const FullTermsLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: ${LOUNGE_COLORS.tier1};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const PrivacyCard = styled.div`
  padding: 1.25rem;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 10px;
`;

const PrivacyText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.75rem;
`;

const PrivacyList = styled.ul`
  margin: 0 0 1rem;
  padding-left: 1.25rem;
`;

const PrivacyItem = styled.li`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
  line-height: 1.5;

  strong {
    color: rgba(255, 255, 255, 0.8);
  }
`;

const PrivacyNote = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  margin: 0 0 1rem;
`;

const ContactCard = styled.div`
  padding: 1.25rem;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 10px;
`;

const ContactText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1rem;
`;

const ContactLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const ContactLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;
