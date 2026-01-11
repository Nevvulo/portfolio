import Head from "next/head";
import styled from "styled-components";
import { useQuery, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { BlogView } from "../../../components/layout/blog";
import { SimpleNavbar } from "../../../components/navbar/simple";
import { useTierAccess } from "../../../hooks/lounge/useTierAccess";
import {
  FolderOpen,
  Database,
  Check,
  AlertCircle,
  Play,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  X,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

// Migration data for seeding
const TECHNOLOGIES_SEED = [
  { key: "REACT", label: "React", color: "#26a69a" },
  { key: "JAVASCRIPT", label: "JavaScript", color: "#ff9800" },
  { key: "TYPESCRIPT", label: "TypeScript", color: "#007acc" },
  { key: "SWIFT", label: "Swift", color: "#F05138" },
  { key: "JAVA", label: "Java", color: "#f89820" },
  { key: "PYTHON", label: "Python", color: "#1976d2" },
  { key: "NODEJS", label: "Node.js", color: "#66bb6a" },
  { key: "HTML", label: "HTML", color: "#ef5350" },
  { key: "CSS", label: "CSS", color: "#673ab7" },
  { key: "VISUAL_BASIC", label: "Visual Basic", color: "#ba68c8" },
  { key: "CPP", label: "C++", color: "#ec407a" },
  { key: "RETHINKDB", label: "RethinkDB", color: "#007acc" },
  { key: "REDIS", label: "Redis", color: "#D82C20" },
  { key: "CSHARP", label: "C#", color: "#239120" },
  { key: "MONGODB", label: "MongoDB", color: "#47A248" },
  { key: "EFCORE", label: "EF Core", color: "#512BD4" },
];

const ROLES_SEED = [
  {
    key: "CONTRIBUTOR",
    label: "Contributor",
    description: "I've provided one or more meaningful pull requests to an open-source project that were accepted.",
    color: "#00838f",
  },
  {
    key: "PLUGIN_DEVELOPER",
    label: "Plugin Developer",
    description: "This project implements plugins which provide modifications to the base experience, and I have developed a plugin that extends functionality but isn't part of the core project.",
    color: "grey",
  },
  {
    key: "PAST_LEAD_DEVELOPER",
    label: "Past Lead Developer",
    description: "This project was mostly or fully developed solely by me but no longer maintained.",
    color: "#49704b",
  },
  {
    key: "LEAD_DEVELOPER",
    label: "Lead Developer",
    description: "This project is mostly or fully developed solely by me and actively maintained.",
    color: "#2e7d32",
  },
  {
    key: "PAST_DEVELOPER",
    label: "Past Developer",
    description: "I was previously one of the developers for this project.",
    color: "#678253",
  },
  {
    key: "DEVELOPER",
    label: "Developer",
    description: "I am one of the developers for this project.",
    color: "#558b2f",
  },
];

const PROJECTS_SEED = [
  {
    slug: "unloan",
    name: "Unloan",
    shortDescription: "Australia's first digital home loan",
    background: "linear-gradient(30deg, #1f005c, #260062, #3d0074, #67008d, #ab00ad, #d10098, #f5006b, #ff1a3c, #ff4e3a, #ff8953, #ffaa65, #ffb56b)",
    logoUrl: "/assets/svg/projects/logo/unloan-white.svg",
    logoDarkUrl: "/assets/svg/projects/logo/unloan-logo-black.svg",
    logoWidth: 208,
    logoHeight: 50,
    status: "active" as const,
    maintained: true,
    timeline: { startYear: 2022, startMonth: 6 },
    links: { website: "https://www.unloan.com.au" },
    technologies: ["REACT", "TYPESCRIPT", "NODEJS"],
    roles: ["DEVELOPER"],
    contentSections: [
      {
        id: "intro",
        emoji: "🏠",
        header: "Digital home loans, simplified",
        text: "Unloan is Australia's first digital home loan built by Commonwealth Bank. We've reimagined the home loan experience with modern technology and transparent pricing to make homeownership more accessible for Australians.",
      },
      {
        id: "innovation",
        emoji: "💡",
        header: "Innovation at CBA",
        subheader: "Building the future of home lending",
        subheaderColor: "#F2FF00",
        text: "Working at Unloan for Commonwealth Bank, I help develop cutting-edge fintech solutions that leverage CBA's banking expertise with modern technology. Our focus is on creating user-friendly interfaces and seamless experiences that make getting a home loan as simple as possible.",
      },
      {
        id: "tech",
        emoji: "🚀",
        header: "Modern technology stack",
        text: "Built with React and TypeScript for the frontend, with robust Node.js services powering the backend. We focus on performance, security, and user experience to deliver a best-in-class digital lending platform.",
      },
    ],
    order: 0,
  },
  {
    slug: "flux",
    name: "Flux",
    shortDescription: "Helping 200,000 Aussies win at money",
    background: "linear-gradient(135deg, rgba(108, 234, 156, 0.15), rgba(108, 234, 156, 0.2), rgba(108, 234, 156, 0.25))",
    logoUrl: "/assets/svg/projects/logo/flux-white.svg",
    logoDarkUrl: "/assets/svg/projects/logo/flux-dark.svg",
    logoWidth: 180,
    logoHeight: 180,
    status: "active" as const,
    maintained: true,
    timeline: { startYear: 2023, startMonth: 1 },
    links: { github: "https://github.com/joinflux", website: "https://flux.finance" },
    technologies: ["REACT", "TYPESCRIPT", "SWIFT", "JAVA", "NODEJS"],
    roles: ["DEVELOPER"],
    contentSections: [
      {
        id: "mission",
        emoji: "🎯",
        header: "One mission, one goal",
        text: "Flux exists to help young people learn about money, stay on top of their credit health, and get the chance to win $250,000! We help engage and excite people about money using gamification and modern design so people can make more informed decisions about their finances without falling asleep.",
      },
      {
        id: "win",
        emoji: "💰",
        header: "Win the Week",
        subheader: "Win up to $250,000 just by saving $25",
        subheaderColor: "#6cea9c",
        text: "We've created a simple game. Save $25 and guess a 7 digit number to win up to $250,000. Guaranteed winners every week.",
      },
    ],
    order: 1,
  },
  {
    slug: "compass",
    name: "Compass",
    shortDescription: "School management solution powering thousands of schools",
    background: "linear-gradient(135deg, #1e3c72, #2a5298, #3d6db3, #5488cc, #6ba3e5)",
    logoUrl: "/assets/img/projects/logo/compass.png",
    logoWidth: 150,
    logoHeight: 150,
    status: "active" as const,
    maintained: false,
    timeline: { startYear: 2020, endYear: 2022, startMonth: 3, endMonth: 5 },
    links: { website: "https://compass.education" },
    technologies: ["REACT", "TYPESCRIPT", "CSHARP", "EFCORE", "SWIFT", "JAVA", "MONGODB"],
    roles: ["PAST_DEVELOPER"],
    contentSections: [
      {
        id: "edtech",
        emoji: "🏫",
        header: "Educational technology at scale",
        text: "Compass Education is a comprehensive school management platform that serves thousands of schools across 5 countries. The platform provides integrated solutions for student information management, learning management systems, and parent-school communication tools.",
      },
      {
        id: "mobile",
        emoji: "📱",
        header: "Mobile & web development",
        text: "As a Mobile Software Engineer, I worked on both iOS and Android applications as well as web platforms. I implemented new screens, fixed UIKit logic bugs, and contributed to improving user experience which led to better app store ratings. My work involved React, TypeScript, Swift, and Java development.",
      },
      {
        id: "legacy",
        emoji: "🔧",
        header: "Legacy system modernization",
        text: "A key part of my role involved modernizing legacy systems and removing technical debt. I migrated core functionality from ASP.NET to React and helped transition Visual Basic code to C#. I also refactored existing solutions to be more scalable and maintainable, and created company presentations on frontend testing best practices.",
      },
    ],
    order: 2,
  },
  {
    slug: "powercord",
    name: "Powercord",
    shortDescription: "Client modification for the Discord desktop client",
    background: "linear-gradient(to right,#7289da,#7289da)",
    logoUrl: "/assets/svg/projects/logo/powercord.svg",
    logoWidth: 46,
    logoHeight: 46,
    logoIncludesName: false,
    status: "active" as const,
    maintained: true,
    timeline: { startYear: 2019, endYear: 2022, startMonth: 8, endMonth: 3 },
    links: { github: "https://github.com/powercord", website: "https://powercord.dev" },
    technologies: ["NODEJS", "JAVASCRIPT", "REACT", "CSS"],
    roles: ["CONTRIBUTOR", "PLUGIN_DEVELOPER"],
    contentSections: [
      {
        id: "main",
        header: "Discord client modification",
        text: "A client modification made for Discord. I have helped write code for the client injector, as well as multiple plugins that range extensively in skill sets, such as audio visualizers with Electron API's, use of React components, and other plugins as well.",
      },
    ],
    order: 3,
  },
  {
    slug: "poplet",
    name: "Poplet",
    shortDescription: "Note taking app with advanced features and customisability",
    background: "linear-gradient(to right, #8e2de2, #4a00e0)",
    logoUrl: "/assets/svg/projects/logo/poplet.svg",
    logoWidth: 46,
    logoHeight: 46,
    logoIncludesName: false,
    status: "active" as const,
    maintained: false,
    timeline: { startYear: 2019, endYear: 2020, startMonth: 1, endMonth: 12 },
    links: { github: "https://github.com/popletapp/web-app" },
    technologies: ["REACT", "JAVASCRIPT", "NODEJS", "CSS", "PYTHON"],
    roles: ["PAST_LEAD_DEVELOPER"],
    contentSections: [
      {
        id: "thinking",
        emoji: "📝",
        header: "Thinking rethought",
        text: "Poplet was a note-taking application with rich features such as real-time collaboration, permissions, automated actions when certain events take place and so much more.",
      },
      {
        id: "scope",
        emoji: "🎖",
        header: "Big scope, big ambitions",
        text: "My original motivation for developing a new note-taking application in such a saturated market was the fact that note taking in general is such a manual process: it'd be nice to have information automatically inferred where possible to speed up your workflow so ultimately you and your team members can spend more time doing what's important.",
      },
      {
        id: "learning",
        emoji: "🧠",
        header: "A great learning experience",
        text: "Although Poplet was eventually discontinued, it still served as a great learning experience for me and gave me lots of knowledge about how to deal with translations, dealing with a large-scale React project and security as I implemented a lot of core functionality (such as server-side validation, ratelimiting, scalability) on my own. It was the first project I developed on my own with the intention of being used by lots of people so I wanted to ensure I got things done properly.",
      },
    ],
    order: 4,
  },
  {
    slug: "dankmemer",
    name: "Dank Memer",
    shortDescription: "Multi-purpose Discord bot featuring a community-driven economy",
    background: "linear-gradient(to right,rgb(89 141 62),rgb(89 141 62))",
    logoUrl: "/assets/img/projects/logo/dank-memer.png",
    logoWidth: 38,
    logoHeight: 38,
    logoIncludesName: false,
    status: "active" as const,
    maintained: false,
    timeline: { startYear: 2018, endYear: 2019, startMonth: 6, endMonth: 8 },
    links: { github: "https://github.com/dankmemer" },
    technologies: ["JAVASCRIPT", "RETHINKDB", "REDIS", "PYTHON", "NODEJS", "REACT", "CSS"],
    roles: ["PAST_DEVELOPER"],
    contentSections: [
      {
        id: "economy",
        emoji: "🏃‍♂️",
        header: "Your average economy with a spin",
        text: "During my time working on the project, I was largely responsible for the currency system which allows users to build up a virtual currency that can be used to buy in-game items. This included the ability to work at a job throughout the real world day, buying commodities from a shop, stealing coins from other users and a slot machine - all achieved with just text.",
      },
      {
        id: "scale",
        emoji: "👑",
        header: "Over 2 million servers",
        text: "Dank Memer is the largest project I've worked on, amassing over 2 million servers during my time working on the project which roughly equates to 1 million daily users. I learned a lot about working with and deploying changes to production systems, as well as optimizing software to be efficient at scale.",
      },
    ],
    order: 5,
  },
  {
    slug: "zbot",
    name: "zBot",
    shortDescription: "Multi-purpose Discord bot featuring a community-driven economy",
    background: "linear-gradient(to right,#16222a, #3a6073)",
    logoUrl: "/assets/img/projects/logo/zbot.png",
    logoWidth: 38,
    logoHeight: 38,
    logoIncludesName: false,
    status: "active" as const,
    maintained: false,
    timeline: { startYear: 2016, endYear: 2018, startMonth: 3, endMonth: 12 },
    links: { github: "https://github.com/nevvulo/zBot" },
    technologies: ["JAVASCRIPT", "NODEJS", "HTML", "CSS"],
    roles: ["PAST_LEAD_DEVELOPER"],
    contentSections: [
      {
        id: "allInOne",
        emoji: "💡",
        header: "Everything you need in one place",
        text: "zBot was a multi-purpose Discord bot application that allowed users to use commands to make their experience on their Discord server more enjoyable and interactive. It provided moderation commands to punish people for breaking rules, a feature rich text-based economy system with customisable features, image generation, music, gamification through chat messages - zBot had it all.",
      },
      {
        id: "users",
        emoji: "🙋🏻",
        header: "60 thousand users over 1,500 guilds",
        text: "zBot is the largest self-made project I've worked on, both in terms of userbase and complexity. The application was \"installed\" on over 1,500 separate Discord servers at its peak, totalling over 60 thousand aggregate users daily.\n\nzBot had over 100 unique commands and over 200 source files handling events, external services, custom logic and advanced customisation so server owners could build their own configuration.",
      },
    ],
    order: 6,
  },
];

export const getServerSideProps = () => ({ props: {} });

export default function AdminProjectsPage() {
  const [mounted, setMounted] = useState(false);
  const { isLoading, isCreator } = useTierAccess();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <BlogView>
        <SimpleNavbar title="Projects Admin" />
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
          <title>Access Denied | Projects Admin</title>
        </Head>
        <BlogView>
          <SimpleNavbar title="Projects Admin" />
          <Container>
            <Title>Access Denied</Title>
            <Text>You don't have permission to access projects admin.</Text>
          </Container>
        </BlogView>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Projects Admin | Nevulo</title>
      </Head>
      <BlogView>
        <SimpleNavbar title="Projects Admin" />
        <AdminContainer>
          <Header>
            <Title>
              <FolderOpen size={28} /> Projects Admin
            </Title>
            <Text>Manage portfolio projects</Text>
          </Header>

          <MigrationSection />
          <ProjectsListSection />
        </AdminContainer>
      </BlogView>
    </>
  );
}

function MigrationSection() {
  const technologies = useQuery(api.technologies.list);
  const roles = useQuery(api.roles.list);
  const projects = useQuery(api.projects.list, {});

  const seedTechnology = useMutation(api.technologies.seed);
  const seedRole = useMutation(api.roles.seed);
  const seedProject = useMutation(api.projects.seed);

  const [migrating, setMigrating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const techCount = technologies?.length ?? 0;
  const roleCount = roles?.length ?? 0;
  const projectCount = projects?.length ?? 0;

  const isMigrated = techCount > 0 && roleCount > 0 && projectCount > 0;

  const runMigration = async () => {
    setMigrating(true);
    setMessage(null);

    try {
      // Seed technologies
      for (const tech of TECHNOLOGIES_SEED) {
        await seedTechnology(tech);
      }

      // Seed roles
      for (const role of ROLES_SEED) {
        await seedRole(role);
      }

      // Seed projects
      for (const project of PROJECTS_SEED) {
        await seedProject(project);
      }

      setMessage({ type: "success", text: "Migration completed successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: `Migration failed: ${error}` });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>
          <Database size={20} /> Migration Status
        </SectionTitle>
      </SectionHeader>

      <SectionDescription>
        Migrate hardcoded project data to Convex database.
      </SectionDescription>

      {message && (
        <Message $type={message.type}>
          {message.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </Message>
      )}

      <StatusGrid>
        <StatusCard>
          <StatusLabel>Technologies</StatusLabel>
          <StatusValue>{techCount} / {TECHNOLOGIES_SEED.length}</StatusValue>
          <StatusIndicator $active={techCount >= TECHNOLOGIES_SEED.length} />
        </StatusCard>
        <StatusCard>
          <StatusLabel>Roles</StatusLabel>
          <StatusValue>{roleCount} / {ROLES_SEED.length}</StatusValue>
          <StatusIndicator $active={roleCount >= ROLES_SEED.length} />
        </StatusCard>
        <StatusCard>
          <StatusLabel>Projects</StatusLabel>
          <StatusValue>{projectCount} / {PROJECTS_SEED.length}</StatusValue>
          <StatusIndicator $active={projectCount >= PROJECTS_SEED.length} />
        </StatusCard>
      </StatusGrid>

      <ActionRow>
        <ActionButton onClick={runMigration} disabled={migrating || isMigrated}>
          <Play size={16} />
          {migrating ? "Migrating..." : isMigrated ? "Migration Complete" : "Run Migration"}
        </ActionButton>
      </ActionRow>
    </Section>
  );
}

function ProjectsListSection() {
  const projects = useQuery(api.projects.list, {});
  const technologies = useQuery(api.technologies.list);
  const roles = useQuery(api.roles.list);
  const toggleStatus = useMutation(api.projects.toggleStatus);
  const deleteProject = useMutation(api.projects.deleteProject);
  const updateProject = useMutation(api.projects.update);

  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingProject, setEditingProject] = useState<NonNullable<typeof projects>[number] | null>(null);

  const filteredProjects = projects?.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  }) ?? [];

  const handleToggle = async (projectId: Id<"projects">) => {
    await toggleStatus({ projectId });
  };

  const handleDelete = async (projectId: Id<"projects">, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      await deleteProject({ projectId });
    }
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>
          <FolderOpen size={20} /> Projects ({filteredProjects.length})
        </SectionTitle>
        <FilterRow>
          <FilterButton $active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterButton>
          <FilterButton $active={filter === "active"} onClick={() => setFilter("active")}>
            Active
          </FilterButton>
          <FilterButton $active={filter === "inactive"} onClick={() => setFilter("inactive")}>
            Inactive
          </FilterButton>
        </FilterRow>
      </SectionHeader>

      {!projects ? (
        <Text>Loading projects...</Text>
      ) : filteredProjects.length === 0 ? (
        <EmptyState>
          <Text>No projects found. Run the migration to seed initial data.</Text>
        </EmptyState>
      ) : (
        <ProjectsList>
          {filteredProjects.map((project) => (
            <ProjectCard key={project._id} $background={project.background}>
              <ProjectCardLeft>
                <DragHandle>
                  <GripVertical size={16} />
                </DragHandle>
                <ProjectInfo>
                  <ProjectName>{project.name}</ProjectName>
                  <ProjectMeta>
                    {project.shortDescription}
                    <TimelineBadge>
                      {project.timeline.startYear}
                      {project.timeline.endYear
                        ? ` — ${project.timeline.endYear}`
                        : " — Present"}
                    </TimelineBadge>
                  </ProjectMeta>
                </ProjectInfo>
              </ProjectCardLeft>
              <ProjectCardRight>
                <StatusBadge $status={project.status}>
                  {project.status}
                </StatusBadge>
                {project.maintained && (
                  <MaintainedBadge>Maintained</MaintainedBadge>
                )}
                <IconButton onClick={() => setEditingProject(project)} title="Edit project">
                  <Edit size={16} />
                </IconButton>
                <IconButton onClick={() => handleToggle(project._id)} title="Toggle visibility">
                  {project.status === "active" ? <Eye size={16} /> : <EyeOff size={16} />}
                </IconButton>
                <IconButton $danger onClick={() => handleDelete(project._id, project.name)} title="Delete project">
                  <Trash2 size={16} />
                </IconButton>
              </ProjectCardRight>
            </ProjectCard>
          ))}
        </ProjectsList>
      )}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          technologies={technologies ?? []}
          roles={roles ?? []}
          onClose={() => setEditingProject(null)}
          onSave={async (updates) => {
            await updateProject({
              projectId: editingProject._id,
              ...updates,
            });
            setEditingProject(null);
          }}
        />
      )}
    </Section>
  );
}

