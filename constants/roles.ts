// main copy that appears in the badge
export enum Roles {
  CONTRIBUTOR = "CONTRIBUTOR",
  PLUGIN_DEVELOPER = "PLUGIN_DEVELOPER",
  PAST_LEAD_DEVELOPER = "PAST_LEAD_DEVELOPER",
  LEAD_DEVELOPER = "LEAD_DEVELOPER",
  PAST_DEVELOPER = "PAST_DEVELOPER",
  DEVELOPER = "DEVELOPER",
}

export enum RoleNames {
  CONTRIBUTOR = "Contributor",
  PLUGIN_DEVELOPER = "Plugin Developer",
  PAST_LEAD_DEVELOPER = "Past Lead Developer",
  LEAD_DEVELOPER = "Lead Developer",
  PAST_DEVELOPER = "Past Developer",
  DEVELOPER = "Developer",
}

// appears in a tooltip on badge hover
export enum RoleDescriptions {
  CONTRIBUTOR = `I've provided one or more meaningful pull requests to an open-source project that were accepted.`,
  PLUGIN_DEVELOPER = `This project implements plugins which provide modifications to the base experience, and I have developed a plugin that extends functionality but isn't part of the core project.`,
  PAST_LEAD_DEVELOPER = `This project was mostly or fully developed solely by me but no longer maintained.`,
  LEAD_DEVELOPER = `This project is mostly or fully developed solely by me and actively maintained.`,
  PAST_DEVELOPER = `I was previously one of the developers for this project.`,
  DEVELOPER = `I am one of the developers for this project.`,
}

// color codes that appear as the badge background in hex
export enum RoleColors {
  CONTRIBUTOR = "#00838f",
  PLUGIN_DEVELOPER = "grey",
  PAST_LEAD_DEVELOPER = `#49704b`,
  LEAD_DEVELOPER = "#2e7d32",
  PAST_DEVELOPER = `#678253`,
  DEVELOPER = "#558b2f",
}
