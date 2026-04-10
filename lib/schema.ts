export const profileFields = [
  "name",
  "visaType",
  "interviewDate",
  "status",
  "university",
  "program",
  "subject",
  "fundingStatus",
  "intake",
  "universityName",
  "cgpa",
  "gre",
  "ieltsOther",
  "researchPublication",
  "workExperience",
  "facebookProfileUrl",
  "rawPost"
] as const;

export type ProfileInput = Record<(typeof profileFields)[number], string>;

export const emptyProfile = (): ProfileInput => ({
  name: "",
  visaType: "",
  interviewDate: "",
  status: "",
  university: "",
  program: "",
  subject: "",
  fundingStatus: "",
  intake: "",
  universityName: "",
  cgpa: "",
  gre: "",
  ieltsOther: "",
  researchPublication: "",
  workExperience: "",
  facebookProfileUrl: "",
  rawPost: ""
});
