export type RuntimeStrategy<State, Input> = (state: State, input: Input) => State;

/**
 * Strategy-based runtime container.
 * Infrastructure owns state progression; business logic is injected.
 */
export class RuntimeContainer<State, Input> {
  private state: State;
  private readonly strategy: RuntimeStrategy<State, Input>;

  constructor(initialState: State, initialStrategy: RuntimeStrategy<State, Input>) {
    this.state = initialState;
    this.strategy = initialStrategy;
  }

  run(input: Input): State {
    this.state = this.strategy(this.state, input);
    return this.state;
  }

  getState(): State {
    return this.state;
  }
}
