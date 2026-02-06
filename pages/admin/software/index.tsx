import {
  useQuery as useRQ,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  Code2,
  Edit,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Star,
  StarOff,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { BlogView } from "../../../components/layout/blog";
import { SimpleNavbar } from "../../../components/navbar/simple";
import { getMe } from "@/src/db/client/me";
import {
  listAllSoftware,
  createSoftware,
  updateSoftware,
  removeSoftware,
} from "@/src/db/client/admin-software";

const SOFTWARE_TYPES = ["app", "tool", "library", "game", "website", "bot"] as const;
const SOFTWARE_CATEGORIES = ["open-source", "commercial", "personal", "game"] as const;
const SOFTWARE_STATUSES = ["active", "coming-soon", "archived", "beta"] as const;
const PLATFORM_OPTIONS = ["web", "roblox", "desktop", "mobile", "ios", "android"] as const;

type SoftwareType = (typeof SOFTWARE_TYPES)[number];
type SoftwareCategory = (typeof SOFTWARE_CATEGORIES)[number];
type SoftwareStatus = (typeof SOFTWARE_STATUSES)[number];

export const getServerSideProps = () => ({ props: {} });

export default function AdminSoftwarePage() {
  const [mounted, setMounted] = useState(false);
  const { data: me } = useRQ({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });
  const isCreator = me?.isCreator ?? false;
  const isLoading = me === undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <BlogView>
        <SimpleNavbar title="Software Admin" />
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
          <title>Access Denied | Software Admin</title>
        </Head>
        <BlogView>
          <SimpleNavbar title="Software Admin" />
          <Container>
            <Title>Access Denied</Title>
            <Text>You don't have permission to access software admin.</Text>
          </Container>
        </BlogView>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Software Admin | Nevulo</title>
      </Head>
      <BlogView>
        <SimpleNavbar title="Software Admin" />
        <AdminContainer>
          <Header>
            <Title>
              <Code2 size={28} /> Software Admin
            </Title>
            <Text>Manage software projects displayed on the site</Text>
          </Header>

          <SoftwareListSection />
        </AdminContainer>
      </BlogView>
    </>
  );
}

type SoftwareItem = Awaited<ReturnType<typeof listAllSoftware>>[number];

