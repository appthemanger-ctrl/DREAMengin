export const id = 'StarmakerEngin';

export const constraints = [
  {
    key: 'audioLatencyMs',
    maximum: 50,
  },
];

export const transforms = {
  engineMode: 'music',
  studio: 'starmaker',
};

export const params = {
  bpmDefault: 120,
  stemLimit: 32,
};

export const ruleSet = { id, constraints, transforms, params };
export default ruleSet;
