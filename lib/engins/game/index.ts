/**
 * lib/engins/game/index.ts
 *
 * Barrel export for the GameEngin rule-set.
 */

export {
    GAME_ENGIN_RULE_SET,
    GRAVITY_VALUES
} from './gameEnginRuleSet';

export type {
    GameEnginAction,
    GameEnginDerivedState,
    GameScore, GravityPreset, PhysicsConfig, ScriptLanguage, ScriptState,
    TileType, WorldState
} from './gameEnginRuleSet';
