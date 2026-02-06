import {
  useMutation,
  useQuery as useRQ,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Archive,
  Box,
  Edit2,
  Gift,
  Package,
  Plus,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import Head from "next/head";
import { useMemo, useState } from "react";
import styled from "styled-components";
import { BlogView } from "../../../components/layout/blog";
import { SimpleNavbar } from "../../../components/navbar/simple";
import { RARITY_COLORS, type Rarity } from "../../../constants/rarity";
import { getMe } from "@/src/db/client/me";
import { searchUsers } from "@/src/db/client/admin";
import {
  archiveItem,
  createItem,
  createLootboxTemplate,
  createTierClaimable,
  deactivateTierClaimable,
  getInventoryAnalytics,
  getItemCatalog,
  getLootboxTemplates,
  getTierClaimables,
  sendDirectItem,
  shipLootbox,
  unarchiveItem,
  updateItem,
  updateLootboxTemplate,
} from "@/src/db/client/admin-inventory";

export const getServerSideProps = () => ({ props: {} });

type TabType = "items" | "lootboxes" | "ship" | "claimables" | "analytics";

export default function InventoryAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("items");
  const { data: me } = useRQ({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });
  const isCreator = me?.isCreator ?? false;
  const isLoading = me === undefined;

  // Stub: getNetworkServices was Convex-specific; keep the UI but use empty array
  const networkServices: Array<{ slug: string; name: string }> = [];

  if (isLoading) {
    return (
      <BlogView>
        <SimpleNavbar title="Inventory Admin" />
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
          <title>Access Denied | Inventory Admin</title>
        </Head>
        <BlogView>
          <SimpleNavbar title="Inventory Admin" />
          <Container>
            <Title>Access Denied</Title>
          </Container>
        </BlogView>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Inventory Admin | Nevulo</title>
      </Head>
      <BlogView>
        <SimpleNavbar title="Inventory Admin" />
        <AdminContainer>
          <Header>
            <Title>Inventory & Rewards</Title>
            <Text>Manage items, lootboxes, tier claimables, and delivery</Text>
          </Header>

          <TabBar>
            <Tab $active={activeTab === "items"} onClick={() => setActiveTab("items")}>
              <Sparkles size={16} /> Items
            </Tab>
            <Tab $active={activeTab === "lootboxes"} onClick={() => setActiveTab("lootboxes")}>
              <Box size={16} /> Lootboxes
            </Tab>
            <Tab $active={activeTab === "ship"} onClick={() => setActiveTab("ship")}>
              <Send size={16} /> Ship & Send
            </Tab>
            <Tab $active={activeTab === "claimables"} onClick={() => setActiveTab("claimables")}>
              <Gift size={16} /> Tier Claimables
            </Tab>
            <Tab $active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")}>
              <TrendingUp size={16} /> Analytics
            </Tab>
          </TabBar>

          {activeTab === "items" && <ItemsCatalogTab networkServices={networkServices} />}
          {activeTab === "lootboxes" && <LootboxTemplatesTab />}
          {activeTab === "ship" && <ShipAndSendTab />}
          {activeTab === "claimables" && <TierClaimablesTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
        </AdminContainer>
      </BlogView>
    </>
  );
}

// ============================================
// Items Catalog Tab
// ============================================

function ItemsCatalogTab({ networkServices }: { networkServices: Array<{ slug: string; name: string }> }) {
  const queryClient = useQueryClient();
  const { data: items } = useRQ({
    queryKey: ["admin", "itemCatalog", true],
    queryFn: () => getItemCatalog({ includeArchived: true }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => archiveItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "itemCatalog"] });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id: number) => unarchiveItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "itemCatalog"] });
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRarity, setFilterRarity] = useState<string>("all");

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.slug.includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterRarity !== "all" && item.rarity !== filterRarity) return false;
      return true;
    });
  }, [items, searchQuery, filterRarity]);

  return (
    <div>
      <SectionHeader>
        <SearchBar>
          <Search size={16} />
          <SearchInput
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchBar>
        <FilterSelect value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)}>
          <option value="all">All Rarities</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
        </FilterSelect>
        <PrimaryButton onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Create Item
        </PrimaryButton>
      </SectionHeader>

      {!items ? (
        <LoadingText>Loading items...</LoadingText>
      ) : filteredItems.length === 0 ? (
        <EmptyState>
          <Package size={48} />
          <p>No items found</p>
        </EmptyState>
      ) : (
        <ItemsGrid>
          {filteredItems.map((item) => (
            <ItemCard key={item.id} $archived={item.isArchived}>
              <ItemCardTop>
                <RarityBadge $rarity={item.rarity as Rarity}>{item.rarity}</RarityBadge>
                <TypeBadge>{item.type}</TypeBadge>
                {item.isArchived && <ArchivedBadge>Archived</ArchivedBadge>}
              </ItemCardTop>
              {item.iconUrl && <ItemIcon src={item.iconUrl} alt={item.name} />}
              <ItemName>{item.name}</ItemName>
              <ItemSlug>{item.slug}</ItemSlug>
              <ItemDesc>{item.description}</ItemDesc>
              {(!item.services || (item.services as string[]).length === 0) ? (
                <CategoryBadge>All Services</CategoryBadge>
              ) : (
                <ServiceBadges>
                  {(item.services as string[]).map((s: string) => (
                    <CategoryBadge key={s}>{s}</CategoryBadge>
                  ))}
                </ServiceBadges>
              )}
              <ItemActions>
                <ActionButton onClick={() => setEditingItem(item.id)} title="Edit">
                  <Edit2 size={14} />
                </ActionButton>
                <ActionButton
                  onClick={() =>
                    item.isArchived
                      ? unarchiveMutation.mutate(item.id)
                      : archiveMutation.mutate(item.id)
                  }
                  title={item.isArchived ? "Unarchive" : "Archive"}
                >
                  <Archive size={14} />
                </ActionButton>
              </ItemActions>
            </ItemCard>
          ))}
        </ItemsGrid>
      )}

      {showCreate && <CreateItemModal onClose={() => setShowCreate(false)} networkServices={networkServices} />}
      {editingItem && <EditItemModal itemId={editingItem} onClose={() => setEditingItem(null)} networkServices={networkServices} />}
    </div>
  );
}

