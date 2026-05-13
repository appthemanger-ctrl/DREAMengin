export const id = 'LabEngin';

export const constraints = [
  {
    key: 'sandbox',
    required: true,
  },
];

export const transforms = {
  engineMode: 'lab',
  environment: 'experimental',
};

export const params = {
  simulationBudgetMs: 16,
  telemetry: 'standard',
};

export const ruleSet = { id, constraints, transforms, params };
export default ruleSet;
