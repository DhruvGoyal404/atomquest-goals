export const APP_NAME = "AtomQuest Goals";
export const HACKATHON_NAME = "AtomQuest Hackathon 2026";

export const DEMO_CREDENTIALS = [
  {
    email: "employee@atomquest.com",
    password: "demo123",
    role: "Employee",
  },
  {
    email: "manager@atomquest.com",
    password: "demo123",
    role: "Manager",
  },
  {
    email: "admin@atomquest.com",
    password: "demo123",
    role: "Admin",
  },
] as const;

export const ROLE_HOME = {
  EMPLOYEE: "/employee/goals",
  MANAGER: "/manager/approvals",
  ADMIN: "/admin/cycles",
} as const;

export const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
