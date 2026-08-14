export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  website: string;
  expectedCTC?: string;
  currentCTC?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  // India Enhancements
  industry?: string;
  city?: string;
  teamSize?: number;
  employmentType?: string; // Full-time, Part-time, Internship, Contract
  reportingManager?: string;
  toolsUsed?: string[];
  companyScale?: string; // Startup, Mid-size, Enterprise
  currentCTC?: string;
  expectedCTC?: string;
  salaryBreakup?: string;
  showSalary?: boolean;
  contextNote?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
  // India Enhancements
  level?: "10th" | "12th" | "UG" | "PG" | "Diploma" | "Certification" | "";
  boardOrUniversity?: string; // CBSE, ICSE, State Boards, IIT, NIT, Pune University, etc.
  gpaType?: "cgpa" | "percentage" | "";
  distinction?: boolean;
  topper?: boolean;
  scholarship?: string;
  academicAchievements?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  link: string;
  date?: string;
  bullets?: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface LanguagesKnown {
  id: string;
  language: string;
  proficiency: "Beginner" | "Intermediate" | "Fluent" | "Native" | "";
  certification?: string;
  usageContext?: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: {
    technical: string[];
    soft: string[];
  };
  projects: Project[];
  certifications: Certification[];
  // India & Fresher extensions
  languagesKnown?: LanguagesKnown[];
  fresherMode?: boolean;
  hackathons?: string[];
  codingContests?: string[];
  campusAchievements?: string[];
  clubsAndLeadership?: string[];
  competitiveExams?: { exam: string; score: string; year: string }[];
  placementChecklist?: Record<string, boolean>;
  industryMode?: string; // IT, Sales, BFSI, Healthcare, Startup, Education, Manufacturing, MBA
  fontFamily?: string;
  fontSize?: number; // Zoom level or baseline font size
  spacing?: number; // Line spacing margin multiplier
  sectionOrder?: string[]; // Custom ordering sequence
  targetJobDescription?: string;
}

export interface ATSScore {
  overall: number;
  breakdown: {
    keywords: number;
    formatting: number;
    sections: number;
    readability: number;
  };
  missingKeywords: string[];
  matchedKeywords?: string[];
  suggestions: string[];
  // Dynamic ATS Extensions
  score?: number;
  detectedIndustry?: string;
  detectedRole?: string;
  confidence?: number;
  india_keyword_matches?: string[];
  keywordMatches?: { keyword: string; weight: number; layer: string; matchedText: string }[];
  missingKeywordDetails?: { keyword: string; weight: number }[];
  scoringMethodology?: string;
  scoringDisclaimer?: string;
}

export interface ContentReview {
  overallFeedback: string;
  sections: {
    section: string;
    issues: string[];
    suggestions: string[];
    improvedVersion?: string;
  }[];
  actionVerbSuggestions: string[];
  quantificationTips: string[];
}

export interface JDMatch {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  priorityAdditions: string[];
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  raw_text: string;
  resume_data: ResumeData;
  ats_score: ATSScore;
  content_review: ContentReview;
  jd_match: JDMatch;
  template_id: string;
  created_at: string;
  updated_at?: string;
  is_base_resume?: boolean;
}

export interface CareerJournalEntry {
  id: string;
  user_id: string;
  date: string;
  entry_type: 'win' | 'gap' | 'skill' | 'feedback' | 'project' | 'certification' | 'promotion' | 'award' | 'mentorship' | 'impact' | 'publication' | 'other';
  content: string;
  source: 'manual' | 'imported' | 'prompted';
  linked_role?: string;
  tags: string[];
  extracted_metrics?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}