function CreateItemModal({ onClose, networkServices }: { onClose: () => void; networkServices: Array<{ slug: string; name: string }> }) {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createItem>[0]) => createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "itemCatalog"] });
    },
  });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    rarity: "common" as const,
    type: "cosmetic" as const,
    services: [] as string[],
    allServices: true,
    isStackable: false,
    isConsumable: false,
    iconUrl: "",
    previewUrl: "",
    backgroundColor: "",
    maxPerUser: "",
    assetUrl: "",
    code: "",
    // Wallpaper background config
    backgroundType: "solid" as "solid" | "gradient" | "image",
    bgColor: "#1a1a2e",
    bgGradientFrom: "#1a1a2e",
    bgGradientTo: "#0a0a0f",
    bgGradientDirection: "to bottom right",
    bgImageUrl: "",
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await fetch("/api/admin/upload-background", {
        method: "POST",
        headers: { "Content-Type": file.type, "x-filename": `${Date.now()}-${file.name}` },
        body: file,
      });
      const data = await res.json();
      if (data.url) setForm((f) => ({ ...f, bgImageUrl: data.url }));
      else alert(data.error || "Upload failed");
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const buildMetadata = () => {
    if (form.type !== "wallpaper") return undefined;
    const meta: Record<string, unknown> = {
      isEquippable: true,
      backgroundType: form.backgroundType,
    };
    if (form.backgroundType === "solid") meta.color = form.bgColor;
    if (form.backgroundType === "gradient") {
      meta.gradientFrom = form.bgGradientFrom;
      meta.gradientTo = form.bgGradientTo;
      meta.gradientDirection = form.bgGradientDirection;
    }
    if (form.backgroundType === "image") meta.imageUrl = form.bgImageUrl;
    return meta;
  };

  const handleSave = async () => {
    if (!form.slug || !form.name || !form.description) return;
    setSaving(true);
    try {
      await createMutation.mutateAsync({
        slug: form.slug,
        name: form.name,
        description: form.description,
        rarity: form.rarity,
        type: form.type,
        services: form.allServices ? undefined : form.services,
        isStackable: form.isStackable,
        isConsumable: form.isConsumable,
        iconUrl: form.iconUrl || undefined,
        previewUrl: form.previewUrl || undefined,
        backgroundColor: form.backgroundColor || undefined,
        maxPerUser: form.maxPerUser ? parseInt(form.maxPerUser) : undefined,
        assetUrl: form.assetUrl || undefined,
        code: form.code || undefined,
        metadata: buildMetadata(),
      });
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Create Item</ModalTitle>
          <CloseButton onClick={onClose}><X size={20} /></CloseButton>
        </ModalHeader>

        <FormGroup>
          <Label>Slug *</Label>
          <Input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            placeholder="golden-crown"
          />
        </FormGroup>

        <FormGroup>
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Golden Crown" />
        </FormGroup>

        <FormGroup>
          <Label>Description *</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A shimmering crown..." rows={2} />
        </FormGroup>

        <FormRow>
          <FormGroup>
            <Label>Rarity</Label>
            <Select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value as any })}>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Type</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
              <option value="cosmetic">Cosmetic</option>
              <option value="wallpaper">Wallpaper</option>
              <option value="consumable">Consumable</option>
              <option value="download">Download</option>
              <option value="code">Code</option>
              <option value="role">Role</option>
              <option value="collectible">Collectible</option>
            </Select>
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label>Services</Label>
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={form.allServices}
              onChange={(e) => setForm({ ...form, allServices: e.target.checked, services: [] })}
            />
            All Services (network-wide)
          </CheckboxLabel>
          {!form.allServices && (
            <ServiceChips>
              {networkServices.map((s) => (
                <ServiceChip
                  key={s.slug}
                  $active={form.services.includes(s.slug)}
                  onClick={() =>
                    setForm({
                      ...form,
                      services: form.services.includes(s.slug)
                        ? form.services.filter((x) => x !== s.slug)
                        : [...form.services, s.slug],
                    })
                  }
                >
                  {s.name}
                </ServiceChip>
              ))}
              {networkServices.length === 0 && (
                <HintText>No services registered in Netvulo</HintText>
              )}
            </ServiceChips>
          )}
        </FormGroup>

        <FormGroup>
          <Label>Icon URL</Label>
          <Input value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} placeholder="https://..." />
        </FormGroup>

        {form.type === "wallpaper" && (
          <WallpaperConfigSection>
            <Label>Background Config</Label>
            <FormGroup>
              <Select value={form.backgroundType} onChange={(e) => setForm({ ...form, backgroundType: e.target.value as any })}>
                <option value="solid">Solid Color</option>
                <option value="gradient">Gradient</option>
                <option value="image">Image</option>
              </Select>
            </FormGroup>
            {form.backgroundType === "solid" && (
              <FormGroup>
                <Label>Color</Label>
                <ColorRow>
                  <ColorInput type="color" value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} />
                  <Input value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} placeholder="#1a1a2e" />
                </ColorRow>
              </FormGroup>
            )}
            {form.backgroundType === "gradient" && (
              <>
                <FormRow>
                  <FormGroup>
                    <Label>From</Label>
                    <ColorRow>
                      <ColorInput type="color" value={form.bgGradientFrom} onChange={(e) => setForm({ ...form, bgGradientFrom: e.target.value })} />
                      <Input value={form.bgGradientFrom} onChange={(e) => setForm({ ...form, bgGradientFrom: e.target.value })} />
                    </ColorRow>
                  </FormGroup>
                  <FormGroup>
                    <Label>To</Label>
                    <ColorRow>
                      <ColorInput type="color" value={form.bgGradientTo} onChange={(e) => setForm({ ...form, bgGradientTo: e.target.value })} />
                      <Input value={form.bgGradientTo} onChange={(e) => setForm({ ...form, bgGradientTo: e.target.value })} />
                    </ColorRow>
                  </FormGroup>
                </FormRow>
                <FormGroup>
                  <Label>Direction</Label>
                  <Select value={form.bgGradientDirection} onChange={(e) => setForm({ ...form, bgGradientDirection: e.target.value })}>
                    <option value="to bottom">Top to Bottom</option>
                    <option value="to right">Left to Right</option>
                    <option value="to bottom right">Diagonal (Top-Left to Bottom-Right)</option>
                    <option value="to bottom left">Diagonal (Top-Right to Bottom-Left)</option>
                  </Select>
                </FormGroup>
              </>
            )}
            {form.backgroundType === "image" && (
              <FormGroup>
                <Label>Background Image</Label>
                {form.bgImageUrl && <BgPreview src={form.bgImageUrl} alt="Preview" />}
                <FileInput
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  disabled={uploading}
                />
                {uploading && <HintText>Uploading...</HintText>}
              </FormGroup>
            )}
            <BgPreviewCard style={
              form.backgroundType === "solid"
                ? { backgroundColor: form.bgColor }
                : form.backgroundType === "gradient"
                ? { backgroundImage: `linear-gradient(${form.bgGradientDirection}, ${form.bgGradientFrom}, ${form.bgGradientTo})` }
                : form.bgImageUrl
                ? { backgroundImage: `url(${form.bgImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { backgroundColor: "#0a0a0f" }
            }>
              <BgPreviewLabel>Preview</BgPreviewLabel>
            </BgPreviewCard>
          </WallpaperConfigSection>
        )}

        <FormRow>
          <CheckboxLabel>
            <input type="checkbox" checked={form.isStackable} onChange={(e) => setForm({ ...form, isStackable: e.target.checked })} />
            Stackable
          </CheckboxLabel>
          <CheckboxLabel>
            <input type="checkbox" checked={form.isConsumable} onChange={(e) => setForm({ ...form, isConsumable: e.target.checked })} />
            Consumable
          </CheckboxLabel>
        </FormRow>

        <ModalActions>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving || !form.slug || !form.name || !form.description}>
            {saving ? "Creating..." : "Create Item"}
          </PrimaryButton>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
}

function EditItemModal({ itemId, onClose, networkServices }: { itemId: number; onClose: () => void; networkServices: Array<{ slug: string; name: string }> }) {
  const queryClient = useQueryClient();
  const { data: items } = useRQ({
    queryKey: ["admin", "itemCatalog", true],
    queryFn: () => getItemCatalog({ includeArchived: true }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateItem>[1] }) => updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "itemCatalog"] });
    },
  });
  const [saving, setSaving] = useState(false);

  const item = items?.find((i) => i.id === itemId);

  const [form, setForm] = useState({
    name: "",
    description: "",
    rarity: "common" as string,
    type: "cosmetic" as string,
    services: [] as string[],
    allServices: true,
    iconUrl: "",
    // Wallpaper background config
    backgroundType: "solid" as "solid" | "gradient" | "image",
    bgColor: "#1a1a2e",
    bgGradientFrom: "#1a1a2e",
    bgGradientTo: "#0a0a0f",
    bgGradientDirection: "to bottom right",
    bgImageUrl: "",
  });
  const [uploading, setUploading] = useState(false);

  // Initialize form when item loads
  if (item && form.name === "" && item.name !== "") {
    const meta = (item as any).metadata as Record<string, any> | undefined;
    const services = item.services as string[] | null;
    setForm({
      name: item.name,
      description: item.description,
      rarity: item.rarity,
      type: item.type,
      services: services || [],
      allServices: !services || services.length === 0,
      iconUrl: item.iconUrl || "",
      backgroundType: meta?.backgroundType || "solid",
      bgColor: meta?.color || "#1a1a2e",
      bgGradientFrom: meta?.gradientFrom || "#1a1a2e",
      bgGradientTo: meta?.gradientTo || "#0a0a0f",
      bgGradientDirection: meta?.gradientDirection || "to bottom right",
      bgImageUrl: meta?.imageUrl || "",
    });
  }

  const handleEditImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await fetch("/api/admin/upload-background", {
        method: "POST",
        headers: { "Content-Type": file.type, "x-filename": `${Date.now()}-${file.name}` },
        body: file,
      });
      const data = await res.json();
      if (data.url) setForm((f) => ({ ...f, bgImageUrl: data.url }));
      else alert(data.error || "Upload failed");
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const buildEditMetadata = () => {
    if (form.type !== "wallpaper") return undefined;
    const meta: Record<string, unknown> = {
      isEquippable: true,
      backgroundType: form.backgroundType,
    };
    if (form.backgroundType === "solid") meta.color = form.bgColor;
    if (form.backgroundType === "gradient") {
      meta.gradientFrom = form.bgGradientFrom;
      meta.gradientTo = form.bgGradientTo;
      meta.gradientDirection = form.bgGradientDirection;
    }
    if (form.backgroundType === "image") meta.imageUrl = form.bgImageUrl;
    return meta;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: itemId,
        data: {
          name: form.name || undefined,
          description: form.description || undefined,
          rarity: form.rarity,
          type: form.type,
          services: form.allServices ? [] : form.services,
          iconUrl: form.iconUrl || undefined,
          metadata: buildEditMetadata(),
        },
      });
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Edit Item</ModalTitle>
          <CloseButton onClick={onClose}><X size={20} /></CloseButton>
        </ModalHeader>

        <FormGroup>
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormGroup>

        <FormGroup>
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        </FormGroup>

        <FormRow>
          <FormGroup>
            <Label>Rarity</Label>
            <Select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })}>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Type</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="cosmetic">Cosmetic</option>
              <option value="wallpaper">Wallpaper</option>
              <option value="consumable">Consumable</option>
              <option value="download">Download</option>
              <option value="code">Code</option>
              <option value="role">Role</option>
              <option value="collectible">Collectible</option>
            </Select>
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label>Services</Label>
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={form.allServices}
              onChange={(e) => setForm({ ...form, allServices: e.target.checked, services: [] })}
            />
            All Services (network-wide)
          </CheckboxLabel>
          {!form.allServices && (
            <ServiceChips>
              {networkServices.map((s) => (
                <ServiceChip
                  key={s.slug}
                  $active={form.services.includes(s.slug)}
                  onClick={() =>
                    setForm({
                      ...form,
                      services: form.services.includes(s.slug)
                        ? form.services.filter((x) => x !== s.slug)
                        : [...form.services, s.slug],
                    })
                  }
                >
                  {s.name}
                </ServiceChip>
              ))}
              {networkServices.length === 0 && (
                <HintText>No services registered in Netvulo</HintText>
              )}
            </ServiceChips>
          )}
        </FormGroup>

        <FormGroup>
          <Label>Icon URL</Label>
          <Input value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} />
        </FormGroup>

        {form.type === "wallpaper" && (
          <WallpaperConfigSection>
            <Label>Background Config</Label>
            <FormGroup>
              <Select value={form.backgroundType} onChange={(e) => setForm({ ...form, backgroundType: e.target.value as any })}>
                <option value="solid">Solid Color</option>
                <option value="gradient">Gradient</option>
                <option value="image">Image</option>
              </Select>
            </FormGroup>
            {form.backgroundType === "solid" && (
              <FormGroup>
                <Label>Color</Label>
                <ColorRow>
                  <ColorInput type="color" value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} />
                  <Input value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} />
                </ColorRow>
              </FormGroup>
            )}
            {form.backgroundType === "gradient" && (
              <>
                <FormRow>
                  <FormGroup>
                    <Label>From</Label>
                    <ColorRow>
                      <ColorInput type="color" value={form.bgGradientFrom} onChange={(e) => setForm({ ...form, bgGradientFrom: e.target.value })} />
                      <Input value={form.bgGradientFrom} onChange={(e) => setForm({ ...form, bgGradientFrom: e.target.value })} />
                    </ColorRow>
                  </FormGroup>
                  <FormGroup>
                    <Label>To</Label>
                    <ColorRow>
                      <ColorInput type="color" value={form.bgGradientTo} onChange={(e) => setForm({ ...form, bgGradientTo: e.target.value })} />
                      <Input value={form.bgGradientTo} onChange={(e) => setForm({ ...form, bgGradientTo: e.target.value })} />
                    </ColorRow>
                  </FormGroup>
                </FormRow>
                <FormGroup>
                  <Label>Direction</Label>
                  <Select value={form.bgGradientDirection} onChange={(e) => setForm({ ...form, bgGradientDirection: e.target.value })}>
                    <option value="to bottom">Top to Bottom</option>
                    <option value="to right">Left to Right</option>
                    <option value="to bottom right">Diagonal (Top-Left to Bottom-Right)</option>
                    <option value="to bottom left">Diagonal (Top-Right to Bottom-Left)</option>
                  </Select>
                </FormGroup>
              </>
            )}
            {form.backgroundType === "image" && (
              <FormGroup>
                <Label>Background Image</Label>
                {form.bgImageUrl && <BgPreview src={form.bgImageUrl} alt="Preview" />}
                <FileInput
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleEditImageUpload(file);
                  }}
                  disabled={uploading}
                />
                {uploading && <HintText>Uploading...</HintText>}
              </FormGroup>
            )}
            <BgPreviewCard style={
              form.backgroundType === "solid"
                ? { backgroundColor: form.bgColor }
                : form.backgroundType === "gradient"
                ? { backgroundImage: `linear-gradient(${form.bgGradientDirection}, ${form.bgGradientFrom}, ${form.bgGradientTo})` }
                : form.bgImageUrl
                ? { backgroundImage: `url(${form.bgImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { backgroundColor: "#0a0a0f" }
            }>
              <BgPreviewLabel>Preview</BgPreviewLabel>
            </BgPreviewCard>
          </WallpaperConfigSection>
        )}

        <ModalActions>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </PrimaryButton>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
}

