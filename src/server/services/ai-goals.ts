import type { GoalFormInput } from "@/lib/validations/goal.validation";

type GoalSuggestion = Pick<
  GoalFormInput,
  "thrustArea" | "title" | "description" | "uomType" | "target" | "weightage"
>;

const fallbackSuggestions: GoalSuggestion[] = [
  {
    thrustArea: "Operational Excellence",
    title: "Improve quarterly delivery predictability",
    description:
      "Increase committed-scope completion by tightening sprint planning, dependency tracking, and release readiness reviews.",
    uomType: "MIN_PERCENTAGE",
    target: 92,
    weightage: 25,
  },
  {
    thrustArea: "Customer Impact",
    title: "Reduce high-priority support escalations",
    description:
      "Address recurring product defects and improve handoff quality to lower avoidable escalations from key accounts.",
    uomType: "MAX_NUMERIC",
    target: 8,
    weightage: 20,
  },
  {
    thrustArea: "Quality",
    title: "Maintain zero critical compliance misses",
    description:
      "Keep all audit-critical controls green through proactive evidence collection and remediation tracking.",
    uomType: "ZERO",
    target: 1,
    weightage: 15,
  },
];

export async function suggestGoals(department: string, designation: string): Promise<GoalSuggestion[]> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackSuggestions.map((suggestion) => ({
      ...suggestion,
      thrustArea: department || suggestion.thrustArea,
      title: `${designation}: ${suggestion.title}`,
    }));
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Return compact JSON only. Suggest three measurable enterprise performance goals with thrustArea, title, description, uomType, target, and weightage. Valid uomType values are MIN_NUMERIC, MAX_NUMERIC, MIN_PERCENTAGE, MAX_PERCENTAGE, TIMELINE, ZERO.",
          },
          {
            role: "user",
            content: `Department: ${department}. Designation: ${designation}. Total weightage should be 60 across the three suggestions.`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "goal_suggestions",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                goals: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      thrustArea: { type: "string" },
                      title: { type: "string" },
                      description: { type: "string" },
                      uomType: {
                        type: "string",
                        enum: ["MIN_NUMERIC", "MAX_NUMERIC", "MIN_PERCENTAGE", "MAX_PERCENTAGE", "TIMELINE", "ZERO"],
                      },
                      target: { type: "number" },
                      weightage: { type: "number" },
                    },
                    required: ["thrustArea", "title", "description", "uomType", "target", "weightage"],
                  },
                },
              },
              required: ["goals"],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      return fallbackSuggestions;
    }

    const payload = (await response.json()) as {
      output_text?: string;
    };
    const parsed = JSON.parse(payload.output_text ?? "{\"goals\":[]}") as {
      goals?: GoalSuggestion[];
    };

    return parsed.goals?.length ? parsed.goals : fallbackSuggestions;
  } catch {
    return fallbackSuggestions;
  }
}
