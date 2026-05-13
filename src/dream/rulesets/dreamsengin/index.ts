export const id = 'DrEamsEngin';

export const constraints = [
  {
    key: 'dreamSync',
    required: true,
  },
];

export const transforms = {
  engineMode: 'dreams',
  homeSurface: 'components/dreamengin',
};

export const params = {
  shell: 'persistent',
  composition: 'universal',
};

export const ruleSet = { id, constraints, transforms, params };
export default ruleSet;