function SoftwareListSection() {
  const queryClient = useQueryClient();
  const { data: software } = useRQ({
    queryKey: ["admin", "software"],
    queryFn: () => listAllSoftware(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createSoftware>[0]) => createSoftware(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "software"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Parameters<typeof updateSoftware>[1]) =>
      updateSoftware(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "software"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeSoftware(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "software"] }),
  });

  const [filter, setFilter] = useState<"all" | SoftwareStatus>("all");
  const [editingItem, setEditingItem] = useState<SoftwareItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filtered =
    software?.filter((s) => {
      if (filter === "all") return true;
      return s.status === filter;
    }) ?? [];

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      try {
        await removeMutation.mutateAsync(id);
        setMessage({ type: "success", text: `Deleted "${name}"` });
      } catch (err) {
        setMessage({ type: "error", text: `Failed to delete: ${err}` });
      }
    }
  };

  const handleToggleFeatured = async (item: SoftwareItem) => {
    try {
      await updateMutation.mutateAsync({ id: item.id, isFeatured: !item.isFeatured });
    } catch (err) {
      setMessage({ type: "error", text: `Failed to update: ${err}` });
    }
  };

  const handleToggleStatus = async (item: SoftwareItem) => {
    const newStatus = item.status === "archived" ? "active" : "archived";
    try {
      await updateMutation.mutateAsync({ id: item.id, status: newStatus as SoftwareStatus });
    } catch (err) {
      setMessage({ type: "error", text: `Failed to update: ${err}` });
    }
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>
          <Code2 size={20} /> Software ({filtered.length})
        </SectionTitle>
        <HeaderActions>
          <FilterRow>
            <FilterButton $active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </FilterButton>
            <FilterButton $active={filter === "active"} onClick={() => setFilter("active")}>
              Active
            </FilterButton>
            <FilterButton $active={filter === "beta"} onClick={() => setFilter("beta")}>
              Beta
            </FilterButton>
            <FilterButton $active={filter === "archived"} onClick={() => setFilter("archived")}>
              Archived
            </FilterButton>
          </FilterRow>
          <CreateButton onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Software
          </CreateButton>
        </HeaderActions>
      </SectionHeader>

      {message && (
        <Message $type={message.type}>
          {message.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
          <DismissButton onClick={() => setMessage(null)}>
            <X size={14} />
          </DismissButton>
        </Message>
      )}

      {!software ? (
        <Text>Loading software...</Text>
      ) : filtered.length === 0 ? (
        <EmptyState>
          <Text>No software found. Click "Add Software" to create one.</Text>
        </EmptyState>
      ) : (
        <SoftwareList>
          {filtered.map((item) => (
            <SoftwareCard key={item.id} $background={item.background ?? undefined}>
              <CardLeft>
                <DragHandle>
                  <GripVertical size={16} />
                </DragHandle>
                {item.logoUrl && <SoftwareLogo src={item.logoUrl} alt={item.name} />}
                <SoftwareInfo>
                  <SoftwareName>{item.name}</SoftwareName>
                  <SoftwareMeta>
                    {item.shortDescription}
                    <TypeBadge>{item.type}</TypeBadge>
                    <CategoryBadge>{item.category}</CategoryBadge>
                  </SoftwareMeta>
                </SoftwareInfo>
              </CardLeft>
              <CardRight>
                <StatusBadge $status={item.status}>{item.status}</StatusBadge>
                {item.isFeatured && <FeaturedBadge>Featured</FeaturedBadge>}
                <IconButton
                  onClick={() => handleToggleFeatured(item)}
                  title={item.isFeatured ? "Remove from featured" : "Add to featured"}
                >
                  {item.isFeatured ? <Star size={16} /> : <StarOff size={16} />}
                </IconButton>
                <IconButton onClick={() => setEditingItem(item)} title="Edit">
                  <Edit size={16} />
                </IconButton>
                <IconButton onClick={() => handleToggleStatus(item)} title="Toggle status">
                  {item.status === "archived" ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
                <IconButton $danger onClick={() => handleDelete(item.id, item.name)} title="Delete">
                  <Trash2 size={16} />
                </IconButton>
              </CardRight>
            </SoftwareCard>
          ))}
        </SoftwareList>
      )}

      {(editingItem || showCreate) && (
        <EditSoftwareModal
          item={editingItem}
          onClose={() => {
            setEditingItem(null);
            setShowCreate(false);
          }}
          onSave={async (data) => {
            try {
              if (editingItem) {
                await updateMutation.mutateAsync({ id: editingItem.id, ...data });
                setMessage({ type: "success", text: `Updated "${data.name || editingItem.name}"` });
              } else {
                await createMutation.mutateAsync(data as Parameters<typeof createSoftware>[0]);
                setMessage({ type: "success", text: `Created "${data.name}"` });
              }
              setEditingItem(null);
              setShowCreate(false);
            } catch (err) {
              setMessage({ type: "error", text: `Failed to save: ${err}` });
            }
          }}
        />
      )}
    </Section>
  );
}

interface EditSoftwareModalProps {
  item: SoftwareItem | null;
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
}

function EditSoftwareModal({ item, onClose, onSave }: EditSoftwareModalProps) {
  const isCreate = !item;
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "media" | "links" | "platforms">("basic");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [shortDescription, setShortDescription] = useState(item?.shortDescription ?? "");
  const [longDescription, setLongDescription] = useState(item?.longDescription ?? "");
  const [type, setType] = useState<SoftwareType>(item?.type ?? "app");
  const [category, setCategory] = useState<SoftwareCategory>(item?.category ?? "personal");
  const [status, setStatus] = useState<SoftwareStatus>(item?.status ?? "active");
  const [order, setOrder] = useState(item?.order ?? 0);
  const [isFeatured, setIsFeatured] = useState(item?.isFeatured ?? false);

  // Media
  const [logoUrl, setLogoUrl] = useState(item?.logoUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(item?.bannerUrl ?? "");
  const [background, setBackground] = useState(item?.background ?? "");

  // Links
  const [github, setGithub] = useState(item?.links?.github ?? "");
  const [website, setWebsite] = useState(item?.links?.website ?? "");
  const [roblox, setRoblox] = useState(item?.links?.roblox ?? "");
  const [discord, setDiscord] = useState(item?.links?.discord ?? "");
  const [appStore, setAppStore] = useState(item?.links?.appStore ?? "");
  const [playStore, setPlayStore] = useState(item?.links?.playStore ?? "");
  const [openExternally, setOpenExternally] = useState(item?.openExternally ?? false);

  // Technologies & Platforms
  const [technologies, setTechnologies] = useState(item?.technologies?.join(", ") ?? "");
  const [platforms, setPlatforms] = useState<string[]>(item?.platforms ?? []);

  // Stats
  const [players, setPlayers] = useState(item?.stats?.players ?? 0);
  const [downloads, setDownloads] = useState(item?.stats?.downloads ?? 0);
  const [stars, setStars] = useState(item?.stats?.stars ?? 0);

  const handleUpload = useCallback(async (file: File, target: "logo" | "banner") => {
    setUploading(target);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/software/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64, filename: file.name }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }

      const { url } = await response.json();
      if (target === "logo") {
        setLogoUrl(url);
      } else {
        setBannerUrl(url);
      }
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setUploading(null);
    }
  }, []);

  const handleSave = async () => {
    if (!slug || !name || !shortDescription) return;
    setSaving(true);
    try {
      const links: Record<string, string | undefined> = {};
      if (github) links.github = github;
      if (website) links.website = website;
      if (roblox) links.roblox = roblox;
      if (discord) links.discord = discord;
      if (appStore) links.appStore = appStore;
      if (playStore) links.playStore = playStore;

      const stats: Record<string, number | undefined> = {};
      if (players) stats.players = players;
      if (downloads) stats.downloads = downloads;
      if (stars) stats.stars = stars;

      const data: Record<string, any> = {
        slug,
        name,
        shortDescription,
        type,
        category,
        status,
        order,
        isFeatured,
        openExternally,
        technologies: technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        platforms,
      };

      if (longDescription) data.longDescription = longDescription;
      if (logoUrl) data.logoUrl = logoUrl;
      if (bannerUrl) data.bannerUrl = bannerUrl;
      if (background) data.background = background;
      if (Object.keys(links).length > 0) data.links = links;
      if (Object.keys(stats).length > 0) data.stats = stats;

      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {isCreate ? <Plus size={20} /> : <Edit size={20} />}
            {isCreate ? "Add Software" : `Edit: ${item.name}`}
          </ModalTitle>
          <CloseModalButton onClick={onClose}>
            <X size={20} />
          </CloseModalButton>
        </ModalHeader>

        <TabRow>
          <Tab $active={activeTab === "basic"} onClick={() => setActiveTab("basic")}>
            Basic Info
          </Tab>
          <Tab $active={activeTab === "media"} onClick={() => setActiveTab("media")}>
            Media
          </Tab>
          <Tab $active={activeTab === "links"} onClick={() => setActiveTab("links")}>
            Links
          </Tab>
          <Tab $active={activeTab === "platforms"} onClick={() => setActiveTab("platforms")}>
            Tech & Platforms
          </Tab>
        </TabRow>

        <ModalBody>
          {activeTab === "basic" && (
            <FormSection>
              <FormRow>
                <FormGroup>
                  <Label>Slug *</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-software"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Software"
                  />
                </FormGroup>
              </FormRow>
              <FormGroup>
                <Label>Short Description *</Label>
                <TextArea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief description"
                  rows={2}
                />
              </FormGroup>
              <FormGroup>
                <Label>Long Description (Markdown)</Label>
                <TextArea
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  placeholder="Detailed description in markdown..."
                  rows={4}
                />
              </FormGroup>
              <FormRow>
                <FormGroup>
                  <Label>Type</Label>
                  <Select value={type} onChange={(e) => setType(e.target.value as SoftwareType)}>
                    {SOFTWARE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Category</Label>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SoftwareCategory)}
                  >
                    {SOFTWARE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup>
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SoftwareStatus)}
                  >
                    {SOFTWARE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    min={0}
                  />
                </FormGroup>
              </FormRow>
              <FormGroup>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  Featured (shown in homepage widget)
                </CheckboxLabel>
              </FormGroup>
              <FormRow>
                <FormGroup>
                  <Label>Players (stat)</Label>
                  <Input
                    type="number"
                    value={players || ""}
                    onChange={(e) => setPlayers(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Downloads (stat)</Label>
                  <Input
                    type="number"
                    value={downloads || ""}
                    onChange={(e) => setDownloads(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Stars (stat)</Label>
                  <Input
                    type="number"
                    value={stars || ""}
                    onChange={(e) => setStars(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </FormGroup>
              </FormRow>
            </FormSection>
          )}

          {activeTab === "media" && (
            <FormSection>
              <FormGroup>
                <Label>Logo</Label>
                <UploadRow>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="URL or upload an image"
                    style={{ flex: 1 }}
                  />
                  <UploadButton
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploading === "logo"}
                  >
                    <Upload size={14} />
                    {uploading === "logo" ? "Uploading..." : "Upload"}
                  </UploadButton>
                  <HiddenInput
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "logo");
                      e.target.value = "";
                    }}
                  />
                </UploadRow>
                {logoUrl && <LogoPreview src={logoUrl} alt="Logo preview" />}
              </FormGroup>
              <FormGroup>
                <Label>Banner</Label>
                <UploadRow>
                  <Input
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="URL or upload an image"
                    style={{ flex: 1 }}
                  />
                  <UploadButton
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploading === "banner"}
                  >
                    <Upload size={14} />
                    {uploading === "banner" ? "Uploading..." : "Upload"}
                  </UploadButton>
                  <HiddenInput
                    ref={bannerInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "banner");
                      e.target.value = "";
                    }}
                  />
                </UploadRow>
                {bannerUrl && <BannerPreview src={bannerUrl} alt="Banner preview" />}
              </FormGroup>
              <FormGroup>
                <Label>Background (CSS gradient)</Label>
                <Input
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="linear-gradient(135deg, #065f46, #10b981)"
                />
                {background && <GradientPreview style={{ background }} />}
              </FormGroup>
            </FormSection>
          )}

          {activeTab === "links" && (
            <FormSection>
              <FormGroup>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={openExternally}
                    onChange={(e) => setOpenExternally(e.target.checked)}
                  />
                  Open externally (link to website/roblox instead of /software page)
                </CheckboxLabel>
                <HintText>
                  When enabled, clicking this software will open the website or Roblox link directly instead of the detail page.
                </HintText>
              </FormGroup>
              <FormGroup>
                <Label>GitHub</Label>
                <Input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/..."
                />
              </FormGroup>
              <FormGroup>
                <Label>Website</Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </FormGroup>
              <FormGroup>
                <Label>Roblox</Label>
                <Input
                  value={roblox}
                  onChange={(e) => setRoblox(e.target.value)}
                  placeholder="https://www.roblox.com/games/..."
                />
              </FormGroup>
              <FormGroup>
                <Label>Discord</Label>
                <Input
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="https://discord.gg/..."
                />
              </FormGroup>
              <FormRow>
                <FormGroup>
                  <Label>App Store</Label>
                  <Input
                    value={appStore}
                    onChange={(e) => setAppStore(e.target.value)}
                    placeholder="https://apps.apple.com/..."
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Play Store</Label>
                  <Input
                    value={playStore}
                    onChange={(e) => setPlayStore(e.target.value)}
                    placeholder="https://play.google.com/..."
                  />
                </FormGroup>
              </FormRow>
            </FormSection>
          )}

          {activeTab === "platforms" && (
            <FormSection>
              <FormGroup>
                <Label>Technologies (comma-separated)</Label>
                <Input
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  placeholder="React, TypeScript, Luau"
                />
                {technologies && (
                  <TagPreview>
                    {technologies
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((t) => (
                        <TagChip key={t}>{t}</TagChip>
                      ))}
                  </TagPreview>
                )}
              </FormGroup>
              <FormGroup>
                <Label>Platforms</Label>
                <TagSelector>
                  {PLATFORM_OPTIONS.map((p) => (
                    <TagOption
                      key={p}
                      $selected={platforms.includes(p)}
                      $color="#3b82f6"
                      onClick={() => {
                        setPlatforms(
                          platforms.includes(p)
                            ? platforms.filter((x) => x !== p)
                            : [...platforms, p],
                        );
                      }}
                    >
                      {p}
                    </TagOption>
                  ))}
                </TagSelector>
              </FormGroup>
            </FormSection>
          )}
        </ModalBody>

        <ModalFooter>
          <ActionButton $secondary onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton onClick={handleSave} disabled={saving || !slug || !name || !shortDescription}>
            {saving ? "Saving..." : isCreate ? "Create" : "Save Changes"}
          </ActionButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}

