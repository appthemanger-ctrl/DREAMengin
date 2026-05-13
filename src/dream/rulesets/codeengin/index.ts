export const id = 'CodeEngin';

export const constraints = [
  {
    key: 'mode',
    allowed: ['analyze', 'refactor', 'generate'],
  },
];

export const transforms = {
  engineMode: 'code',
  workspace: 'engins/CodeEngin',
};

export const params = {
  languageDefaults: ['ts', 'tsx'],
  ciRequired: true,
};

export const ruleSet = { id, constraints, transforms, params };
export default ruleSet;
