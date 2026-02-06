import {
  useMutation,
  useQuery as useRQ,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Archive,
  Download,
  Edit2,
  Eye,
  File,
  FileText,
  Film,
  Image,
  Lock,
  Package,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Head from "next/head";
import { useCallback, useRef, useState } from "react";
import styled from "styled-components";
import { BlogView } from "../../../components/layout/blog";
import { SimpleNavbar } from "../../../components/navbar/simple";
import { getMe } from "@/src/db/client/me";
import {
  archiveVaultFile,
  createVaultFile,
  deleteVaultFile,
  getVaultFile,
  listVaultFiles,
  unarchiveVaultFile,
  updateVaultFile,
} from "@/src/db/client/admin-vault";

export const getServerSideProps = () => ({ props: {} });

type TabType = "files" | "upload";
type FileType = "pdf" | "video" | "document" | "image" | "archive";
type Visibility = "public" | "members" | "tier1" | "tier2";

const FILE_TYPE_ICONS: Record<FileType, typeof File> = {
  pdf: FileText,
  video: Film,
  document: File,
  image: Image,
  archive: Package,
};

const VISIBILITY_LABELS: Record<Visibility, string> = {
  public: "Public",
  members: "Members Only",
  tier1: "Super Legend",
  tier2: "Super Legend II",
};

export default function VaultAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("files");
  const { data: me } = useRQ({
    queryKey: ["me"],
    queryFn: () => getMe(),
    staleTime: 30_000,
  });
  const isCreator = me?.isCreator ?? false;
  const isLoading = me === undefined;

  if (isLoading) {
    return (
      <BlogView>
        <SimpleNavbar title="Vault Admin" />
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
          <title>Access Denied | Vault Admin</title>
        </Head>
        <BlogView>
          <SimpleNavbar title="Vault Admin" />
          <Container>
            <Title>Access Denied</Title>
            <Text>You don't have permission to access the vault admin panel.</Text>
          </Container>
        </BlogView>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Vault Admin | Nevulo</title>
      </Head>
      <BlogView>
        <SimpleNavbar title="Vault Admin" />
        <AdminContainer>
          <Header>
            <Title>Vault Admin</Title>
            <Text>Manage downloadable files and exclusive content</Text>
          </Header>

          <TabBar>
            <Tab $active={activeTab === "files"} onClick={() => setActiveTab("files")}>
              <File size={16} /> Files
            </Tab>
            <Tab $active={activeTab === "upload"} onClick={() => setActiveTab("upload")}>
              <Upload size={16} /> Upload
            </Tab>
          </TabBar>

          <TabContent>
            {activeTab === "files" && <FilesTab />}
            {activeTab === "upload" && <UploadTab onSuccess={() => setActiveTab("files")} />}
          </TabContent>
        </AdminContainer>
      </BlogView>
    </>
  );
}

function FilesTab() {
  const queryClient = useQueryClient();
  const { data: files } = useRQ({
    queryKey: ["admin", "vaultFiles", true],
    queryFn: () => listVaultFiles({ includeArchived: true }),
  });
  const archiveMut = useMutation({
    mutationFn: (id: number) => archiveVaultFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vaultFiles"] });
    },
  });
  const unarchiveMut = useMutation({
    mutationFn: (id: number) => unarchiveVaultFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vaultFiles"] });
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteVaultFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vaultFiles"] });
    },
  });
  const [editingFile, setEditingFile] = useState<number | null>(null);

  if (!files) {
    return <LoadingText>Loading files...</LoadingText>;
  }

  if (files.length === 0) {
    return (
      <EmptyState>
        <Package size={48} />
        <p>No files uploaded yet</p>
        <p>Go to the Upload tab to add your first file.</p>
      </EmptyState>
    );
  }

  const handleArchive = async (fileId: number, isArchived: boolean) => {
    if (isArchived) {
      await unarchiveMut.mutateAsync(fileId);
    } else {
      await archiveMut.mutateAsync(fileId);
    }
  };

  const handleDelete = async (fileId: number, title: string) => {
    if (confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      await deleteMut.mutateAsync(fileId);
    }
  };

  return (
    <FilesGrid>
      {files.map((file) => {
        const Icon = FILE_TYPE_ICONS[file.fileType as FileType];
        return (
          <FileCard key={file.id} $archived={file.isArchived}>
            <FileCardHeader>
              <FileIconWrapper $type={file.fileType as FileType}>
                <Icon size={24} />
              </FileIconWrapper>
              <FileInfo>
                <FileName>{file.title}</FileName>
                <FileMeta>
                  {file.filename} • {formatFileSize(file.fileSize)}
                </FileMeta>
              </FileInfo>
            </FileCardHeader>

            <FileCardBody>
              {file.description && <FileDescription>{file.description}</FileDescription>}
              <FileStats>
                <StatBadge>
                  <Lock size={12} />
                  {VISIBILITY_LABELS[file.visibility as Visibility]}
                </StatBadge>
                <StatBadge>
                  <Download size={12} />
                  {file.downloadCount} downloads
                </StatBadge>
              </FileStats>
            </FileCardBody>

            <FileCardActions>
              <ActionButton onClick={() => window.open(file.fileUrl, "_blank")} title="Preview">
                <Eye size={16} />
              </ActionButton>
              <ActionButton onClick={() => setEditingFile(file.id)} title="Edit">
                <Edit2 size={16} />
              </ActionButton>
              <ActionButton
                onClick={() => handleArchive(file.id, file.isArchived)}
                title={file.isArchived ? "Unarchive" : "Archive"}
              >
                <Archive size={16} />
              </ActionButton>
              <ActionButton
                $danger
                onClick={() => handleDelete(file.id, file.title)}
                title="Delete permanently"
              >
                <Trash2 size={16} />
              </ActionButton>
            </FileCardActions>

            {file.isArchived && <ArchivedBadge>Archived</ArchivedBadge>}
          </FileCard>
        );
      })}

      {editingFile && <EditModal fileId={editingFile} onClose={() => setEditingFile(null)} />}
    </FilesGrid>
  );
}