// Styled Components
const Container = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const AdminContainer = styled(Container)`
  padding-top: 20px;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: ${(p) => p.theme.contrast};
  margin: 0 0 8px;
`;

const Text = styled.p`
  color: ${(p) => p.theme.textColor};
  margin: 0;
`;

const Section = styled.section`
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: ${(p) => (p.$active ? p.theme.contrast : p.theme.background)};
  color: ${(p) => (p.$active ? p.theme.background : p.theme.textColor)};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: ${(p) => p.theme.contrast};
  color: ${(p) => p.theme.background};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const Message = styled.div<{ $type: "success" | "error" }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  background: ${(p) => (p.$type === "success" ? "#22c55e20" : "#ef444420")};
  color: ${(p) => (p.$type === "success" ? "#22c55e" : "#ef4444")};
  border: 1px solid ${(p) => (p.$type === "success" ? "#22c55e40" : "#ef444440")};
`;

const DismissButton = styled.button`
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 2px;
  opacity: 0.6;
  &:hover {
    opacity: 1;
  }
`;

const SoftwareList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SoftwareCard = styled.div<{ $background?: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: ${(p) => p.theme.background};
  border-radius: 12px;
  border-left: 4px solid;
  border-image: ${(p) => p.$background || p.theme.contrast} 1;
  gap: 12px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const CardLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
`;

const DragHandle = styled.div`
  color: ${(p) => p.theme.textColor};
  opacity: 0.5;
  cursor: grab;
  flex-shrink: 0;

  &:hover {
    opacity: 1;
  }
`;

const SoftwareLogo = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: contain;
  flex-shrink: 0;
`;

const SoftwareInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const SoftwareName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
`;

const SoftwareMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${(p) => p.theme.textColor};
  flex-wrap: wrap;
`;

const TypeBadge = styled.span`
  background: #3b82f620;
  color: #3b82f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
`;

const CategoryBadge = styled.span`
  background: #8b5cf620;
  color: #8b5cf6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
`;

const CardRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${(p) =>
    p.$status === "active"
      ? "#22c55e20"
      : p.$status === "beta"
        ? "#f59e0b20"
        : p.$status === "coming-soon"
          ? "#3b82f620"
          : "#ef444420"};
  color: ${(p) =>
    p.$status === "active"
      ? "#22c55e"
      : p.$status === "beta"
        ? "#f59e0b"
        : p.$status === "coming-soon"
          ? "#3b82f6"
          : "#ef4444"};
`;

const FeaturedBadge = styled.span`
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: #ffd70020;
  color: #ffd700;
`;

const IconButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${(p) => (p.$danger ? "#ef4444" : p.theme.textColor)};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$danger ? "#ef444420" : p.theme.borderColor)};
  }
`;

const EmptyState = styled.div`
  padding: 40px;
  text-align: center;
`;

// Modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: ${(p) => p.theme.background};
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${(p) => p.theme.borderColor || "#333"};
`;

const ModalTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  margin: 0;
`;

const CloseModalButton = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.textColor};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => p.theme.borderColor || "#333"};
  }
