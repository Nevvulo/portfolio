import Head from "next/head";
import React from "react";
import { Notice, Subtitle } from "../../components/contact/typography";
import { SocialLinks } from "../../components/generics/social-links";
import { ContactBox } from "../../components/layout/contact";
import { MinimalView } from "../../components/layout/minimal";
import { SimpleNavbar } from "../../components/navbar/simple";

export default function Contact() {
  return (
    <MinimalView>
      <SimpleNavbar emoji="📧" title="Contact" />

      <ContactBox>
        <Subtitle>Socials</Subtitle>
        <SocialLinks include={{ linkedIn: true }} direction="row" />
        <Subtitle>Security & Privacy</Subtitle>
        <Notice>
          Reporting a potential security vulnerability or privacy concern
          regarding one of my maintained projects? Please shoot me an e-mail by
          clicking the icon above.
        </Notice>
      </ContactBox>

      <Head key="contact">
        <title>Contact - Nevulo</title>
        <meta property="og:title" content="Get in touch with Nevulo" />
        <meta
          property="og:description"
          content="I'm Blake, a software engineer based in Melbourne, Australia. Click here to get in contact with me, or have a look at my social accounts!"
        />
      </Head>
    </MinimalView>
  );
}