interface EditProjectModalProps {
  project: NonNullable<ReturnType<typeof useQuery<typeof api.projects.list>>>[number];
  technologies: NonNullable<ReturnType<typeof useQuery<typeof api.technologies.list>>>;
  roles: NonNullable<ReturnType<typeof useQuery<typeof api.roles.list>>>;
  onClose: () => void;
  onSave: (updates: {
    slug?: string;
    name?: string;
    shortDescription?: string;
    background?: string;
    logoUrl?: string;
    logoDarkUrl?: string;
    logoWidth?: number;
    logoHeight?: number;
    logoIncludesName?: boolean;
    status?: "active" | "inactive";
    maintained?: boolean;
    timeline?: {
      startYear: number;
      endYear?: number;
      startMonth?: number;
      endMonth?: number;
    };
    links?: {
      github?: string;
      website?: string;
    };
    technologies?: string[];
    roles?: string[];
    contentSections?: Array<{
      id: string;
      emoji?: string;
      header: string;
      subheader?: string;
      subheaderColor?: string;
      text: string;
    }>;
  }) => Promise<void>;
}

function EditProjectModal({ project, technologies, roles, onClose, onSave }: EditProjectModalProps) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "timeline" | "media" | "tech" | "content">("basic");

  // Form state
  const [slug, setSlug] = useState(project.slug);
  const [name, setName] = useState(project.name);
  const [shortDescription, setShortDescription] = useState(project.shortDescription);
  const [background, setBackground] = useState(project.background);
  const [logoUrl, setLogoUrl] = useState(project.logoUrl ?? "");
  const [logoDarkUrl, setLogoDarkUrl] = useState(project.logoDarkUrl ?? "");
  const [logoWidth, setLogoWidth] = useState(project.logoWidth ?? 0);
  const [logoHeight, setLogoHeight] = useState(project.logoHeight ?? 0);
  const [logoIncludesName, setLogoIncludesName] = useState(project.logoIncludesName ?? true);
  const [status, setStatus] = useState<"active" | "inactive">(project.status);
  const [maintained, setMaintained] = useState(project.maintained);

  // Timeline
  const [startYear, setStartYear] = useState(project.timeline.startYear);
  const [endYear, setEndYear] = useState(project.timeline.endYear ?? 0);
  const [startMonth, setStartMonth] = useState(project.timeline.startMonth ?? 0);
  const [endMonth, setEndMonth] = useState(project.timeline.endMonth ?? 0);
  const [isOngoing, setIsOngoing] = useState(!project.timeline.endYear);

  // Links
  const [github, setGithub] = useState(project.links?.github ?? "");
  const [website, setWebsite] = useState(project.links?.website ?? "");

  // Technologies & Roles
  const [selectedTechs, setSelectedTechs] = useState<string[]>(project.technologies);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(project.roles);

  // Content sections
  const [contentSections, setContentSections] = useState(project.contentSections);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        slug,
        name,
        shortDescription,
        background,
        logoUrl: logoUrl || undefined,
        logoDarkUrl: logoDarkUrl || undefined,
        logoWidth: logoWidth || undefined,
        logoHeight: logoHeight || undefined,
        logoIncludesName,
        status,
        maintained,
        timeline: {
          startYear,
          endYear: isOngoing ? undefined : endYear || undefined,
          startMonth: startMonth || undefined,
          endMonth: isOngoing ? undefined : endMonth || undefined,
        },
        links: {
          github: github || undefined,
          website: website || undefined,
        },
        technologies: selectedTechs,
        roles: selectedRoles,
        contentSections,
      });
    } finally {
      setSaving(false);
    }
  };

  const addContentSection = () => {
    setContentSections([
      ...contentSections,
      {
        id: `section-${Date.now()}`,
        header: "New Section",
        text: "",
      },
    ]);
  };

  const updateContentSection = (index: number, updates: Partial<typeof contentSections[number]>) => {
    const newSections = [...contentSections];
    newSections[index] = { ...newSections[index], ...updates };
    setContentSections(newSections);
  };

  const removeContentSection = (index: number) => {
    setContentSections(contentSections.filter((_, i) => i !== index));
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Edit size={20} /> Edit Project: {project.name}
          </ModalTitle>
          <CloseModalButton onClick={onClose}>
            <X size={20} />
          </CloseModalButton>
        </ModalHeader>

        <TabRow>
          <Tab $active={activeTab === "basic"} onClick={() => setActiveTab("basic")}>Basic Info</Tab>
          <Tab $active={activeTab === "timeline"} onClick={() => setActiveTab("timeline")}>Timeline</Tab>
          <Tab $active={activeTab === "media"} onClick={() => setActiveTab("media")}>Media</Tab>
          <Tab $active={activeTab === "tech"} onClick={() => setActiveTab("tech")}>Tech & Roles</Tab>
          <Tab $active={activeTab === "content"} onClick={() => setActiveTab("content")}>Content</Tab>
        </TabRow>

        <ModalBody>
          {activeTab === "basic" && (
            <FormSection>
              <FormGroup>
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="project-slug" />
              </FormGroup>
              <FormGroup>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project Name" />
              </FormGroup>
              <FormGroup>
                <Label>Short Description</Label>
                <TextArea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief description of the project"
                  rows={2}
                />
              </FormGroup>
              <FormGroup>
                <Label>Background (CSS Gradient)</Label>
                <Input value={background} onChange={(e) => setBackground(e.target.value)} placeholder="linear-gradient(...)" />
                <GradientPreview style={{ background }} />
              </FormGroup>
              <FormRow>
                <FormGroup>
                  <Label>Status</Label>
                  <Select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </FormGroup>
                <FormGroup>
                  <CheckboxLabel>
                    <input type="checkbox" checked={maintained} onChange={(e) => setMaintained(e.target.checked)} />
                    Maintained
                  </CheckboxLabel>
                </FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup>
                  <Label>GitHub URL</Label>
                  <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
                </FormGroup>
                <FormGroup>
                  <Label>Website URL</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                </FormGroup>
              </FormRow>
            </FormSection>
          )}

          {activeTab === "timeline" && (
            <FormSection>
              <FormRow>
                <FormGroup>
                  <Label>Start Year</Label>
                  <Input
                    type="number"
                    value={startYear}
                    onChange={(e) => setStartYear(Number(e.target.value))}
                    min={2000}
                    max={2030}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Start Month (1-12, optional)</Label>
                  <Input
                    type="number"
                    value={startMonth || ""}
                    onChange={(e) => setStartMonth(Number(e.target.value) || 0)}
                    min={0}
                    max={12}
                    placeholder="Optional"
                  />
                </FormGroup>
              </FormRow>
              <FormGroup>
                <CheckboxLabel>
                  <input type="checkbox" checked={isOngoing} onChange={(e) => setIsOngoing(e.target.checked)} />
                  Ongoing (no end date)
                </CheckboxLabel>
              </FormGroup>
              {!isOngoing && (
                <FormRow>
                  <FormGroup>
                    <Label>End Year</Label>
                    <Input
                      type="number"
                      value={endYear || ""}
                      onChange={(e) => setEndYear(Number(e.target.value))}
                      min={2000}
                      max={2030}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>End Month (1-12, optional)</Label>
                    <Input
                      type="number"
                      value={endMonth || ""}
                      onChange={(e) => setEndMonth(Number(e.target.value) || 0)}
                      min={0}
                      max={12}
                      placeholder="Optional"
                    />
                  </FormGroup>
                </FormRow>
              )}
              <TimelinePreview>
                Preview: {startMonth ? `${startMonth}/` : ""}{startYear} — {isOngoing ? "Present" : `${endMonth ? `${endMonth}/` : ""}${endYear || "?"}`}
              </TimelinePreview>
            </FormSection>
          )}

          {activeTab === "media" && (
            <FormSection>
              <FormGroup>
                <Label>Logo URL</Label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="/assets/img/logo.png" />
              </FormGroup>
              <FormGroup>
                <Label>Logo Dark URL (for light mode)</Label>
                <Input value={logoDarkUrl} onChange={(e) => setLogoDarkUrl(e.target.value)} placeholder="/assets/img/logo-dark.png" />
              </FormGroup>
              <FormRow>
                <FormGroup>
                  <Label>Logo Width</Label>
                  <Input type="number" value={logoWidth || ""} onChange={(e) => setLogoWidth(Number(e.target.value))} placeholder="46" />
                </FormGroup>
                <FormGroup>
                  <Label>Logo Height</Label>
                  <Input type="number" value={logoHeight || ""} onChange={(e) => setLogoHeight(Number(e.target.value))} placeholder="46" />
                </FormGroup>
              </FormRow>
              <FormGroup>
                <CheckboxLabel>
                  <input type="checkbox" checked={logoIncludesName} onChange={(e) => setLogoIncludesName(e.target.checked)} />
                  Logo includes project name (don't show title separately)
                </CheckboxLabel>
              </FormGroup>
            </FormSection>
          )}

          {activeTab === "tech" && (
            <FormSection>
              <FormGroup>
                <Label>Technologies</Label>
                <TagSelector>
                  {technologies.map((tech) => (
                    <TagOption
                      key={tech.key}
                      $selected={selectedTechs.includes(tech.key)}
                      $color={tech.color}
                      onClick={() => {
                        setSelectedTechs(
                          selectedTechs.includes(tech.key)
                            ? selectedTechs.filter((t) => t !== tech.key)
                            : [...selectedTechs, tech.key]
                        );
                      }}
                    >
                      {tech.label}
                    </TagOption>
                  ))}
                </TagSelector>
              </FormGroup>
              <FormGroup>
                <Label>Roles</Label>
                <TagSelector>
                  {roles.map((role) => (
                    <TagOption
                      key={role.key}
                      $selected={selectedRoles.includes(role.key)}
                      $color={role.color}
                      onClick={() => {
                        setSelectedRoles(
                          selectedRoles.includes(role.key)
                            ? selectedRoles.filter((r) => r !== role.key)
                            : [...selectedRoles, role.key]
                        );
                      }}
                    >
                      {role.label}
                    </TagOption>
                  ))}
                </TagSelector>
              </FormGroup>
            </FormSection>
          )}

          {activeTab === "content" && (
            <FormSection>
              <Label>Content Sections</Label>
              {contentSections.map((section, index) => (
                <ContentSectionCard key={section.id}>
                  <ContentSectionHeader>
                    <ContentSectionTitle>Section {index + 1}</ContentSectionTitle>
                    <IconButton $danger onClick={() => removeContentSection(index)}>
                      <Trash2 size={14} />
                    </IconButton>
                  </ContentSectionHeader>
                  <FormGroup>
                    <Label>Emoji (optional)</Label>
                    <Input
                      value={section.emoji ?? ""}
                      onChange={(e) => updateContentSection(index, { emoji: e.target.value || undefined })}
                      placeholder="🚀"
                      style={{ width: "80px" }}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Header</Label>
                    <Input
                      value={section.header}
                      onChange={(e) => updateContentSection(index, { header: e.target.value })}
                      placeholder="Section header"
                    />
                  </FormGroup>
                  <FormRow>
                    <FormGroup>
                      <Label>Subheader (optional)</Label>
                      <Input
                        value={section.subheader ?? ""}
                        onChange={(e) => updateContentSection(index, { subheader: e.target.value || undefined })}
                        placeholder="Optional subheader"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Subheader Color</Label>
                      <Input
                        value={section.subheaderColor ?? ""}
                        onChange={(e) => updateContentSection(index, { subheaderColor: e.target.value || undefined })}
                        placeholder="#6cea9c"
                      />
                    </FormGroup>
                  </FormRow>
                  <FormGroup>
                    <Label>Text</Label>
                    <TextArea
                      value={section.text}
                      onChange={(e) => updateContentSection(index, { text: e.target.value })}
                      placeholder="Section content..."
                      rows={4}
                    />
                  </FormGroup>
                </ContentSectionCard>
              ))}
              <AddSectionButton onClick={addContentSection}>
                <Plus size={16} /> Add Section
              </AddSectionButton>
            </FormSection>
          )}
        </ModalBody>

        <ModalFooter>
          <ActionButton $secondary onClick={onClose}>Cancel</ActionButton>
          <ActionButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
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
  margin-bottom: 8px;
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

const SectionDescription = styled.p`
  color: ${(p) => p.theme.textColor};
  font-size: 14px;
  margin: 0 0 20px;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
`;

const StatusCard = styled.div`
  background: ${(p) => p.theme.background};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const StatusLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${(p) => p.theme.textColor};
  text-transform: uppercase;
`;

const StatusValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${(p) => p.theme.contrast};
`;

const StatusIndicator = styled.div<{ $active?: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(p) => (p.$active ? "#22c55e" : "#ef4444")};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
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

const ProjectsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ProjectCard = styled.div<{ $background?: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: ${(p) => p.theme.background};
  border-radius: 12px;
  border-left: 4px solid;
  border-image: ${(p) => p.$background || p.theme.contrast} 1;
`;

const ProjectCardLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DragHandle = styled.div`
  color: ${(p) => p.theme.textColor};
  opacity: 0.5;
  cursor: grab;

  &:hover {
    opacity: 1;
  }
`;

const ProjectInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProjectName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
`;

const ProjectMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${(p) => p.theme.textColor};
`;

const TimelineBadge = styled.span`
  background: ${(p) => p.theme.borderColor || "#333"};
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
`;

const ProjectCardRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${(p) => (p.$status === "active" ? "#22c55e20" : "#ef444420")};
  color: ${(p) => (p.$status === "active" ? "#22c55e" : "#ef4444")};
`;

const MaintainedBadge = styled.span`
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: #3b82f620;
  color: #3b82f6;
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

// Modal Styled Components
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

const GradientPreview = styled.div`
  height: 40px;
  border-radius: 8px;
  margin-top: 8px;
`;

const TimelinePreview = styled.div`
  padding: 12px 16px;
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 8px;
  font-family: monospace;
  font-size: 14px;
  color: ${(p) => p.theme.contrast};
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

const ContentSectionCard = styled.div`
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ContentSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ContentSectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
`;

const AddSectionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 2px dashed ${(p) => p.theme.borderColor || "#444"};
  border-radius: 8px;
  background: transparent;
  color: ${(p) => p.theme.textColor};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${(p) => p.theme.contrast};
    color: ${(p) => p.theme.contrast};
  }
`;