interface EditModalProps {
  fileId: number;
  onClose: () => void;
}

function EditModal({ fileId, onClose }: EditModalProps) {
  const queryClient = useQueryClient();
  const { data: file } = useRQ({
    queryKey: ["admin", "vaultFile", fileId],
    queryFn: () => getVaultFile(fileId),
    enabled: !!fileId,
  });
  const updateMut = useMutation({
    mutationFn: (data: Parameters<typeof updateVaultFile>[1]) =>
      updateVaultFile(fileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vaultFiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "vaultFile", fileId] });
    },
  });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [saving, setSaving] = useState(false);

  // Update form values when file data changes
  if (file && title === "" && file.title !== "") {
    setTitle(file.title);
    setDescription(file.description || "");
    setSlug(file.slug);
    setVisibility(file.visibility as Visibility);
  }

  const handleSave = async () => {
    if (!title || !slug) return;

    setSaving(true);
    try {
      await updateMut.mutateAsync({
        title,
        description: description || undefined,
        slug,
        visibility,
      });
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update file");
    } finally {
      setSaving(false);
    }
  };

  if (!file) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <p>Loading...</p>
        </ModalContent>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Edit File</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <FormGroup>
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="File title"
          />
        </FormGroup>

        <FormGroup>
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="file-slug" />
        </FormGroup>

        <FormGroup>
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
          />
        </FormGroup>

        <FormGroup>
          <Label>Visibility</Label>
          <Select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
            <option value="public">Public</option>
            <option value="members">Members Only</option>
            <option value="tier1">Super Legend (Tier 1+)</option>
            <option value="tier2">Super Legend II (Tier 2)</option>
          </Select>
        </FormGroup>

        <ModalActions>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving || !title || !slug}>
            {saving ? "Saving..." : "Save Changes"}
          </PrimaryButton>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
}

interface UploadTabProps {
  onSuccess: () => void;
}

