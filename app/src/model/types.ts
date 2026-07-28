export const SCHEMA_VERSION = 1;

export type Priority = 'Must' | 'Should' | 'Could';
export type AdrStatus = 'Proposed' | 'Accepted' | 'Superseded' | 'Deprecated';
export type TaskStatus = 'Todo' | 'In progress' | 'In review' | 'Done';
export type TestLevel = 'Unit' | 'Integration' | 'E2E' | 'Non-functional';
export type TestStatus = 'Pass' | 'Fail' | 'Not run';

export interface Problem { id: string; text: string; }
export interface Goal { id: string; text: string; metric: string; }
export interface Beneficiary { audience: string; change: string; }
export interface AssumptionRisk { text: string; note: string; } // note = validation or mitigation

export interface UserStory {
  id: string; role: string; want: string; benefit: string;
  priority: Priority; servesGoalId: string | null;
}
export interface Criterion { id: string; storyId: string; text: string; }
export interface Nfr { id: string; name: string; target: string; }

export interface Component { name: string; responsibility: string; adrIds: string[]; }
export interface Flow { name: string; description: string; }
export interface NfrConsideration { concern: string; approach: string; }
export interface AdrOption { name: string; pros: string; cons: string; }
export interface Adr {
  id: string; title: string; status: AdrStatus; date: string; deciders: string;
  relatesTo: string[]; context: string; options: AdrOption[]; decision: string;
  rationale: string; consequencesPositive: string; consequencesTradeoffs: string; followUps: string;
}

export interface Task {
  id: string; title: string; tracesTo: string[]; dependsOn: string[];
  goal: string; contextForAgent: string; acceptance: string[]; outOfScope: string; status: TaskStatus;
}
export interface Test { id: string; verifies: string; description: string; level: TestLevel; status: TestStatus; }

export interface Project {
  meta: { name: string; createdAt: string; updatedAt: string; schemaVersion: number;
          counters: Record<string, number>; };
  vision: {
    problems: Problem[]; statement: string; beneficiaries: Beneficiary[]; whyNow: string;
    successNarrative: string; nonGoals: string[];
    assumptions: AssumptionRisk[]; risks: AssumptionRisk[];
  };
  goals: Goal[];
  requirements: {
    stories: UserStory[]; criteria: Criterion[]; nfrs: Nfr[];
    assumptions: string[]; constraints: string[]; nonGoals: string[];
    signoff: { by: string; date: string } | null;
  };
  architecture: {
    overview: string; contextDiagram: string; componentDiagram: string;
    components: Component[]; keyFlows: Flow[]; nfrConsiderations: NfrConsideration[]; adrs: Adr[];
  };
  tasks: Task[];
  testing: { tests: Test[]; entryCriteria: string; exitCriteria: string; };
}

export function emptyProject(name: string): Project {
  const now = new Date().toISOString();
  return {
    meta: { name, createdAt: now, updatedAt: now, schemaVersion: SCHEMA_VERSION, counters: {} },
    vision: { problems: [], statement: '', beneficiaries: [], whyNow: '', successNarrative: '',
              nonGoals: [], assumptions: [], risks: [] },
    goals: [],
    requirements: { stories: [], criteria: [], nfrs: [], assumptions: [], constraints: [],
                    nonGoals: [], signoff: null },
    architecture: { overview: '', contextDiagram: '', componentDiagram: '', components: [],
                    keyFlows: [], nfrConsiderations: [], adrs: [] },
    tasks: [],
    testing: { tests: [], entryCriteria: '', exitCriteria: '' },
  };
}
