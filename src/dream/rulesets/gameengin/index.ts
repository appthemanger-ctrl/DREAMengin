export const id = 'GameEngin';

export const constraints = [
  {
    key: 'framerate',
    minimum: 30,
  },
];

export const transforms = {
  engineMode: 'game',
  physics: 'deterministic',
};

export const params = {
  cartridgeSlot: 'active',
  inputProfile: 'controller-first',
};

export const ruleSet = { id, constraints, transforms, params };
export default ruleSet;
