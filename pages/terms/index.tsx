import Head from "next/head";
import styled from "styled-components";
import { TopNavView } from "../../components/layout/topnav";
import { SimpleNavbar } from "../../components/navbar/simple";

export default function Terms() {
  return (
    <TopNavView>
      <SimpleNavbar title="Terms of Service" />

      <Container>
        <LastUpdated>Last updated: December 2024</LastUpdated>

        <Section>
          <SectionTitle>1. Acceptance of Terms</SectionTitle>
          <Paragraph>
            By accessing or using nev.so and its associated services, including the Nevulounge
            community platform (collectively, the &quot;Services&quot;), you agree to be bound by
            these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you must
            not use the Services.
          </Paragraph>
          <Paragraph>
            These Services are operated by Blake (&quot;Nevulo&quot;, &quot;I&quot;, &quot;me&quot;,
            or &quot;my&quot;), an individual based in Melbourne, Victoria, Australia.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>2. Eligibility</SectionTitle>
          <Paragraph>
            You must be at least <strong>16 years of age</strong> to use these Services. By using
            the Services, you represent and warrant that you meet this age requirement.
          </Paragraph>
          <Paragraph>
            If you are using the Services on behalf of an organisation, you represent that you have
            the authority to bind that organisation to these Terms.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>3. Account Registration</SectionTitle>
          <Paragraph>
            To access certain features, you must create an account. When registering, you agree to:
          </Paragraph>
          <List>
            <ListItem>Provide accurate and complete information</ListItem>
            <ListItem>Maintain the security of your account credentials</ListItem>
            <ListItem>Promptly update any changes to your information</ListItem>
            <ListItem>Accept responsibility for all activities under your account</ListItem>
            <ListItem>Maintain only one account per person</ListItem>
          </List>
          <Paragraph>
            I reserve the right to suspend or terminate accounts that violate these Terms or are
            used for fraudulent purposes.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>4. Nevulounge Community</SectionTitle>
          <Paragraph>
            The Nevulounge is an exclusive community platform for supporters. By participating, you
            agree to:
          </Paragraph>
          <SubSection>
            <SubTitle>Community Guidelines</SubTitle>
            <List>
              <ListItem>
                Treat all members with respect; no harassment, hate speech, or discrimination
              </ListItem>
              <ListItem>
                Refrain from spam, excessive self-promotion, or disruptive behaviour
              </ListItem>
              <ListItem>
                Keep all content safe for work; no NSFW, gore, or disturbing material
              </ListItem>
              <ListItem>Not engage in or promote illegal activities</ListItem>
              <ListItem>
                Not share others&apos; personal information without consent (doxxing)
              </ListItem>
              <ListItem>Follow channel-specific rules and intended purposes</ListItem>
            </List>
          </SubSection>
          <SubSection>
            <SubTitle>Enforcement</SubTitle>
            <Paragraph>
              Violations may result in warnings, temporary mutes, or permanent bans at my sole
              discretion. Moderator decisions are final. Severe violations (harassment, illegal
              content, threats) may result in immediate permanent removal without warning.
            </Paragraph>
          </SubSection>
        </Section>

        <Section>
          <SectionTitle>5. User Content</SectionTitle>
          <Paragraph>
            You retain ownership of content you submit (&quot;User Content&quot;), including
            messages, profile information, and uploaded media. By submitting User Content, you grant
            me a non-exclusive, worldwide, royalty-free licence to:
          </Paragraph>
          <List>
            <ListItem>Display, distribute, and store your content as part of the Services</ListItem>
            <ListItem>Create backups and archives for operational purposes</ListItem>
            <ListItem>Modify formatting for display across different devices</ListItem>
          </List>
          <Paragraph>
            You represent that you have all necessary rights to submit User Content and that it does
            not infringe any third-party rights. I may remove User Content that violates these Terms
            without notice.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>6. Supporter Subscriptions</SectionTitle>
          <Paragraph>
            The Services offer paid supporter tiers (&quot;Super Legend&quot; and &quot;Super Legend
            II&quot;) that provide additional features and access.
          </Paragraph>
          <SubSection>
            <SubTitle>Payment and Billing</SubTitle>
            <List>
              <ListItem>
                Subscriptions are processed through Clerk Billing (powered by Stripe)
              </ListItem>
              <ListItem>
                Supporter status may also be granted through Twitch subscriptions or Discord server
                boosts
              </ListItem>
              <ListItem>Prices are displayed in your local currency where supported</ListItem>
              <ListItem>Subscriptions automatically renew unless cancelled</ListItem>
            </List>
          </SubSection>
          <SubSection>
            <SubTitle>Refunds</SubTitle>
            <Paragraph>
              Supporter subscriptions are generally non-refundable. However, this does not affect
              your rights under the Australian Consumer Law. If you believe you are entitled to a
              refund under consumer protection laws, please contact{" "}
              <LinkText href="mailto:support@nev.so">support@nev.so</LinkText>.
            </Paragraph>
          </SubSection>
          <SubSection>
            <SubTitle>Cancellation</SubTitle>
            <Paragraph>
              You may cancel your subscription at any time through your account settings. You will
              retain access to supporter features until the end of your current billing period.
            </Paragraph>
          </SubSection>
        </Section>

        <Section>
          <SectionTitle>7. Blog and Educational Content</SectionTitle>
          <Paragraph>
            The blog and educational content on this website are provided for informational purposes
            only. While I strive for accuracy:
          </Paragraph>
          <List>
            <ListItem>Content represents my personal views and experiences</ListItem>
            <ListItem>Technical information may become outdated</ListItem>
            <ListItem>
              Nothing constitutes professional, legal, financial, or medical advice
            </ListItem>
            <ListItem>You should independently verify information before relying on it</ListItem>
            <ListItem>I am not liable for any decisions made based on this content</ListItem>
          </List>
          <Paragraph>
            If you find errors or outdated information, please let me know at{" "}
            <LinkText href="mailto:support@nev.so">support@nev.so</LinkText> so I can correct it.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>8. Projects and Third-Party Software</SectionTitle>
          <Paragraph>
            This website showcases various personal and professional projects. Please note:
          </Paragraph>
          <List>
            <ListItem>Each project may have its own terms, licences, and privacy policies</ListItem>
            <ListItem>
              Projects for employers or clients are subject to their respective terms
            </ListItem>
            <ListItem>
              Open-source projects are governed by their specific licences (e.g., MIT, GPL)
            </ListItem>
            <ListItem>
              Links to external projects or services are provided for convenience; I am not
              responsible for their content or practices
            </ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>9. Intellectual Property</SectionTitle>
          <Paragraph>
            Unless otherwise stated, I own or licence all intellectual property rights in the
            Services, including:
          </Paragraph>
          <List>
            <ListItem>Website design, code, and functionality</ListItem>
            <ListItem>Original written content and blog posts</ListItem>
            <ListItem>Graphics, logos, and branding (Nevulo, Nevulounge)</ListItem>
            <ListItem>Custom features and implementations</ListItem>
          </List>
          <Paragraph>
            You may not reproduce, distribute, or create derivative works without permission, except
            as permitted by fair use or with explicit written consent.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>10. Disclaimer of Warranties</SectionTitle>
          <Paragraph>
            The Services are provided &quot;as is&quot; and &quot;as available&quot; without
            warranties of any kind, either express or implied, including but not limited to:
          </Paragraph>
          <List>
            <ListItem>Warranties of merchantability or fitness for a particular purpose</ListItem>
            <ListItem>
              Warranties that the Services will be uninterrupted, secure, or error-free
            </ListItem>
            <ListItem>Warranties regarding the accuracy or reliability of any content</ListItem>
          </List>
          <Paragraph>
            This is a personal project operated in my spare time. While I strive to maintain quality
            and availability, I cannot guarantee continuous service.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>11. Limitation of Liability</SectionTitle>
          <Paragraph>
            To the maximum extent permitted by law, I shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from:
          </Paragraph>
          <List>
            <ListItem>Your use or inability to use the Services</ListItem>
            <ListItem>Any User Content or conduct of third parties</ListItem>
            <ListItem>Unauthorised access to your data</ListItem>
            <ListItem>Any errors, bugs, or service interruptions</ListItem>
          </List>
          <Paragraph>
            My total liability for any claims shall not exceed the amount you paid (if any) for the
            Services in the 12 months preceding the claim.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>12. Australian Consumer Law</SectionTitle>
          <Highlight>
            <Paragraph>
              Nothing in these Terms excludes, restricts, or modifies any rights you may have under
              the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010) or
              other consumer protection laws that cannot be excluded by agreement.
            </Paragraph>
            <Paragraph>
              If you are an Australian consumer, you are entitled to certain guarantees under the
              Australian Consumer Law, including guarantees that services will be provided with due
              care and skill.
            </Paragraph>
          </Highlight>
        </Section>

        <Section>
          <SectionTitle>13. Indemnification</SectionTitle>
          <Paragraph>
            You agree to indemnify and hold me harmless from any claims, damages, losses, or
            expenses (including legal fees) arising from:
          </Paragraph>
          <List>
            <ListItem>Your use of the Services</ListItem>
            <ListItem>Your User Content</ListItem>
            <ListItem>Your violation of these Terms</ListItem>
            <ListItem>Your violation of any third-party rights</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>14. Termination</SectionTitle>
          <Paragraph>
            I may suspend or terminate your access to the Services at any time, with or without
            cause, with or without notice. Reasons for termination may include:
          </Paragraph>
          <List>
            <ListItem>Violation of these Terms or community guidelines</ListItem>
            <ListItem>Fraudulent, abusive, or illegal conduct</ListItem>
            <ListItem>Extended periods of inactivity</ListItem>
            <ListItem>At my discretion for any other reason</ListItem>
          </List>
          <Paragraph>
            Upon termination, your right to use the Services ceases immediately. Sections that
            should survive termination (Limitation of Liability, Indemnification, Governing Law)
            will continue in effect.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>15. Changes to Terms</SectionTitle>
          <Paragraph>
            I may modify these Terms at any time. Material changes will be communicated via the
            website or email. Your continued use of the Services after changes constitutes
            acceptance of the new Terms.
          </Paragraph>
          <Paragraph>I encourage you to review these Terms periodically.</Paragraph>
        </Section>

        <Section>
          <SectionTitle>16. Governing Law</SectionTitle>
          <Paragraph>
            These Terms are governed by the laws of Victoria, Australia. Any disputes shall be
            resolved in the courts of Victoria, Australia, unless consumer protection laws in your
            jurisdiction provide otherwise.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>17. Severability</SectionTitle>
          <Paragraph>
            If any provision of these Terms is found to be unenforceable, the remaining provisions
            will continue in full force and effect. The unenforceable provision will be modified to
            the minimum extent necessary to make it enforceable.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>18. Entire Agreement</SectionTitle>
          <Paragraph>
            These Terms, together with the Privacy Policy, constitute the entire agreement between
            you and me regarding the Services and supersede any prior agreements.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>19. Contact</SectionTitle>
          <Paragraph>If you have questions about these Terms, please contact me at:</Paragraph>
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

      <Head key="terms">
        <title>nevulo - Terms</title>
        <meta
          name="description"
          content="Terms of Service for nev.so and Nevulounge. Read our terms governing the use of our services."
        />
        <meta property="og:title" content="nevulo - Terms" />
        <meta
          property="og:description"
          content="Terms of Service for nev.so and Nevulounge. Read our terms governing the use of our services."
        />
        <meta property="og:url" content="https://nev.so/terms" />
        <meta property="og:site_name" content="nevulo" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=Terms%20of%20Service&subtitle=Rules%20and%20guidelines%20for%20using%20our%20services"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="nevulo - Terms" />
        <meta name="twitter:description" content="Terms of Service for nev.so and Nevulounge." />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=Terms%20of%20Service&subtitle=Rules%20and%20guidelines%20for%20using%20our%20services"
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

  strong {
    color: ${(props) => props.theme.contrast};
  }
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
`;

const LinkText = styled.a`
  color: ${(props) => props.theme.linkColor};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const Highlight = styled.div`
  background: ${(props) => props.theme.postBackground};
  border-left: 4px solid ${(props) => props.theme.linkColor};
  padding: 1rem 1.5rem;
  border-radius: 0 8px 8px 0;
  margin: 1rem 0;

  p:last-child {
    margin-bottom: 0;
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
