export const id = 'ForgeNGN';

export const constraints = [
  {
    key: 'pieceCount',
    minimum: 3,
    maximum: 30,
  },
];

export const transforms = {
  engineMode: 'forge',
  assembly: 'validated',
};

export const params = {
  saveFormat: 'json',
  validation: 'strict',
};

export const ruleSet = { id, constraints, transforms, params };
export default ruleSet;
