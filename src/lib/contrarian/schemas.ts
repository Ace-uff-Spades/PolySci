// Schema for stance analysis (Stage 1 of two-stage pipeline)
export const stanceAnalysisSchema = {
  type: "object",
  properties: {
    acknowledgment: {
      type: "string",
      description: "1-2 sentences acknowledging why the user's stance has merit"
    },
    supportingStatistics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          citation: { type: ["number", "null"] }
        },
        required: ["text", "citation"],
        additionalProperties: false
      },
      maxItems: 1,
      description: "Exactly 1 statistic that supports the user's stance"
    },
    validPoints: {
      type: "array",
      items: { type: "string" },
      maxItems: 3,
      description: "Key valid points in the user's stance"
    }
  },
  required: ["acknowledgment", "supportingStatistics", "validPoints"],
  additionalProperties: false
} as const;

export const contrarianSchema = {
  type: "object",
  properties: {
    acknowledgment: {
      type: "string",
      description: "Brief acknowledgment (can reuse from stance analysis)"
    },
    statisticsFor: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          citation: { type: ["number", "null"] }
        },
        required: ["text", "citation"],
        additionalProperties: false
      },
      maxItems: 1,
      description: "Exactly 1 statistic supporting the user's stance"
    },
    statisticsAgainst: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          citation: { type: ["number", "null"] }
        },
        required: ["text", "citation"],
        additionalProperties: false
      },
      maxItems: 1,
      description: "Exactly 1 statistic challenging the user's stance"
    },
    deeperAnalysis: {
      type: "string",
      description: "2-3 sentences of contextual analysis"
    },
    followUpQuestion: {
      type: "string",
      description: "One probing question to help user think deeper"
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          number: { type: "number" },
          name: { type: "string" },
          url: { type: "string" }
        },
        required: ["number", "name", "url"],
        additionalProperties: false
      }
    }
  },
  required: ["acknowledgment", "statisticsFor", "statisticsAgainst", "deeperAnalysis", "followUpQuestion", "sources"],
  additionalProperties: false
} as const;

// Schema for educational responses: analysis + follow-up question only (no statistics/legislation sections).
export const educationalResponseSchema = {
  type: "object",
  properties: {
    analysis: {
      type: "string",
      description: "Must include: (1) Common stances on this topic and where they come from (origination). (2) Core values that this topic challenges. One coherent block."
    },
    followUpQuestion: {
      type: "string",
      description: "One question to continue the conversation. Early exchanges: simple yes/no. Later: more open-ended."
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          number: { type: "number" },
          name: { type: "string" },
          url: { type: "string" }
        },
        required: ["number", "name", "url"],
        additionalProperties: false
      },
      description: "Leave empty; no statistics or legislation to cite in educational responses."
    }
  },
  required: ["analysis", "followUpQuestion", "sources"],
  additionalProperties: false
} as const;
