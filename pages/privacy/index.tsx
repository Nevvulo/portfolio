import Head from "next/head";
import styled from "styled-components";
import { TopNavView } from "../../components/layout/topnav";
import { SimpleNavbar } from "../../components/navbar/simple";

export default function Privacy() {
  return (
    <TopNavView>
      <SimpleNavbar title="Privacy Policy" />

      <Container>
        <LastUpdated>Last updated: December 2024</LastUpdated>

        <Section>
          <SectionTitle>1. Introduction</SectionTitle>
          <Paragraph>
            This Privacy Policy explains how Blake (&quot;Nevulo&quot;, &quot;I&quot;,
            &quot;me&quot;, or &quot;my&quot;) collects, uses, and protects your personal
            information when you use nev.so and its associated services, including the Nevulounge
            community platform.
          </Paragraph>
          <Paragraph>
            I am an individual operator based in Melbourne, Victoria, Australia. By using this
            website, you consent to the practices described in this policy.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>2. Information I Collect</SectionTitle>

          <SubSection>
            <SubTitle>Account Information</SubTitle>
            <Paragraph>When you create an account, I collect:</Paragraph>
            <List>
              <ListItem>Email address</ListItem>
              <ListItem>Display name</ListItem>
              <ListItem>Profile picture (if provided)</ListItem>
              <ListItem>Account preferences and settings</ListItem>
            </List>
          </SubSection>

          <SubSection>
            <SubTitle>Connected Accounts</SubTitle>
            <Paragraph>If you connect third-party accounts, I receive:</Paragraph>
            <List>
              <ListItem>
                <strong>Discord:</strong> User ID, username, avatar, server roles, and booster
                status
              </ListItem>
              <ListItem>
                <strong>Twitch:</strong> User ID, username, and subscription tier (if applicable)
              </ListItem>
              <ListItem>
                <strong>Google:</strong> Email address and profile information
              </ListItem>
            </List>
          </SubSection>

          <SubSection>
            <SubTitle>User-Generated Content</SubTitle>
            <Paragraph>When using the Nevulounge, I collect:</Paragraph>
            <List>
              <ListItem>Chat messages and their content</ListItem>
              <ListItem>Profile bio and banner images</ListItem>
              <ListItem>Presence information (online status, last seen)</ListItem>
              <ListItem>Notification preferences</ListItem>
            </List>
          </SubSection>

          <SubSection>
            <SubTitle>Payment Information</SubTitle>
            <Paragraph>
              If you become a supporter, payment processing is handled by Stripe through Clerk. I do
              not directly store your credit card details. I receive confirmation of your
              subscription status and billing history.
            </Paragraph>
          </SubSection>

          <SubSection>
            <SubTitle>Automatically Collected Information</SubTitle>
            <List>
              <ListItem>Basic analytics data via Vercel Analytics (page views, referrer)</ListItem>
              <ListItem>Performance metrics via Vercel Speed Insights</ListItem>
              <ListItem>Device type and browser information</ListItem>
            </List>
          </SubSection>
        </Section>

        <Section>
          <SectionTitle>3. How I Use Your Information</SectionTitle>
          <Paragraph>I use your information to:</Paragraph>
          <List>
            <ListItem>Provide and maintain the services</ListItem>
            <ListItem>Authenticate your identity and manage your account</ListItem>
            <ListItem>Process supporter subscriptions and provide tier-based access</ListItem>
            <ListItem>Sync supporter status across Discord and Twitch</ListItem>
            <ListItem>Display your profile and messages in the Nevulounge</ListItem>
            <ListItem>Send service-related notifications (if enabled)</ListItem>
            <ListItem>Moderate content and enforce community guidelines</ListItem>
            <ListItem>Improve the website and services</ListItem>
            <ListItem>Respond to your inquiries and support requests</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>4. Third-Party Services</SectionTitle>
          <Paragraph>I use the following third-party services to operate this website:</Paragraph>
          <List>
            <ListItem>
              <strong>Clerk</strong> — Authentication and user management (
              <LinkText href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </LinkText>
              )
            </ListItem>
            <ListItem>
              <strong>Convex</strong> — Real-time database for Nevulounge (
              <LinkText
                href="https://www.convex.dev/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </LinkText>
              )
            </ListItem>
            <ListItem>
              <strong>Upstash</strong> — Redis caching for performance (
              <LinkText
                href="https://upstash.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </LinkText>
              )
            </ListItem>
            <ListItem>
              <strong>Vercel</strong> — Hosting and analytics (
              <LinkText
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </LinkText>
              )
            </ListItem>
            <ListItem>
              <strong>Stripe</strong> — Payment processing (
              <LinkText href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </LinkText>
              )
            </ListItem>
            <ListItem>
              <strong>Discord API</strong> — Account linking and role sync (
              <LinkText
                href="https://discord.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </LinkText>
              )
            </ListItem>
            <ListItem>
              <strong>Twitch API</strong> — Subscription detection (
              <LinkText
                href="https://www.twitch.tv/p/legal/privacy-notice/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </LinkText>
              )
            </ListItem>
          </List>
          <Paragraph>
            These services have their own privacy policies governing their use of your data. I
            encourage you to review them.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>5. Data Retention</SectionTitle>
          <Paragraph>
            I retain your personal information for as long as your account is active or as needed to
            provide services. Specifically:
          </Paragraph>
          <List>
            <ListItem>
              <strong>Account data:</strong> Retained until you request account deletion
            </ListItem>
            <ListItem>
              <strong>Chat messages:</strong> Retained indefinitely for community history and
              moderation purposes
            </ListItem>
            <ListItem>
              <strong>Analytics data:</strong> Retained according to Vercel&apos;s retention
              policies
            </ListItem>
            <ListItem>
              <strong>Cached data:</strong> Automatically expires after 7 days
            </ListItem>
          </List>
          <Paragraph>
            Upon account deletion, your profile information will be removed, but chat messages may
            be retained in an anonymised form.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>6. Your Rights</SectionTitle>
          <Paragraph>
            Under the Australian Privacy Act 1988 and general privacy principles, you have the right
            to:
          </Paragraph>
          <List>
            <ListItem>
              <strong>Access:</strong> Request a copy of the personal information I hold about you
            </ListItem>
            <ListItem>
              <strong>Correction:</strong> Request correction of inaccurate or incomplete
              information
            </ListItem>
            <ListItem>
              <strong>Deletion:</strong> Request deletion of your account and associated personal
              data
            </ListItem>
            <ListItem>
              <strong>Portability:</strong> Request your data in a portable format
            </ListItem>
            <ListItem>
              <strong>Objection:</strong> Object to certain processing of your data
            </ListItem>
          </List>
          <Paragraph>
            To exercise these rights, contact me at{" "}
            <LinkText href="mailto:support@nev.so">support@nev.so</LinkText>. I will respond within
            30 days.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>7. Cookies and Tracking</SectionTitle>
          <Paragraph>
            I use essential cookies required for authentication and site functionality:
          </Paragraph>
          <List>
            <ListItem>
              <strong>Session cookies:</strong> Managed by Clerk for authentication
            </ListItem>
            <ListItem>
              <strong>Preference cookies:</strong> To remember your theme and settings
            </ListItem>
          </List>
          <Paragraph>
            I do not use advertising cookies or sell your data to third parties. Vercel Analytics
            collects anonymous, aggregated data that does not personally identify you.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>8. Data Security</SectionTitle>
          <Paragraph>
            I implement reasonable security measures to protect your personal information,
            including:
          </Paragraph>
          <List>
            <ListItem>HTTPS encryption for all data in transit</ListItem>
            <ListItem>Secure authentication via Clerk</ListItem>
            <ListItem>Access controls for administrative functions</ListItem>
            <ListItem>Regular security updates and monitoring</ListItem>
          </List>
          <Paragraph>
            However, no method of transmission over the internet is 100% secure. I cannot guarantee
            absolute security.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>9. Children&apos;s Privacy</SectionTitle>
          <Paragraph>
            This website and the Nevulounge are not intended for users under 16 years of age. I do
            not knowingly collect personal information from children under 16. If you believe a
            child under 16 has provided me with personal information, please contact me at{" "}
            <LinkText href="mailto:support@nev.so">support@nev.so</LinkText> so I can delete such
            information.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>10. International Data Transfers</SectionTitle>
          <Paragraph>
            Your data may be processed in countries outside Australia where our service providers
            operate (including the United States). These providers are contractually obligated to
            protect your data in accordance with applicable laws.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>11. Changes to This Policy</SectionTitle>
          <Paragraph>
            I may update this Privacy Policy from time to time. Significant changes will be
            communicated via the website or email notification. Your continued use of the services
            after changes constitutes acceptance of the updated policy.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>12. Contact</SectionTitle>
          <Paragraph>
            If you have questions about this Privacy Policy or wish to exercise your privacy rights,
            contact me at:
          </Paragraph>
          <ContactInfo>
            <Paragraph>
              <strong>Email:</strong>{" "}
              <LinkText href="mailto:support@nev.so">support@nev.so</LinkText>
            </Paragraph>
            <Paragraph>
              <strong>Location:</strong> Melbourne, Victoria, Australia
            </Paragraph>
          </ContactInfo>
        </Section>
      </Container>

      <Head key="privacy">
        <title>Privacy Policy - Nevulo</title>
        <meta
          name="description"
          content="Privacy Policy for nev.so and Nevulounge. Learn how we collect, use, and protect your personal information."
        />
        <meta property="og:title" content="Privacy Policy - Nevulo" />
        <meta
          property="og:description"
          content="Privacy Policy for nev.so and Nevulounge. Learn how we collect, use, and protect your personal information."
        />
        <meta property="og:url" content="https://nev.so/privacy" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=Privacy%20Policy&subtitle=How%20we%20handle%20your%20data"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Privacy Policy - Nevulo" />
        <meta name="twitter:description" content="Privacy Policy for nev.so and Nevulounge." />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=Privacy%20Policy&subtitle=How%20we%20handle%20your%20data"
        />
      </Head>
    </TopNavView>
  );
}

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  color: ${(props) => props.theme.contrast};

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const LastUpdated = styled.p`
  font-size: 0.875rem;
  color: ${(props) => props.theme.textColor};
  margin-bottom: 2rem;
  font-style: italic;
`;

const Section = styled.section`
  margin-bottom: 2.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${(props) => props.theme.postBackground};
`;

const SubSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SubTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.5rem;
`;

const Paragraph = styled.p`
  font-size: 0.9375rem;
  line-height: 1.7;
  color: ${(props) => props.theme.textColor};
  margin: 0 0 1rem;
`;

const List = styled.ul`
  margin: 0 0 1rem;
  padding-left: 1.5rem;
`;

const ListItem = styled.li`
  font-size: 0.9375rem;
  line-height: 1.7;
  color: ${(props) => props.theme.textColor};
  margin-bottom: 0.5rem;

  strong {
    color: ${(props) => props.theme.contrast};
  }
`;

const LinkText = styled.a`
  color: ${(props) => props.theme.linkColor};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const ContactInfo = styled.div`
  background: ${(props) => props.theme.postBackground};
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;

  p {
    margin-bottom: 0.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }
`;
