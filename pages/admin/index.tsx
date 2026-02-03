import { useMutation, useQuery } from "convex/react";
import {
  Check,
  ChevronRight,
  Crown,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { BlogView } from "../../components/layout/blog";
import { SimpleNavbar } from "../../components/navbar/simple";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useTierAccess } from "../../hooks/useTierAccess";

export const getServerSideProps = () => ({ props: {} });

// Types for staff members
interface StaffMember {
  _id: Id<"users">;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  tier: string;
  role: number;
  isCreator: boolean;
}

// Types for search results
interface SearchUser {
  _id: Id<"users">;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  tier: string;
  isCreator: boolean;
}

// Role constants (must match convex/auth.ts)
const ROLE_STAFF = 1;

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const { isLoading, isCreator } = useTierAccess();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <BlogView>
        <SimpleNavbar title="Admin" />
        <Container>
          <p>Loading...</p>
        </Container>
      </BlogView>
    );
  }

  if (!isCreator) {
    return (
      <>
        <Head>
          <title>Access Denied | Admin</title>
        </Head>
        <BlogView>
          <SimpleNavbar title="Admin" />
          <Container>
            <Title>Access Denied</Title>
            <Text>You don't have permission to access the admin panel.</Text>
          </Container>
        </BlogView>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin | Nevulo</title>
      </Head>
      <BlogView>
        <SimpleNavbar title="Admin" />
        <AdminContainer>
          <Header>
            <HeaderTop>
              <Shield size={32} />
              <div>
                <Title>Admin Panel</Title>
                <Text>Manage staff members and site settings</Text>
              </div>
            </HeaderTop>
          </Header>

          <QuickLinks />

          <StaffManagement />
        </AdminContainer>
      </BlogView>
    </>
  );
}

function QuickLinks() {
  return (
    <LinksGrid>
      <QuickLink href="/admin/support">
        <LinkIcon $color="#ffd700">
          <Crown size={20} />
        </LinkIcon>
        <LinkContent>
          <LinkTitle>Super Legends</LinkTitle>
          <LinkDesc>Manage subscribers & content delivery</LinkDesc>
        </LinkContent>
        <ChevronRight size={16} />
      </QuickLink>
      <QuickLink href="/admin/blog">
        <LinkIcon $color="#3b82f6">
          <Shield size={20} />
        </LinkIcon>
        <LinkContent>
          <LinkTitle>Blog Admin</LinkTitle>
          <LinkDesc>Manage posts & analytics</LinkDesc>
        </LinkContent>
        <ChevronRight size={16} />
      </QuickLink>
      <QuickLink href="/admin/software">
        <LinkIcon $color="#10b981">
          <Shield size={20} />
        </LinkIcon>
        <LinkContent>
          <LinkTitle>Software</LinkTitle>
          <LinkDesc>Manage software projects & games</LinkDesc>
        </LinkContent>
        <ChevronRight size={16} />
      </QuickLink>
      <QuickLink href="/admin/inventory">
        <LinkIcon $color="#a855f7">
          <Shield size={20} />
        </LinkIcon>
        <LinkContent>
          <LinkTitle>Inventory</LinkTitle>
          <LinkDesc>Items, lootboxes, tier rewards</LinkDesc>
        </LinkContent>
        <ChevronRight size={16} />
      </QuickLink>
    </LinksGrid>
  );
}

