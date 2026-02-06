import type { Metadata } from "next";
import { Suspense } from "react";
import { getProjectsByTimeline, getTimelineYears, getTechnologiesByKeys, getRolesByKeys } from "@/src/db/queries/projects";
import ProjectsPage from "./ProjectsPage";

export const metadata: Metadata = {
  title: "Projects",
  description: "Explore Blake's portfolio of software projects, from open-source tools to production applications.",
  openGraph: {
    title: "Projects | Nevulo",
    description: "Explore Blake's portfolio of software projects.",
    url: "https://nev.so/projects",
  },
};

export const revalidate = 120;

export default async function Page() {
  const [projects, timelineYears] = await Promise.all([
    getProjectsByTimeline().catch(() => []),
    getTimelineYears().catch(() => []),
  ]);

  // Pre-fetch all technologies and roles used by projects
  const allTechKeys = [...new Set(projects.flatMap((p) => (p.technologies as string[]) || []))];
  const allRoleKeys = [...new Set(projects.flatMap((p) => (p.roles as string[]) || []))];

  const [technologies, roles] = await Promise.all([
    getTechnologiesByKeys(allTechKeys).catch(() => []),
    getRolesByKeys(allRoleKeys).catch(() => []),
  ]);

  return (
    <Suspense>
      <ProjectsPage
        projects={projects}
        timelineYears={timelineYears}
        technologies={technologies}
        roles={roles}
      />
    </Suspense>
  );
}
