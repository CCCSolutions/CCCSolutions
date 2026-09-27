// CEMC publishes one commentary page per contest, from 2022 on. The folder is the year CEMC
// uploaded the page, not the contest year.
const COMMENTARY_FOLDERS: Record<string, string> = {
  '2022Jr': '2024',
  '2022Sr': '2024',
  '2023Jr': '2024',
  '2023Sr': '2024',
  '2024Jr': '2024',
  '2024Sr': '2024',
  '2025Jr': '2026',
  '2025Sr': '2025',
  '2026Jr': '2026',
};

export function cemcCommentaryUrl(contestYear: string, problemCode: string): string | null {
  const division = problemCode.startsWith('j') ? 'Jr' : problemCode.startsWith('s') ? 'Sr' : null;
  const folder = division && COMMENTARY_FOLDERS[`${contestYear}${division}`];
  if (!folder) return null;
  return `https://cemc.uwaterloo.ca/sites/default/files/documents/${folder}/${contestYear}CCC${division}Commentary.html`;
}