function StaffManagement() {
  const staffMembers = useQuery(api.users.getStaffMembers);
  const addStaff = useMutation(api.users.addStaff);
  const removeStaff = useMutation(api.users.removeStaff);

  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search users
  const searchResults = useQuery(
    api.users.searchUsers,
    searchQuery.length > 0 ? { query: searchQuery, limit: 10 } : "skip",
  );

  // Filter out users who are already staff
  const filteredResults = useMemo((): SearchUser[] => {
    if (!searchResults || !staffMembers) return [];
    const staffIds = new Set(staffMembers.map((s: StaffMember) => s._id));
    return searchResults.filter((u: SearchUser) => !staffIds.has(u._id));
  }, [searchResults, staffMembers]);

  const handleAddStaff = useCallback(
    async (userId: Id<"users">) => {
      setIsAdding(true);
      try {
        await addStaff({ userId });
        setSearchQuery("");
        setShowPicker(false);
      } catch (error) {
        console.error("Failed to add staff:", error);
        alert("Failed to add staff member");
      } finally {
        setIsAdding(false);
      }
    },
    [addStaff],
  );

  const handleRemoveStaff = useCallback(
    async (userId: Id<"users">) => {
      if (!confirm("Are you sure you want to remove this staff member?")) return;
      try {
        await removeStaff({ userId });
      } catch (error: any) {
        console.error("Failed to remove staff:", error);
        alert(error.message || "Failed to remove staff member");
      }
    },
    [removeStaff],
  );

  // Focus input when picker opens
  useEffect(() => {
    if (showPicker && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showPicker]);

  return (
    <Section>
      <SectionHeader>
        <SectionIcon>
          <Users size={20} />
        </SectionIcon>
        <SectionTitle>Staff Members</SectionTitle>
        <SectionDescription>
          Staff can moderate comments and content across the site.
        </SectionDescription>
      </SectionHeader>

      <StaffList>
        {staffMembers?.map((member: StaffMember) => (
          <StaffCard key={member._id}>
            <StaffAvatar>
              {member.avatarUrl ? (
                <Avatar src={member.avatarUrl} alt={member.displayName} />
              ) : (
                <AvatarPlaceholder>{member.displayName?.charAt(0) || "?"}</AvatarPlaceholder>
              )}
            </StaffAvatar>
            <StaffInfo>
              <StaffName>
                {member.displayName}
                {member.isCreator && (
                  <CreatorBadge>
                    <Crown size={12} /> Creator
                  </CreatorBadge>
                )}
                {!member.isCreator && member.role === ROLE_STAFF && <RoleBadge>Staff</RoleBadge>}
              </StaffName>
              {member.username && <StaffUsername>@{member.username}</StaffUsername>}
            </StaffInfo>
            {!member.isCreator && (
              <RemoveButton onClick={() => handleRemoveStaff(member._id)} title="Remove from staff">
                <Trash2 size={16} />
              </RemoveButton>
            )}
          </StaffCard>
        ))}

        {/* Add Staff Button / Picker */}
        {showPicker ? (
          <PickerContainer>
            <PickerHeader>
              <PickerTitle>Add Staff Member</PickerTitle>
              <CloseButton onClick={() => setShowPicker(false)}>
                <X size={16} />
              </CloseButton>
            </PickerHeader>
            <SearchInputWrapper>
              <Search size={16} />
              <SearchInput
                ref={inputRef}
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchInputWrapper>
            <SearchResults>
              {filteredResults.length === 0 && searchQuery.length > 0 && (
                <NoResults>No users found</NoResults>
              )}
              {filteredResults.map((user) => (
                <SearchResultItem
                  key={user._id}
                  onClick={() => handleAddStaff(user._id)}
                  disabled={isAdding}
                >
                  {user.avatarUrl ? (
                    <SmallAvatar src={user.avatarUrl} alt={user.displayName} />
                  ) : (
                    <SmallAvatarPlaceholder>
                      {user.displayName?.charAt(0) || "?"}
                    </SmallAvatarPlaceholder>
                  )}
                  <UserInfo>
                    <UserName>{user.displayName}</UserName>
                    {user.username && <UserHandle>@{user.username}</UserHandle>}
                  </UserInfo>
                  <AddIcon>
                    <Check size={16} />
                  </AddIcon>
                </SearchResultItem>
              ))}
            </SearchResults>
          </PickerContainer>
        ) : (
          <AddStaffButton onClick={() => setShowPicker(true)}>
            <UserPlus size={18} />
            Add Staff Member
          </AddStaffButton>
        )}
      </StaffList>
    </Section>
  );
}

// Styled Components
const Container = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const AdminContainer = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  svg {
    color: ${(props) => props.theme.linkColor};
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
`;

const Text = styled.p`
  margin: 4px 0 0;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
`;

const LinksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
`;

const QuickLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.02);
  }

  svg:last-child {
    color: ${(props) => props.theme.textColor};
    opacity: 0.4;
  }
`;

const LinkIcon = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${(props) => props.$color}22;
  border-radius: 10px;
  color: ${(props) => props.$color};
`;

const LinkContent = styled.div`
  flex: 1;
`;

const LinkTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

const LinkDesc = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const Section = styled.section`
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
`;

const SectionHeader = styled.div`
  margin-bottom: 24px;
`;

const SectionIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${(props) => props.theme.linkColor}22;
  border-radius: 10px;
  color: ${(props) => props.theme.linkColor};
  margin-bottom: 12px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

const SectionDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
`;

const StaffList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StaffCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
`;

const StaffAvatar = styled.div`
  flex-shrink: 0;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${(props) => props.theme.linkColor}33;
  color: ${(props) => props.theme.linkColor};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
`;

const StaffInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const StaffName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  font-size: 14px;
`;

const StaffUsername = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const CreatorBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
`;

const RoleBadge = styled.span`
  padding: 2px 8px;
  background: ${(props) => props.theme.linkColor}22;
  border: 1px solid ${(props) => props.theme.linkColor}44;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(props) => props.theme.linkColor};
`;

const RemoveButton = styled.button`
  padding: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: none;
  border-radius: 6px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
`;

const AddStaffButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: transparent;
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: ${(props) => props.theme.textColor};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) => props.theme.linkColor};
    color: ${(props) => props.theme.linkColor};
    background: ${(props) => props.theme.linkColor}11;
  }
`;

const PickerContainer = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
`;

const PickerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const PickerTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

const CloseButton = styled.button`
  padding: 4px;
  background: transparent;
  border: none;
  color: ${(props) => props.theme.textColor};
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s;

  &:hover {
    opacity: 1;
  }
`;

const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: ${(props) => props.theme.textColor};
  opacity: 0.5;
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: ${(props) => props.theme.contrast};
  font-size: 14px;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${(props) => props.theme.textColor};
    opacity: 0.5;
  }
`;

const SearchResults = styled.div`
  max-height: 240px;
  overflow-y: auto;
`;

const NoResults = styled.div`
  padding: 20px;
  text-align: center;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
  font-size: 13px;
`;

const SearchResultItem = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const SmallAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
`;

const SmallAvatarPlaceholder = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(props) => props.theme.linkColor}33;
  color: ${(props) => props.theme.linkColor};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
`;

const UserInfo = styled.div`
  flex: 1;
  text-align: left;
`;

const UserName = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  font-size: 13px;
`;

const UserHandle = styled.div`
  font-size: 11px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const AddIcon = styled.div`
  color: ${(props) => props.theme.linkColor};
  opacity: 0;
  transition: opacity 0.15s;

  ${SearchResultItem}:hover & {
    opacity: 1;
  }
`;
