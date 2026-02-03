import { UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import NevuloLogo from "../../assets/svg/nevulo-huge-bold-svg.svg";
import { SupporterBadges } from "../badges/supporter-badges";
import { ROUTES } from "../../constants/routes";

interface AuthenticatedNavbarProps {
  hideBadges?: boolean;
}

export function AuthenticatedNavbar({ hideBadges = false }: AuthenticatedNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Close on escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <NavWrapper>
      <NavContent>
        <LeftSection>
          <Link href="/" style={{ textDecoration: "none" }}>
            <LogoContainer>
              <Image src={NevuloLogo} alt="Nevulo" width={20} height={20} />
              <LogoText>nevulo</LogoText>
            </LogoContainer>
          </Link>
        </LeftSection>

        <RightSection ref={menuRef}>
          {!hideBadges && (
            <DesktopOnly>
              <SupporterBadges size="small" expandOnHover />
            </DesktopOnly>
          )}

          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: {
                  width: "34px",
                  height: "34px",
                },
              },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Link href="/account" label="Your profile" labelIcon={<AccountIcon />} />
            </UserButton.MenuItems>
          </UserButton>

          <MobileMenuWrapper>
            <HamburgerButton
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </HamburgerButton>
            {menuOpen && (
              <MobileMenu>
                <MobileNavLink href={ROUTES.ABOUT} onClick={() => setMenuOpen(false)}>
                  About
                </MobileNavLink>
                <MobileNavLink href={ROUTES.CONTACT} onClick={() => setMenuOpen(false)}>
                  Contact
                </MobileNavLink>
                <MobileNavLink href={ROUTES.BLOG.ROOT} onClick={() => setMenuOpen(false)}>
                  Explore
                </MobileNavLink>
                <MobileNavLink href={ROUTES.PROJECTS.ROOT} onClick={() => setMenuOpen(false)}>
                  Work
                </MobileNavLink>
                <MobileNavLink href="/software" onClick={() => setMenuOpen(false)}>
                  Software
                </MobileNavLink>
                <MobileNavLink href="/live" onClick={() => setMenuOpen(false)}>
                  Live
                </MobileNavLink>
                <MobileNavLink href="/support" onClick={() => setMenuOpen(false)}>
                  Support
                </MobileNavLink>
                <MobileNavLink href="/account" onClick={() => setMenuOpen(false)}>
                  Account
                </MobileNavLink>
                {!hideBadges && (
                  <>
                    <MobileMenuSeparator />
                    <MobileBadgesSection>
                      <SupporterBadges direction="column" showLabels size="small" />
                    </MobileBadgesSection>
                  </>
                )}
              </MobileMenu>
            )}
          </MobileMenuWrapper>
        </RightSection>
      </NavContent>
    </NavWrapper>
  );
}

const AccountIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const NavWrapper = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: ${(props) => props.theme.background}f2;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: env(safe-area-inset-top);
`;

const NavContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 48px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 900px) {
    padding: 12px 16px;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: opacity 0.15s ease;

  img {
    filter: ${(props) => (props.theme.background === "#fff" ? "invert(1)" : "none")};
  }

  &:hover {
    opacity: 0.8;
  }
`;

const LogoText = styled.span`
  font-family: var(--font-display);
  font-size: 22px;
  color: ${(props) => props.theme.contrast};
  letter-spacing: -0.5px;
`;


const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  flex-shrink: 0;
`;

const DesktopOnly = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 650px) {
    display: none;
  }
`;

const MobileMenuWrapper = styled.div`
  display: none;
  z-index: 10000;
  position: relative;

  @media (max-width: 650px) {
    display: flex;
    align-items: center;
  }
`;

const HamburgerButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: ${(props) => props.theme.contrast};
  padding: 0;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const MobileMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: ${(props) => props.theme.menuBackground};
  backdrop-filter: blur(10px);
  border: 1px solid ${(props) => props.theme.menuBorder};
  border-radius: 8px;
  padding: 0.5rem 0;
  min-width: 150px;
  box-shadow: 0 4px 20px ${(props) => props.theme.menuShadow};
  z-index: 10000;
`;

const MobileNavLink = styled(Link)`
  display: block;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${(props) => props.theme.contrast};
  text-decoration: none;
  padding: 0.75rem 1rem;
  opacity: 0.7;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    background: rgba(79, 77, 193, 0.1);
  }
`;

const MobileMenuSeparator = styled.div`
  height: 1px;
  background: rgba(79, 77, 193, 0.2);
  margin: 0.5rem 1rem;
`;

const MobileBadgesSection = styled.div`
  padding: 0.5rem 1rem 0.75rem;

  > div {
    align-items: flex-start;
  }
`;