function UploadTab({ onSuccess }: UploadTabProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("tier1");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const createMut = useMutation({
    mutationFn: (data: Parameters<typeof createVaultFile>[0]) => createVaultFile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vaultFiles"] });
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    // Auto-generate title and slug from filename
    const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
    setTitle(nameWithoutExt.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
    setSlug(nameWithoutExt.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  };

  const handleThumbnailSelect = (selectedFile: File) => {
    setThumbnail(selectedFile);
    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setThumbnailPreview(url);
  };

  const clearThumbnail = () => {
    setThumbnail(null);
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleUpload = async () => {
    if (!file || !title || !slug) return;

    setUploading(true);
    setUploadProgress("Reading file...");

    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadProgress("Uploading file to storage...");

      // Upload to Vercel Blob via API
      const uploadResponse = await fetch("/api/vault/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64,
          filename: file.name,
        }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Upload failed");
      }

      const uploadResult = await uploadResponse.json();

      // Upload thumbnail if provided
      let thumbnailUrl: string | undefined;
      if (thumbnail) {
        setUploadProgress("Uploading thumbnail...");

        const thumbnailBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(thumbnail);
        });

        const thumbResponse = await fetch("/api/vault/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: thumbnailBase64,
            filename: `thumb-${thumbnail.name}`,
          }),
        });

        if (thumbResponse.ok) {
          const thumbResult = await thumbResponse.json();
          thumbnailUrl = thumbResult.url;
        }
      }

      setUploadProgress("Creating vault entry...");

      // Create vault file in Postgres
      await createMut.mutateAsync({
        title,
        description: description || undefined,
        slug,
        fileType: uploadResult.fileType,
        fileUrl: uploadResult.url,
        thumbnailUrl,
        filename: uploadResult.filename,
        mimeType: uploadResult.mimeType,
        fileSize: uploadResult.fileSize,
        visibility,
      });

      setUploadProgress("Done!");

      // Reset form and switch to files tab
      setFile(null);
      setThumbnail(null);
      setThumbnailPreview(null);
      setTitle("");
      setSlug("");
      setDescription("");
      onSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  return (
    <UploadContainer>
      <DropZone
        $dragOver={dragOver}
        $hasFile={!!file}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          style={{ display: "none" }}
          accept=".pdf,.mp4,.webm,.mov,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.rtf,.jpg,.jpeg,.png,.webp,.gif,.svg,.zip,.rar,.7z,.gz"
        />
        {file ? (
          <>
            <FilePreviewIcon>{getFileIcon(file.type)}</FilePreviewIcon>
            <DropZoneText>{file.name}</DropZoneText>
            <DropZoneSubtext>{formatFileSize(file.size)}</DropZoneSubtext>
          </>
        ) : (
          <>
            <Upload size={48} />
            <DropZoneText>Drop a file here or click to browse</DropZoneText>
            <DropZoneSubtext>
              PDFs (50MB), Videos (100MB), Documents (25MB), Images (10MB), Archives (100MB)
            </DropZoneSubtext>
          </>
        )}
      </DropZone>

      {file && (
        <MetadataForm>
          <FormGroup>
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Display title"
            />
          </FormGroup>

          <FormGroup>
            <Label>Slug *</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-friendly-slug"
            />
            <HelpText>Used in URLs: /vault/{slug || "your-slug"}</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </FormGroup>

          <FormGroup>
            <Label>Custom Thumbnail (optional)</Label>
            <ThumbnailUploadArea>
              {thumbnailPreview ? (
                <ThumbnailPreview>
                  <ThumbnailImage src={thumbnailPreview} alt="Thumbnail preview" />
                  <ThumbnailRemove onClick={clearThumbnail}>
                    <X size={16} />
                  </ThumbnailRemove>
                </ThumbnailPreview>
              ) : (
                <ThumbnailDropZone onClick={() => thumbnailInputRef.current?.click()}>
                  <Image size={24} />
                  <span>Click to add thumbnail</span>
                </ThumbnailDropZone>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleThumbnailSelect(e.target.files[0])}
                style={{ display: "none" }}
              />
            </ThumbnailUploadArea>
            <HelpText>Recommended: 16:9 aspect ratio, at least 640x360px</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Visibility</Label>
            <Select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
            >
              <option value="public">Public - Anyone can access</option>
              <option value="members">Members Only - Logged in users</option>
              <option value="tier1">Super Legend - Tier 1+ supporters</option>
              <option value="tier2">Super Legend II - Tier 2 supporters only</option>
            </Select>
            <HelpText>
              Tier-restricted files appear in the vault with a lock icon for non-supporters
            </HelpText>
          </FormGroup>

          <UploadButton onClick={handleUpload} disabled={uploading || !title || !slug}>
            {uploading ? (
              <>
                <Spinner /> {uploadProgress}
              </>
            ) : (
              <>
                <Plus size={20} /> Upload File
              </>
            )}
          </UploadButton>
        </MetadataForm>
      )}
    </UploadContainer>
  );
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("video/")) return <Film size={48} />;
  if (mimeType.startsWith("image/")) return <Image size={48} />;
  if (mimeType === "application/pdf") return <FileText size={48} />;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z")) {
    return <Package size={48} />;
  }
  return <File size={48} />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Styled components
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
  color: ${(props) => props.theme.contrast};
`;

const Text = styled.p`
  margin: 0;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
`;

const TabBar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 12px;
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
  transition: all 0.2s;

  &:hover {
    background: rgba(144, 116, 242, 0.15);
  }
`;

const TabContent = styled.div``;

const LoadingText = styled.p`
  color: ${(props) => props.theme.textColor};
  text-align: center;
  padding: 48px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;

  svg {
    margin-bottom: 16px;
    opacity: 0.4;
  }

  p {
    margin: 4px 0;
  }
`;

const FilesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  width: 100%;
`;

const FileCard = styled.div<{ $archived?: boolean }>`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  position: relative;
  opacity: ${(p) => (p.$archived ? 0.5 : 1)};
`;

const FileCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

const FileIconWrapper = styled.div<{ $type: FileType }>`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${(p) => {
    switch (p.$type) {
      case "pdf":
        return "rgba(239, 68, 68, 0.2)";
      case "video":
        return "rgba(59, 130, 246, 0.2)";
      case "image":
        return "rgba(34, 197, 94, 0.2)";
      case "archive":
        return "rgba(168, 85, 247, 0.2)";
      default:
        return "rgba(144, 116, 242, 0.2)";
    }
  }};
  color: ${(p) => {
    switch (p.$type) {
      case "pdf":
        return "#ef4444";
      case "video":
        return "#3b82f6";
      case "image":
        return "#22c55e";
      case "archive":
        return "#a855f7";
      default:
        return "#9074f2";
    }
  }};
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.h3`
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileMeta = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileCardBody = styled.div`
  margin-bottom: 12px;
`;

const FileDescription = styled.p`
  margin: 0 0 8px;
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const FileStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const StatBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 11px;
  color: ${(props) => props.theme.textColor};
`;

const FileCardActions = styled.div`
  display: flex;
  gap: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 12px;
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  padding: 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: ${(p) => (p.$danger ? "#ef4444" : p.theme.textColor)};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$danger ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.05)")};
    border-color: ${(p) => (p.$danger ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.2)")};
  }
`;

const ArchivedBadge = styled.span`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 11px;
  color: ${(props) => props.theme.textColor};
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
  background: ${(props) => props.theme.background};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
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
  color: ${(props) => props.theme.contrast};
`;

const CloseButton = styled.button`
  padding: 8px;
  background: transparent;
  border: none;
  color: ${(props) => props.theme.textColor};
  cursor: pointer;
  opacity: 0.6;

  &:hover {
    opacity: 1;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

// Upload styles
const UploadContainer = styled.div`
  max-width: 600px;
`;

const DropZone = styled.div<{ $dragOver: boolean; $hasFile: boolean }>`
  border: 2px dashed
    ${(p) =>
      p.$dragOver
        ? "rgba(144, 116, 242, 0.6)"
        : p.$hasFile
          ? "rgba(34, 197, 94, 0.4)"
          : "rgba(255, 255, 255, 0.2)"};
  border-radius: 16px;
  padding: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(p) =>
    p.$dragOver
      ? "rgba(144, 116, 242, 0.1)"
      : p.$hasFile
        ? "rgba(34, 197, 94, 0.05)"
        : "transparent"};

  &:hover {
    border-color: rgba(144, 116, 242, 0.4);
    background: rgba(144, 116, 242, 0.05);
  }

  svg {
    color: ${(p) => (p.$hasFile ? "#22c55e" : p.theme.textColor)};
    opacity: ${(p) => (p.$hasFile ? 1 : 0.4)};
    margin-bottom: 16px;
  }
`;

const FilePreviewIcon = styled.div`
  color: #22c55e;
`;

const DropZoneText = styled.p`
  margin: 0 0 8px;
  font-size: 16px;
  color: ${(props) => props.theme.contrast};
`;

const DropZoneSubtext = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const MetadataForm = styled.div`
  margin-top: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: ${(props) => props.theme.contrast};
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: ${(props) => props.theme.contrast};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: rgba(144, 116, 242, 0.5);
  }

  &::placeholder {
    color: ${(props) => props.theme.textColor};
    opacity: 0.4;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: ${(props) => props.theme.contrast};
  font-size: 14px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: rgba(144, 116, 242, 0.5);
  }

  &::placeholder {
    color: ${(props) => props.theme.textColor};
    opacity: 0.4;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: ${(props) => props.theme.contrast};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: rgba(144, 116, 242, 0.5);
  }

  option {
    background: ${(props) => props.theme.background};
  }
`;

const HelpText = styled.p`
  margin: 4px 0 0;
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.5;
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, #9074f2 0%, #6366f1 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 24px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(144, 116, 242, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const SecondaryButton = styled.button`
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: ${(props) => props.theme.textColor};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const PrimaryButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #9074f2 0%, #6366f1 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(144, 116, 242, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Thumbnail upload styles
const ThumbnailUploadArea = styled.div`
  width: 100%;
`;

const ThumbnailDropZone = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;

  &:hover {
    border-color: rgba(144, 116, 242, 0.4);
    opacity: 1;
  }

  span {
    font-size: 13px;
  }
`;

const ThumbnailPreview = styled.div`
  position: relative;
  width: 200px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbnailRemove = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.8);
  }
`;
