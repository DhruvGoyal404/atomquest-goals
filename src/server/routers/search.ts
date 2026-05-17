import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import {
  listCheckIns,
  listGoalsForUser,
  listPeers,
  listTeamGoals,
  listUsers,
} from "@/server/services/db-store";
import { bestFieldScore } from "@/lib/utils/fuzzy";

const MIN_SCORE = 0.32;
const PER_CATEGORY_LIMIT = 6;

export type GlobalSearchGoal = {
  id: string;
  title: string;
  thrustArea: string;
  status: string;
  progress: number;
  ownerName: string;
};

export type GlobalSearchCheckIn = {
  id: string;
  goalId: string;
  quarter: string;
  comments: string;
  progressScore: number;
};

export type GlobalSearchPerson = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  designation: string | null;
  role: string;
};

export type GlobalSearchPayload = {
  goals: GlobalSearchGoal[];
  checkIns: GlobalSearchCheckIn[];
  people: GlobalSearchPerson[];
};

export const searchRouter = createTRPCRouter({
  global: protectedProcedure
    .input(z.object({ q: z.string().trim().min(1).max(80) }))
    .query(async ({ ctx, input }): Promise<GlobalSearchPayload> => {
      const q = input.q;
      const isManager = ctx.user.role === "MANAGER" || ctx.user.role === "ADMIN";
      const isAdmin = ctx.user.role === "ADMIN";

      const [goals, checkIns, peers, teamGoals, allUsers] = await Promise.all([
        listGoalsForUser(ctx.user.id).catch(() => []),
        listCheckIns(ctx.user.id).catch(() => []),
        listPeers(ctx.user.id).catch(() => []),
        isManager ? listTeamGoals(ctx.user.id).catch(() => []) : Promise.resolve([]),
        isAdmin ? listUsers().catch(() => []) : Promise.resolve([]),
      ]);

      const scoredGoals = goals
        .map((g) => ({
          score: bestFieldScore(q, [
            { text: g.title, weight: 1 },
            { text: g.thrustArea, weight: 0.85 },
            { text: g.description, weight: 0.65 },
            { text: g.employee.name, weight: 0.5 },
          ]),
          item: {
            id: g.id,
            title: g.title,
            thrustArea: g.thrustArea,
            status: g.status,
            progress: g.currentProgress,
            ownerName: g.employee.name,
          } satisfies GlobalSearchGoal,
        }))
        .filter((r) => r.score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, PER_CATEGORY_LIMIT)
        .map((r) => r.item);

      const scoredCheckIns = checkIns
        .map((c) => ({
          score: bestFieldScore(q, [
            { text: c.comments, weight: 1 },
            { text: c.quarter, weight: 0.55 },
          ]),
          item: {
            id: c.id,
            goalId: c.goalId,
            quarter: c.quarter,
            comments: c.comments,
            progressScore: c.progressScore,
          } satisfies GlobalSearchCheckIn,
        }))
        .filter((r) => r.score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, PER_CATEGORY_LIMIT)
        .map((r) => r.item);

      const peopleMap = new Map<string, GlobalSearchPerson>();
      const addPerson = (p: {
        id: string;
        name: string;
        email: string;
        department: string | null;
        designation: string | null;
        role?: string;
      }) => {
        if (p.id === ctx.user.id) return;
        if (peopleMap.has(p.id)) return;
        peopleMap.set(p.id, {
          id: p.id,
          name: p.name,
          email: p.email,
          department: p.department,
          designation: p.designation,
          role: p.role ?? "EMPLOYEE",
        });
      };

      peers.forEach((p) =>
        addPerson({
          id: p.id,
          name: p.name,
          email: p.email,
          department: p.department ?? null,
          designation: p.designation ?? null,
        }),
      );
      teamGoals.forEach((g) =>
        addPerson({
          id: g.employee.id,
          name: g.employee.name,
          email: g.employee.email,
          department: g.employee.department ?? null,
          designation: g.employee.designation ?? null,
        }),
      );
      allUsers.forEach((u) =>
        addPerson({
          id: u.id,
          name: u.name,
          email: u.email,
          department: u.department ?? null,
          designation: u.designation ?? null,
          role: u.role,
        }),
      );

      const scoredPeople = [...peopleMap.values()]
        .map((p) => ({
          score: bestFieldScore(q, [
            { text: p.name, weight: 1 },
            { text: p.email, weight: 0.7 },
            { text: p.department, weight: 0.6 },
            { text: p.designation, weight: 0.55 },
          ]),
          item: p,
        }))
        .filter((r) => r.score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, PER_CATEGORY_LIMIT)
        .map((r) => r.item);

      return { goals: scoredGoals, checkIns: scoredCheckIns, people: scoredPeople };
    }),
});
