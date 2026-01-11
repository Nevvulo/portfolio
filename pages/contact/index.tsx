import Head from "next/head";
import { Notice, Subtitle } from "../../components/contact/typography";
import { SocialLinks } from "../../components/generics/social-links";
import { ContactBox } from "../../components/layout/contact";
import { TopNavView } from "../../components/layout/topnav";
import { SimpleNavbar } from "../../components/navbar/simple";

export default function Contact() {
  return (
    <TopNavView>
      <SimpleNavbar title="Contact" />

      <ContactBox>
        <Subtitle color="white">Socials</Subtitle>
        <SocialLinks
          color="white"
          include={{ linkedIn: true, email: true, tiktok: true }}
          direction="row"
        />
        <Subtitle color="white">Security & Privacy</Subtitle>
        <Notice>
          Reporting a potential security vulnerability or privacy concern regarding one of my
          maintained projects? Please shoot me an e-mail by clicking the icon above.
        </Notice>
      </ContactBox>

      <Head key="contact">
        <title>Contact - Nevulo</title>
        <meta
          name="description"
          content="Get in touch with Blake. Connect via email or social media for collaboration opportunities and professional inquiries."
        />
        <meta property="og:title" content="Contact Nevulo" />
        <meta
          property="og:description"
          content="Get in touch with Blake. Connect via email or social media for collaboration opportunities and professional inquiries."
        />
        <meta property="og:url" content="https://nev.so/contact" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=Get%20in%20Touch&subtitle=Let's%20connect%20and%20collaborate"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Nevulo" />
        <meta
          name="twitter:description"
          content="Get in touch for collaboration opportunities and professional inquiries."
        />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=Get%20in%20Touch&subtitle=Let's%20connect%20and%20collaborate"
        />
      </Head>
    </TopNavView>
  );
}