// ============================================
// Lootbox Templates Tab
// ============================================

function LootboxTemplatesTab() {
  const queryClient = useQueryClient();
  const { data: templates } = useRQ({
    queryKey: ["admin", "lootboxTemplates"],
    queryFn: () => getLootboxTemplates(),
  });
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateLootboxTemplate>[1] }) =>
      updateLootboxTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "lootboxTemplates"] });
    },
  });
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <SectionHeader>
        <div />
        <PrimaryButton onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Create Template
        </PrimaryButton>
      </SectionHeader>

      {!templates ? (
        <LoadingText>Loading templates...</LoadingText>
      ) : templates.length === 0 ? (
        <EmptyState>
          <Box size={48} />
          <p>No lootbox templates</p>
        </EmptyState>
      ) : (
        <TemplatesGrid>
          {templates.map((template) => (
            <TemplateCard key={template.id} $active={template.isActive}>
              <TemplateCardHeader>
                <div>
                  <TemplateName>{template.name}</TemplateName>
                  <TemplateMeta>
                    {(template.items as any[]).length} items &middot; Super Legends
                  </TemplateMeta>
                </div>
              </TemplateCardHeader>
              {template.description && <TemplateDesc>{template.description}</TemplateDesc>}
              <TemplateActions>
                <StatusBadge $active={template.isActive}>
                  {template.isActive ? "Active" : "Inactive"}
                </StatusBadge>
                <ActionButton
                  onClick={() =>
                    updateTemplateMutation.mutate({ id: template.id, data: { isActive: !template.isActive } })
                  }
                >
                  {template.isActive ? "Deactivate" : "Activate"}
                </ActionButton>
              </TemplateActions>
            </TemplateCard>
          ))}
        </TemplatesGrid>
      )}

      {showCreate && <CreateLootboxModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateLootboxModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const createTemplateMutation = useMutation({
    mutationFn: (data: Parameters<typeof createLootboxTemplate>[0]) => createLootboxTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "lootboxTemplates"] });
    },
  });
  const { data: items } = useRQ({
    queryKey: ["admin", "itemCatalog", false],
    queryFn: () => getItemCatalog({ includeArchived: false }),
  });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [selectedItems, setSelectedItems] = useState<
    Array<{ itemId: number; name: string }>
  >([]);

  const handleAddItem = (itemId: number, name: string) => {
    if (selectedItems.some((i) => i.itemId === itemId)) return;
    setSelectedItems([...selectedItems, { itemId, name }]);
  };

  const handleSave = async () => {
    if (!form.name || selectedItems.length === 0) return;
    setSaving(true);
    try {
      await createTemplateMutation.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        items: selectedItems.map((i) => i.itemId),
      });
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <LargeModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Create Lootbox Template</ModalTitle>
          <CloseButton onClick={onClose}><X size={20} /></CloseButton>
        </ModalHeader>

        <FormGroup>
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="January 2026 Legend Loot" />
        </FormGroup>

        <FormGroup>
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        </FormGroup>

        <FormGroup>
          <Label>Items (all granted on open)</Label>
          {selectedItems.map((si, idx) => (
            <SelectedItemRow key={si.itemId}>
              <span>{si.name}</span>
              <SmallButton onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== idx))}>
                <X size={12} />
              </SmallButton>
            </SelectedItemRow>
          ))}

          {items && (
            <ItemPickerDropdown>
              <Select onChange={(e) => {
                const item = items.find((i) => i.id === Number(e.target.value));
                if (item) handleAddItem(item.id, item.name);
                e.target.value = "";
              }}>
                <option value="">+ Add item...</option>
                {items.filter((i) => !selectedItems.some((si) => si.itemId === i.id)).map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.rarity})</option>
                ))}
              </Select>
            </ItemPickerDropdown>
          )}
        </FormGroup>

        <ModalActions>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving || !form.name || selectedItems.length === 0}>
            {saving ? "Creating..." : "Create Template"}
          </PrimaryButton>
        </ModalActions>
      </LargeModalContent>
    </ModalOverlay>
  );
}

