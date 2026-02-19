import { test, expect } from '@playwright/test';

test.describe('Manifold Smoothing - Section 4', () => {
  test('cubic to sphere projection should interpolate based on lambda', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { projectCubicToSphere, vectorMagnitude } = require('@/lib/navigation/manifold');
      
      const cubePos = { x: 1, y: 0, z: 0 };
      
      // Lambda = 0 (fully cubic)
      const cubic = projectCubicToSphere(cubePos, 0);
      
      // Lambda = 1 (fully spherical)
      const sphere = projectCubicToSphere(cubePos, 1);
      
      // Lambda = 0.5 (halfway)
      const mixed = projectCubicToSphere(cubePos, 0.5);
      
      return {
        cubic: { pos: cubic, mag: vectorMagnitude(cubic) },
        sphere: { pos: sphere, mag: vectorMagnitude(sphere) },
        mixed: { pos: mixed, mag: vectorMagnitude(mixed) },
      };
    });
    
    // Cubic position should match input
    expect(result.cubic.pos.x).toBeCloseTo(1, 5);
    expect(result.cubic.pos.y).toBeCloseTo(0, 5);
    expect(result.cubic.pos.z).toBeCloseTo(0, 5);
    
    // Sphere position should be normalized (magnitude 1)
    expect(result.sphere.mag).toBeCloseTo(1, 5);
    
    // Mixed should be between cubic and sphere
    expect(result.mixed.mag).toBeGreaterThan(result.sphere.mag);
    expect(result.mixed.mag).toBeLessThan(result.cubic.mag);
  });
  
  test('computeLambda should increase with depth', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { computeLambda } = require('@/lib/navigation/manifold');
      
      return {
        depth0: computeLambda(0, 5),
        depth2: computeLambda(2, 5),
        depth5: computeLambda(5, 5),
      };
    });
    
    // Lambda should increase with depth
    expect(result.depth0).toBe(0);
    expect(result.depth2).toBeCloseTo(0.4, 5);
    expect(result.depth5).toBe(1);
  });
  
  test('spherical to Cartesian conversion should preserve radius', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { sphericalToCartesian, vectorMagnitude } = require('@/lib/navigation/manifold');
      
      // Different spherical coordinates
      const coords1 = { theta: Math.PI / 4, phi: 0 };
      const coords2 = { theta: Math.PI / 2, phi: Math.PI / 2 };
      const coords3 = { theta: Math.PI / 3, phi: Math.PI };
      
      const cart1 = sphericalToCartesian(coords1, 1);
      const cart2 = sphericalToCartesian(coords2, 1);
      const cart3 = sphericalToCartesian(coords3, 1);
      
      return {
        mag1: vectorMagnitude(cart1),
        mag2: vectorMagnitude(cart2),
        mag3: vectorMagnitude(cart3),
      };
    });
    
    // All should have magnitude = radius = 1
    expect(result.mag1).toBeCloseTo(1, 5);
    expect(result.mag2).toBeCloseTo(1, 5);
    expect(result.mag3).toBeCloseTo(1, 5);
  });
  
  test('smoothstep should provide smooth interpolation', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { smoothstep } = require('@/lib/navigation/manifold');
      
      return {
        at0: smoothstep(0, 1, 0),
        at025: smoothstep(0, 1, 0.25),
        at05: smoothstep(0, 1, 0.5),
        at075: smoothstep(0, 1, 0.75),
        at1: smoothstep(0, 1, 1),
      };
    });
    
    // Should be 0 at edge0, 1 at edge1
    expect(result.at0).toBe(0);
    expect(result.at1).toBe(1);
    
    // Should be smooth in between (not linear)
    expect(result.at05).toBeCloseTo(0.5, 5);
    
    // Derivative should be 0 at edges (smooth)
    expect(result.at025).toBeGreaterThan(0);
    expect(result.at025).toBeLessThan(0.25); // Slower start
  });
  
  test('computeSlotPosition should create circular layout', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { computeSlotPosition } = require('@/lib/navigation/manifold');
      
      // Get all 8 slot positions
      const positions = [];
      for (let i = 0; i < 8; i++) {
        positions.push(computeSlotPosition(i, 1.0, 8));
      }
      
      return positions;
    });
    
    // Should have 8 positions
    expect(result.length).toBe(8);
    
    // All positions should be at radius 1.0
    for (const pos of result) {
      const mag = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
      expect(mag).toBeCloseTo(1.0, 5);
    }
    
    // Slot 0 should be at angle 0 (1, 0)
    expect(result[0].x).toBeCloseTo(1, 5);
    expect(result[0].y).toBeCloseTo(0, 5);
    
    // Slot 2 should be at angle π/2 (0, 1)
    expect(result[2].x).toBeCloseTo(0, 5);
    expect(result[2].y).toBeCloseTo(1, 5);
  });
  
  test('edge blending should smoothly transition between faces', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { blendFaceEdge } = require('@/lib/navigation/manifold');
      
      const faceA = { x: 1, y: 0, z: 0 };
      const faceB = { x: 0, y: 1, z: 0 };
      
      // At edge (distance 0) - should be all faceA
      const atEdge = blendFaceEdge(faceA, faceB, 0, 0.1);
      
      // In blend zone (distance 0.05) - should be mixed
      const inBlend = blendFaceEdge(faceA, faceB, 0.05, 0.1);
      
      // Beyond blend (distance 0.2) - should be all faceB
      const beyond = blendFaceEdge(faceA, faceB, 0.2, 0.1);
      
      return { atEdge, inBlend, beyond };
    });
    
    // At edge should match faceA
    expect(result.atEdge.x).toBeCloseTo(1, 5);
    expect(result.atEdge.y).toBeCloseTo(0, 5);
    
    // In blend should be mixed
    expect(result.inBlend.x).toBeGreaterThan(0);
    expect(result.inBlend.x).toBeLessThan(1);
    expect(result.inBlend.y).toBeGreaterThan(0);
    
    // Beyond blend should match faceB
    expect(result.beyond.x).toBeCloseTo(0, 5);
    expect(result.beyond.y).toBeCloseTo(1, 5);
  });
  
  test('widget curvature should create lens effect', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { computeWidgetCurvature } = require('@/lib/navigation/manifold');
      
      return {
        center: computeWidgetCurvature(0, 0, 0.1),
        edge: computeWidgetCurvature(1, 0, 0.1),
        corner: computeWidgetCurvature(1, 1, 0.1),
      };
    });
    
    // Center should have no curvature
    expect(result.center).toBe(0);
    
    // Edge should have some curvature
    expect(result.edge).toBeCloseTo(0.1, 5);
    
    // Corner should have more curvature
    expect(result.corner).toBeCloseTo(0.2, 5);
  });
});

