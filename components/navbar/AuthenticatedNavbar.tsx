import { UserButton } from "@clerk/nextjs";
import { AnimatePresence, m } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import NevuloLogo from "../../assets/svg/nevulo-huge-bold-svg.svg";
import { SupporterBadges } from "../badges/supporter-badges";
import { ROUTES } from "../../constants/routes";

export function AuthenticatedNavbar() {
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
              <Image src={NevuloLogo} alt="Nevulo" width={28} height={28} />
              <LogoText>nevulo</LogoText>
            </LogoContainer>
          </Link>
        </LeftSection>

        <RightSection ref={menuRef}>
          <DesktopOnly>
            <SupporterBadges size="small" expandOnHover />
          </DesktopOnly>

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
              <UserButton.Link href="/account" label="My Account" labelIcon={<AccountIcon />} />
            </UserButton.MenuItems>
          </UserButton>

          <MobileMenuToggle
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </MobileMenuToggle>

          <AnimatePresence>
            {menuOpen && (
              <>
                <MobileOverlay
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setMenuOpen(false)}
                />
                <MobileMenu
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <MobileNavLink href={ROUTES.BLOG.ROOT} onClick={() => setMenuOpen(false)}>
                    Explore
                  </MobileNavLink>
                  <MobileNavLink href={ROUTES.ABOUT} onClick={() => setMenuOpen(false)}>
                    About
                  </MobileNavLink>
                  <MobileNavLink href={ROUTES.PROJECTS.ROOT} onClick={() => setMenuOpen(false)}>
                    Projects
                  </MobileNavLink>
                  <MobileNavLink href="/games" onClick={() => setMenuOpen(false)}>
                    Games
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
                  <MenuDivider />
                  <MobileBadgesSection>
                    <SupporterBadges direction="row" showLabels size="small" />
                  </MobileBadgesSection>
                </MobileMenu>
              </>
            )}
          </AnimatePresence>
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

const CenterNav = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => props.theme.textColor};
  text-decoration: none;
  transition: color 0.15s ease;

  &:hover {
    color: ${(props) => props.theme.contrast};
  }
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

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileMenuToggle = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: ${(props) => props.theme.textColor};
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: ${(props) => props.theme.contrast};
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileOverlay = styled(m.div)`
  position: fixed;
  inset: 0;
  z-index: 98;
`;

const MobileMenu = styled(m.div)`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 99;
  min-width: 200px;
  padding: 8px;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
`;

const MobileNavLink = styled(Link)`
  display: block;
  padding: 12px 14px;
  font-size: 15px;
  font-weight: 500;
  color: ${(props) => props.theme.textColor};
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: ${(props) => props.theme.contrast};
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 8px 0;
`;

const MobileBadgesSection = styled.div`
  padding: 8px 14px;
`;