// ============================================
// Ship & Send Tab
// ============================================

function ShipAndSendTab() {
  const queryClient = useQueryClient();
  const { data: templates } = useRQ({
    queryKey: ["admin", "lootboxTemplates"],
    queryFn: () => getLootboxTemplates(),
  });
  const { data: items } = useRQ({
    queryKey: ["admin", "itemCatalog", false],
    queryFn: () => getItemCatalog({ includeArchived: false }),
  });

  const shipLootboxMutation = useMutation({
    mutationFn: (data: Parameters<typeof shipLootbox>[0]) => shipLootbox(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
  const sendDirectItemMutation = useMutation({
    mutationFn: (data: Parameters<typeof sendDirectItem>[0]) => sendDirectItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  // User search
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const { data: searchedUsers } = useRQ({
    queryKey: ["admin", "searchUsers", userSearchQuery],
    queryFn: () => searchUsers(userSearchQuery),
    enabled: userSearchQuery.length >= 2,
  });
  const users = searchedUsers ?? [];

  const [shipping, setShipping] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Ship lootbox form
  const [shipTemplateId, setShipTemplateId] = useState("");
  const [shipTarget, setShipTarget] = useState<"tier1" | "tier2" | "all" | "specific">("all");
  const [shipUserIds, setShipUserIds] = useState<number[]>([]);

  // Direct send form
  const [sendItemId, setSendItemId] = useState("");
  const [sendTarget, setSendTarget] = useState<"tier1" | "tier2" | "all" | "specific">("all");
  const [sendUserIds, setSendUserIds] = useState<number[]>([]);

  const handleShipLootbox = async () => {
    if (!shipTemplateId) return;
    setShipping(true);
    setResult(null);
    try {
      if (shipTarget === "specific" && shipUserIds.length > 0) {
        // Ship to each specific user individually
        let shipped = 0;
        const template = templates?.find((t) => t.id === Number(shipTemplateId));
        for (const userId of shipUserIds) {
          await shipLootboxMutation.mutateAsync({
            userId,
            templateId: Number(shipTemplateId),
            boxStyle: "mystery_box",
            displayName: template?.name ?? "Lootbox",
          });
          shipped++;
        }
        setResult(`Shipped to ${shipped} users`);
      } else {
        // TODO: Batch ship by tier not yet supported in new API — ship individually
        setResult("Batch shipping by tier is not yet supported. Use specific users.");
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : "Failed"}`);
    } finally {
      setShipping(false);
    }
  };

  const handleSendItem = async () => {
    if (!sendItemId) return;
    setShipping(true);
    setResult(null);
    try {
      if (sendTarget === "specific" && sendUserIds.length > 0) {
        // Send to each specific user individually
        let sent = 0;
        for (const userId of sendUserIds) {
          await sendDirectItemMutation.mutateAsync({
            userId,
            itemId: Number(sendItemId),
          });
          sent++;
        }
        setResult(`Sent to ${sent} users`);
      } else {
        // TODO: Batch send by tier not yet supported in new API
        setResult("Batch sending by tier is not yet supported. Use specific users.");
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : "Failed"}`);
    } finally {
      setShipping(false);
    }
  };

  return (
    <ShipContainer>
      {result && <ResultBanner>{result}</ResultBanner>}

      <ShipSection>
        <SectionTitle><Box size={20} /> Ship Lootbox</SectionTitle>
        <FormGroup>
          <Label>Template</Label>
          <Select value={shipTemplateId} onChange={(e) => setShipTemplateId(e.target.value)}>
            <option value="">Select template...</option>
            {templates?.filter((t) => t.isActive).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup>
          <Label>Recipients</Label>
          <Select value={shipTarget} onChange={(e) => setShipTarget(e.target.value as any)}>
            <option value="all">All Subscribers</option>
            <option value="tier1">Tier 1+</option>
            <option value="tier2">Tier 2 Only</option>
            <option value="specific">Specific Users</option>
          </Select>
        </FormGroup>
        {shipTarget === "specific" && (
          <FormGroup>
            <Label>Select Users</Label>
            <UserMultiSelect
              users={users}
              selected={shipUserIds}
              onChange={setShipUserIds}
              searchQuery={userSearchQuery}
              onSearchChange={setUserSearchQuery}
            />
          </FormGroup>
        )}
        <PrimaryButton onClick={handleShipLootbox} disabled={shipping || !shipTemplateId}>
          {shipping ? "Shipping..." : "Ship Lootbox"}
        </PrimaryButton>
      </ShipSection>

      <ShipSection>
        <SectionTitle><Send size={20} /> Direct Send Item</SectionTitle>
        <FormGroup>
          <Label>Item</Label>
          <Select value={sendItemId} onChange={(e) => setSendItemId(e.target.value)}>
            <option value="">Select item...</option>
            {items?.map((item) => (
              <option key={item.id} value={item.id}>{item.name} ({item.rarity})</option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup>
          <Label>Recipients</Label>
          <Select value={sendTarget} onChange={(e) => setSendTarget(e.target.value as any)}>
            <option value="all">All Subscribers</option>
            <option value="tier1">Tier 1+</option>
            <option value="tier2">Tier 2 Only</option>
            <option value="specific">Specific Users</option>
          </Select>
        </FormGroup>
        {sendTarget === "specific" && (
          <FormGroup>
            <Label>Select Users</Label>
            <UserMultiSelect
              users={users}
              selected={sendUserIds}
              onChange={setSendUserIds}
              searchQuery={userSearchQuery}
              onSearchChange={setUserSearchQuery}
            />
          </FormGroup>
        )}
        <PrimaryButton onClick={handleSendItem} disabled={shipping || !sendItemId}>
          {shipping ? "Sending..." : "Send Item"}
        </PrimaryButton>
      </ShipSection>
    </ShipContainer>
  );
}

function UserMultiSelect({
  users,
  selected,
  onChange,
  searchQuery,
  onSearchChange,
}: {
  users: Array<{ id: number; displayName: string; username: string | null }>;
  selected: number[];
  onChange: (ids: number[]) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  return (
    <UserSelectContainer>
      <SearchBar style={{ marginBottom: 8 }}>
        <Search size={16} />
        <SearchInput
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </SearchBar>
      {selected.length > 0 && (
        <SelectedUsers>
          {selected.map((id) => {
            const user = users.find((u) => u.id === id);
            return (
              <SelectedUserChip key={id} onClick={() => onChange(selected.filter((s) => s !== id))}>
                {user?.displayName || `User ${id}`} <X size={12} />
              </SelectedUserChip>
            );
          })}
        </SelectedUsers>
      )}
      <Select
        onChange={(e) => {
          const val = Number(e.target.value);
          if (val && !selected.includes(val)) {
            onChange([...selected, val]);
          }
          e.target.value = "";
        }}
      >
        <option value="">+ Add user...</option>
        {users
          .filter((u) => !selected.includes(u.id))
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName} {u.username ? `(@${u.username})` : ""}
            </option>
          ))}
      </Select>
    </UserSelectContainer>
  );
}

// ============================================
// Tier Claimables Tab
// ============================================

function TierClaimablesTab() {
  const queryClient = useQueryClient();
  const { data: claimables } = useRQ({
    queryKey: ["admin", "tierClaimables"],
    queryFn: () => getTierClaimables(),
  });
  const { data: items } = useRQ({
    queryKey: ["admin", "itemCatalog", false],
    queryFn: () => getItemCatalog({ includeArchived: false }),
  });
  const createClaimableMutation = useMutation({
    mutationFn: (data: Parameters<typeof createTierClaimable>[0]) => createTierClaimable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tierClaimables"] });
    },
  });
  const deactivateMutation = useMutation({
    mutationFn: (id: number) => deactivateTierClaimable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tierClaimables"] });
    },
  });
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form
  const [newItemId, setNewItemId] = useState("");
  const [newTier, setNewTier] = useState<"tier1" | "tier2">("tier1");
  const [newHeadline, setNewHeadline] = useState("");

  const handleCreate = async () => {
    if (!newItemId) return;
    setCreating(true);
    try {
      await createClaimableMutation.mutateAsync({
        itemId: Number(newItemId),
        requiredTier: newTier,
        displayOrder: (claimables?.length ?? 0) + 1,
        headline: newHeadline || undefined,
      });
      setShowCreate(false);
      setNewItemId("");
      setNewHeadline("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <SectionHeader>
        <div />
        <PrimaryButton onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Create Claimable
        </PrimaryButton>
      </SectionHeader>

      {!claimables ? (
        <LoadingText>Loading...</LoadingText>
      ) : claimables.length === 0 ? (
        <EmptyState>
          <Gift size={48} />
          <p>No tier claimables</p>
        </EmptyState>
      ) : (
        <ClaimablesGrid>
          {claimables.map((c) => (
            <ClaimableCard key={c.id} $active={c.isActive}>
              <ClaimableInfo>
                <ClaimableName>{c.item?.name || "Unknown Item"}</ClaimableName>
                <ClaimableMeta>
                  {c.requiredTier === "tier2" ? "Super Legend II" : "Super Legend"}
                </ClaimableMeta>
                {c.headline && <ClaimableHeadline>{c.headline}</ClaimableHeadline>}
              </ClaimableInfo>
              <ClaimableActions>
                <StatusBadge $active={c.isActive}>
                  {c.isActive ? "Active" : "Inactive"}
                </StatusBadge>
                {c.isActive && (
                  <ActionButton onClick={() => deactivateMutation.mutate(c.id)}>Deactivate</ActionButton>
                )}
              </ClaimableActions>
            </ClaimableCard>
          ))}
        </ClaimablesGrid>
      )}

      {showCreate && (
        <ModalOverlay onClick={() => setShowCreate(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Create Tier Claimable</ModalTitle>
              <CloseButton onClick={() => setShowCreate(false)}><X size={20} /></CloseButton>
            </ModalHeader>
            <FormGroup>
              <Label>Item</Label>
              <Select value={newItemId} onChange={(e) => setNewItemId(e.target.value)}>
                <option value="">Select item...</option>
                {items?.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.rarity})</option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Required Tier</Label>
              <Select value={newTier} onChange={(e) => setNewTier(e.target.value as any)}>
                <option value="tier1">Super Legend (Tier 1+)</option>
                <option value="tier2">Super Legend II (Tier 2)</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Headline</Label>
              <Input value={newHeadline} onChange={(e) => setNewHeadline(e.target.value)} placeholder="Claim your crown!" />
            </FormGroup>
            <ModalActions>
              <SecondaryButton onClick={() => setShowCreate(false)}>Cancel</SecondaryButton>
              <PrimaryButton onClick={handleCreate} disabled={creating || !newItemId}>
                {creating ? "Creating..." : "Create"}
              </PrimaryButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
}

// ============================================
// Analytics Tab
// ============================================

function AnalyticsTab() {
  const { data: analytics } = useRQ({
    queryKey: ["admin", "inventoryAnalytics"],
    queryFn: () => getInventoryAnalytics(),
  });

  if (!analytics) return <LoadingText>Loading analytics...</LoadingText>;

  return (
    <AnalyticsContainer>
      <StatCards>
        <StatCard>
          <StatNumber>{analytics.totalItems}</StatNumber>
          <StatLabel>Items in Catalog</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{analytics.totalOwned}</StatNumber>
          <StatLabel>Items in Circulation</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{analytics.totalLootboxes}</StatNumber>
          <StatLabel>Lootboxes Shipped</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{analytics.totalClaims}</StatNumber>
          <StatLabel>Total Claims</StatLabel>
        </StatCard>
      </StatCards>

      <AnalyticsSection>
        <SectionTitle><Box size={20} /> Lootboxes</SectionTitle>
        <StatRow>
          <StatPair>
            <StatPairLabel>Total</StatPairLabel>
            <StatPairValue>{analytics.totalLootboxes}</StatPairValue>
          </StatPair>
          <StatPair>
            <StatPairLabel>Unopened</StatPairLabel>
            <StatPairValue>{analytics.unopenedLootboxes}</StatPairValue>
          </StatPair>
          <StatPair>
            <StatPairLabel>Total Claims</StatPairLabel>
            <StatPairValue>{analytics.totalClaims}</StatPairValue>
          </StatPair>
        </StatRow>
      </AnalyticsSection>
    </AnalyticsContainer>
  );
}

// ============================================
// Helpers
// ============================================


// ============================================
// Styled Components
// ============================================

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
`;

const AdminContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 700;
  color: ${(p) => p.theme.contrast};
`;

const Text = styled.p`
  margin: 0;
  color: ${(p) => p.theme.textColor};
  opacity: 0.7;
`;

const TabBar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 12px;
  overflow-x: auto;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${(p) => (p.$active ? "rgba(144, 116, 242, 0.2)" : "transparent")};
  border: 1px solid ${(p) => (p.$active ? "rgba(144, 116, 242, 0.4)" : "transparent")};
  border-radius: 8px;
  color: ${(p) => (p.$active ? p.theme.contrast : p.theme.textColor)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: rgba(144, 116, 242, 0.15);
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: ${(p) => p.theme.textColor};
  flex: 1;
  min-width: 200px;
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: ${(p) => p.theme.contrast};
  font-size: 14px;
  &:focus { outline: none; }
  &::placeholder { color: ${(p) => p.theme.textColor}; opacity: 0.4; }
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: ${(p) => p.theme.contrast};
  font-size: 14px;
  option { background: ${(p) => p.theme.background}; }
`;

const LoadingText = styled.p`
  color: ${(p) => p.theme.textColor};
  text-align: center;
  padding: 48px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
  svg { margin-bottom: 16px; opacity: 0.4; }
`;

const ItemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const ItemCard = styled.div<{ $archived?: boolean }>`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  opacity: ${(p) => (p.$archived ? 0.5 : 1)};
`;

const ItemCardTop = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const RarityBadge = styled.span<{ $rarity: Rarity }>`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
  background: ${(p) => RARITY_COLORS[p.$rarity].color};
`;

const TypeBadge = styled.span`
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 11px;
  color: ${(p) => p.theme.textColor};
`;

const ArchivedBadge = styled.span`
  padding: 2px 8px;
  background: rgba(239, 68, 68, 0.2);
  border-radius: 4px;
  font-size: 11px;
  color: #ef4444;
`;

const ItemIcon = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  margin-bottom: 8px;
`;

const ItemName = styled.h3`
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
`;

const ItemSlug = styled.code`
  display: block;
  font-size: 11px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.5;
  margin-bottom: 8px;
`;

const ItemDesc = styled.p`
  margin: 0 0 8px;
  font-size: 13px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CategoryBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  background: rgba(144, 116, 242, 0.15);
  border-radius: 4px;
  font-size: 11px;
  color: #9074f2;
  margin-bottom: 8px;
`;

const ItemActions = styled.div`
  display: flex;
  gap: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 12px;
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  padding: 6px 10px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: ${(p) => (p.$danger ? "#ef4444" : p.theme.textColor)};
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const TemplatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
`;

const TemplateCard = styled.div<{ $active: boolean }>`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid ${(p) => (p.$active ? "rgba(144, 116, 242, 0.3)" : "rgba(255, 255, 255, 0.1)")};
  border-radius: 12px;
  padding: 16px;
`;

const TemplateCardHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
`;

const TemplateName = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
`;

const TemplateMeta = styled.p`
  margin: 2px 0 0;
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
`;

const TemplateDesc = styled.p`
  margin: 0 0 12px;
  font-size: 13px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.8;
`;

const TemplateActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: ${(p) => (p.$active ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.1)")};
  color: ${(p) => (p.$active ? "#22c55e" : p.theme.textColor)};
`;

// Ship & Send styles
const ShipContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
`;

const ShipSection = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
`;

const ResultBanner = styled.div`
  grid-column: 1 / -1;
  padding: 12px 16px;
  background: rgba(144, 116, 242, 0.15);
  border: 1px solid rgba(144, 116, 242, 0.3);
  border-radius: 8px;
  color: ${(p) => p.theme.contrast};
  font-size: 14px;
`;

const UserSelectContainer = styled.div``;

const SelectedUsers = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
`;

const SelectedUserChip = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(144, 116, 242, 0.2);
  border: 1px solid rgba(144, 116, 242, 0.3);
  border-radius: 6px;
  color: ${(p) => p.theme.contrast};
  font-size: 12px;
  cursor: pointer;
  &:hover { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.3); }
`;

// Claimables styles
const ClaimablesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ClaimableCard = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid ${(p) => (p.$active ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.1)")};
  border-radius: 10px;
`;

const ClaimableInfo = styled.div`
  flex: 1;
`;

const ClaimableName = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
`;

const ClaimableMeta = styled.p`
  margin: 2px 0 0;
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
`;

const ClaimableHeadline = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  color: #f59e0b;
  font-style: italic;
`;

const ClaimableActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Analytics styles
const AnalyticsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const StatCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${(p) => p.theme.contrast};
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
  margin-top: 4px;
`;

const AnalyticsSection = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
`;


const StatRow = styled.div`
  display: flex;
  gap: 24px;
`;

const StatPair = styled.div``;

const StatPairLabel = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
`;

const StatPairValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${(p) => p.theme.contrast};
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
`;

const ModalContent = styled.div`
  background: ${(p) => p.theme.background};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
`;

const LargeModalContent = styled(ModalContent)`
  max-width: 600px;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
`;

const CloseButton = styled.button`
  padding: 8px;
  background: transparent;
  border: none;
  color: ${(p) => p.theme.textColor};
  cursor: pointer;
  opacity: 0.6;
  &:hover { opacity: 1; }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;
  & > * { flex: 1; }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: ${(p) => p.theme.contrast};
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: ${(p) => p.theme.contrast};
  font-size: 14px;
  box-sizing: border-box;
  &:focus { outline: none; border-color: rgba(144, 116, 242, 0.5); }
  &::placeholder { color: ${(p) => p.theme.textColor}; opacity: 0.4; }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: ${(p) => p.theme.contrast};
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  &:focus { outline: none; border-color: rgba(144, 116, 242, 0.5); }
  &::placeholder { color: ${(p) => p.theme.textColor}; opacity: 0.4; }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: ${(p) => p.theme.contrast};
  font-size: 14px;
  &:focus { outline: none; border-color: rgba(144, 116, 242, 0.5); }
  option { background: ${(p) => p.theme.background}; }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${(p) => p.theme.contrast};
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #9074f2 0%, #6366f1 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(144, 116, 242, 0.4); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SecondaryButton = styled.button`
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: ${(p) => p.theme.textColor};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.05); }
`;

const SmallButton = styled.button`
  padding: 4px;
  background: transparent;
  border: none;
  color: ${(p) => p.theme.textColor};
  cursor: pointer;
  opacity: 0.5;
  &:hover { opacity: 1; color: #ef4444; }
`;

const SelectedItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 13px;
  color: ${(p) => p.theme.contrast};
  span { flex: 1; }
`;

const ItemPickerDropdown = styled.div`
  margin-top: 8px;
`;

const ServiceBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
`;

const ServiceChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const ServiceChip = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  background: ${(p) => (p.$active ? "rgba(144, 116, 242, 0.25)" : "rgba(255, 255, 255, 0.05)")};
  border: 1px solid ${(p) => (p.$active ? "rgba(144, 116, 242, 0.5)" : "rgba(255, 255, 255, 0.1)")};
  border-radius: 6px;
  color: ${(p) => (p.$active ? "#b8a4f8" : p.theme.textColor)};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    background: rgba(144, 116, 242, 0.15);
    border-color: rgba(144, 116, 242, 0.3);
  }
`;

const HintText = styled.span`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.5;
  font-style: italic;
`;

const WallpaperConfigSection = styled.div`
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(144, 116, 242, 0.06);
  border: 1px solid rgba(144, 116, 242, 0.15);
  border-radius: 10px;
`;

const ColorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ColorInput = styled.input`
  width: 36px;
  height: 36px;
  padding: 2px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  &::-webkit-color-swatch-wrapper { padding: 2px; }
  &::-webkit-color-swatch { border: none; border-radius: 4px; }
`;

const FileInput = styled.input`
  width: 100%;
  padding: 8px;
  font-size: 13px;
  color: ${(p) => p.theme.textColor};
  &::file-selector-button {
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    color: ${(p) => p.theme.contrast};
    cursor: pointer;
    margin-right: 8px;
  }
`;

const BgPreview = styled.img`
  width: 100%;
  max-height: 100px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 8px;
`;

const BgPreviewCard = styled.div`
  width: 100%;
  height: 60px;
  border-radius: 8px;
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const BgPreviewLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
`;