`;

const TabRow = styled.div`
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  border-bottom: 1px solid ${(p) => p.theme.borderColor || "#333"};
  overflow-x: auto;
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: ${(p) => (p.$active ? p.theme.contrast : "transparent")};
  color: ${(p) => (p.$active ? p.theme.background : p.theme.textColor)};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$active ? p.theme.contrast : p.theme.borderColor || "#333")};
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid ${(p) => p.theme.borderColor || "#333"};
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${(p) => p.theme.textColor};
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid ${(p) => p.theme.borderColor || "#333"};
  border-radius: 8px;
  background: ${(p) => p.theme.borderColor || "#222"};
  color: ${(p) => p.theme.contrast};
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.contrast};
  }

  &::placeholder {
    color: ${(p) => p.theme.textColor};
    opacity: 0.5;
  }
`;

const TextArea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid ${(p) => p.theme.borderColor || "#333"};
  border-radius: 8px;
  background: ${(p) => p.theme.borderColor || "#222"};
  color: ${(p) => p.theme.contrast};
  font-size: 14px;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.contrast};
  }

  &::placeholder {
    color: ${(p) => p.theme.textColor};
    opacity: 0.5;
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid ${(p) => p.theme.borderColor || "#333"};
  border-radius: 8px;
  background: ${(p) => p.theme.borderColor || "#222"};
  color: ${(p) => p.theme.contrast};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.contrast};
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${(p) => p.theme.contrast};
  cursor: pointer;
  padding: 10px 0;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const HintText = styled.p`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
  margin: 0;
  line-height: 1.4;
