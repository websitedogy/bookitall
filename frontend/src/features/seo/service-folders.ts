export const SERVICE_FOLDERS: Record<string, string> = {
  electrician: "electrician",
  plumber: "plumber",
  "ac-repair": "ac",
  cleaning: "cleaning",
  beautician: "beautician",
  painting: "painting",
  carpenter: "carpenter",
  appliance: "appliance",
  jobs: "jobs",
  "public-transport": "public-transport",
  "goods-transport": "goods-transport",
  "packers-movers": "packers-movers",
  "cloud-kitchen": "cloud-kitchen",
};

export function serviceIdFromFolder(folder: string) {
  return SERVICE_FOLDERS[folder];
}

export function hyderabadPath(folder: string) {
  return `/${folder}/hyderabad`;
}