test.describe('Physics Model - Section 5', () => {
  test('damped spring should have critical damping (ζ=1)', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { DEFAULT_PHYSICS_CONFIG } = require('@/lib/navigation/physics');
      return DEFAULT_PHYSICS_CONFIG.damping;
    });
    
    // Critical damping: ζ = 1
    expect(result).toBe(1.0);
  });
  
  test('inertial decay should follow exponential curve', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { applyInertialDecay, DEFAULT_PHYSICS_CONFIG } = require('@/lib/navigation/physics');
      
      const initialVelocity = 100;
      const dt = 0.1;
      
      // Apply decay multiple times
      let v = initialVelocity;
      const velocities = [v];
      for (let i = 0; i < 10; i++) {
        v = applyInertialDecay(v, dt, DEFAULT_PHYSICS_CONFIG);
        velocities.push(v);
      }
      
      return velocities;
    });
    
    // Velocity should decrease exponentially
    expect(result[0]).toBe(100);
    expect(result[result.length - 1]).toBeLessThan(result[0]);
    
    // Each step should reduce velocity
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeLessThan(result[i - 1]);
    }
  });
  
  test('snap stabilization should activate within threshold', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { shouldSnapToGrid, SNAP_THRESHOLD, snapToGrid } = require('@/lib/navigation/physics');
      
      return {
        belowThreshold: shouldSnapToGrid(0.01),
        atThreshold: shouldSnapToGrid(0.02),
        aboveThreshold: shouldSnapToGrid(0.03),
        snapped: snapToGrid(0.01, Math.PI / 2),
      };
    });
    
    // Should snap when below threshold (0.02 rad)
    expect(result.belowThreshold).toBe(true);
    expect(result.atThreshold).toBe(false);
    expect(result.aboveThreshold).toBe(false);
    
    // Snap to grid should round to nearest
    expect(result.snapped).toBe(0);
  });
  
  test('physics state update should integrate correctly', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { updatePhysicsState } = require('@/lib/navigation/physics');
      
      const initialState = {
        position: 0,
        velocity: 0,
        acceleration: 0,
      };
      
      const force = 10;
      const dt = 0.01;
      
      // Update multiple times
      let state = initialState;
      const states = [state];
      for (let i = 0; i < 10; i++) {
        state = updatePhysicsState(state, force, dt);
        states.push(state);
      }
      
      return states;
    });
    
    // Position should increase
    expect(result[result.length - 1].position).toBeGreaterThan(0);
    
    // Velocity should change from 0
    expect(result[result.length - 1].velocity).not.toBe(0);
  });
});

test.describe('Anchor Field - Section 8', () => {
  test('potential should decrease with distance', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { computePotential, DEFAULT_ANCHOR_CONFIG } = require('@/lib/navigation/anchorField');
      
      return {
        near: computePotential({ x: 1, y: 0, z: 0 }, DEFAULT_ANCHOR_CONFIG),
        far: computePotential({ x: 5, y: 0, z: 0 }, DEFAULT_ANCHOR_CONFIG),
        veryFar: computePotential({ x: 10, y: 0, z: 0 }, DEFAULT_ANCHOR_CONFIG),
      };
    });
    
    // Potential should decrease with distance
    expect(result.near).toBeGreaterThan(result.far);
    expect(result.far).toBeGreaterThan(result.veryFar);
  });
  
  test('force field should point toward home', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { computeForceField, DEFAULT_ANCHOR_CONFIG } = require('@/lib/navigation/anchorField');
      
      // Position to the right of home (positive x)
      const force = computeForceField({ x: 2, y: 0, z: 0 }, DEFAULT_ANCHOR_CONFIG);
      
      return force;
    });
    
    // Force should point left (negative x) toward home
    expect(result.x).toBeLessThan(0);
    expect(result.y).toBeCloseTo(0, 5);
    expect(result.z).toBeCloseTo(0, 5);
  });
  
  test('recenter should activate after idle threshold', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { shouldApplyRecenter, DEFAULT_ANCHOR_CONFIG } = require('@/lib/navigation/anchorField');
      
      const state = {
        lastActivityTime: 1000,
        isIdle: false,
      };
      
      return {
        beforeThreshold: shouldApplyRecenter(state, 1000 + 2000, DEFAULT_ANCHOR_CONFIG),
        afterThreshold: shouldApplyRecenter(state, 1000 + 4000, DEFAULT_ANCHOR_CONFIG),
      };
    });
    
    // Should not recenter before threshold (3000ms)
    expect(result.beforeThreshold).toBe(false);
    
    // Should recenter after threshold
    expect(result.afterThreshold).toBe(true);
  });
});