`;

const ActionButton = styled.button<{ $secondary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: ${(p) => (p.$secondary ? p.theme.background : p.theme.contrast)};
  color: ${(p) => (p.$secondary ? p.theme.contrast : p.theme.background)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GradientPreview = styled.div`
  height: 40px;
  border-radius: 8px;
  margin-top: 4px;
`;

const LogoPreview = styled.img`
  width: 64px;
  height: 64px;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  margin-top: 4px;
`;

const TagSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TagOption = styled.button<{ $selected?: boolean; $color: string }>`
  padding: 6px 12px;
  border: 2px solid ${(p) => (p.$selected ? p.$color : "transparent")};
  border-radius: 6px;
  background: ${(p) => (p.$selected ? `${p.$color}30` : p.theme.borderColor || "#333")};
  color: ${(p) => (p.$selected ? p.$color : p.theme.textColor)};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${(p) => p.$color};
  }
`;

const TagPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
`;

const TagChip = styled.span`
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-size: 12px;
  color: ${(p) => p.theme.contrast};
`;

const UploadRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid ${(p) => p.theme.borderColor || "#333"};
  border-radius: 8px;
  background: ${(p) => p.theme.borderColor || "#222"};
  color: ${(p) => p.theme.contrast};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    border-color: ${(p) => p.theme.contrast};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const BannerPreview = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  margin-top: 4px;
  background: rgba(255, 255, 255, 0.05);
`;
