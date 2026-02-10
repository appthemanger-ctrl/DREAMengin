import { test, expect } from '@playwright/test';

test.describe('Quaternion Math Library - Section 3', () => {
  test('identity quaternion should be (1, 0, 0, 0)', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { identityQuaternion } = require('@/lib/navigation/quaternion');
      return identityQuaternion();
    });
    
    expect(result.w).toBe(1);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
  });
  
  test('quaternion from axis-angle should create valid rotation', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { fromAxisAngle, magnitude } = require('@/lib/navigation/quaternion');
      const axis = { x: 0, y: 0, z: 1 }; // Z-axis
      const angle = Math.PI / 2; // 90 degrees
      const q = fromAxisAngle(axis, angle);
      return { q, mag: magnitude(q) };
    });
    
    // Unit quaternion should have magnitude 1
    expect(result.mag).toBeCloseTo(1, 5);
    
    // For 90° rotation around Z-axis:
    // q = [cos(π/4), 0, 0, sin(π/4)]
    expect(result.q.w).toBeCloseTo(Math.cos(Math.PI / 4), 5);
    expect(result.q.z).toBeCloseTo(Math.sin(Math.PI / 4), 5);
  });
  
  test('quaternion multiplication should compose rotations', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { fromAxisAngle, multiply, magnitude } = require('@/lib/navigation/quaternion');
      
      // Two 90° rotations around Z-axis = 180° rotation
      const q1 = fromAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI / 2);
      const q2 = fromAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI / 2);
      const result = multiply(q1, q2);
      
      return { result, mag: magnitude(result) };
    });
    
    // Should still be unit quaternion
    expect(result.mag).toBeCloseTo(1, 5);
    
    // 180° rotation: q = [0, 0, 0, 1]
    expect(result.result.w).toBeCloseTo(0, 5);
    expect(result.result.z).toBeCloseTo(1, 5);
  });
  
  test('normalize should preserve direction but set magnitude to 1', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { normalize, magnitude } = require('@/lib/navigation/quaternion');
      
      // Create non-unit quaternion
      const q = { w: 2, x: 2, y: 2, z: 2 };
      const normalized = normalize(q);
      
      return { 
        normalized, 
        mag: magnitude(normalized),
        originalDirection: { w: q.w / 4, x: q.x / 4, y: q.y / 4, z: q.z / 4 }
      };
    });
    
    expect(result.mag).toBeCloseTo(1, 5);
    expect(result.normalized.w).toBeCloseTo(0.5, 5);
    expect(result.normalized.x).toBeCloseTo(0.5, 5);
  });
  
  test('fromGestureSwipe should create rotation from swipe', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { fromGestureSwipe, magnitude, isValid } = require('@/lib/navigation/quaternion');
      
      // Horizontal swipe
      const q1 = fromGestureSwipe(100, 0, 0.01);
      // Vertical swipe
      const q2 = fromGestureSwipe(0, 100, 0.01);
      // Diagonal swipe
      const q3 = fromGestureSwipe(70, 70, 0.01);
      
      return {
        q1: { q: q1, mag: magnitude(q1), valid: isValid(q1) },
        q2: { q: q2, mag: magnitude(q2), valid: isValid(q2) },
        q3: { q: q3, mag: magnitude(q3), valid: isValid(q3) },
      };
    });
    
    // All should be valid unit quaternions
    expect(result.q1.mag).toBeCloseTo(1, 5);
    expect(result.q2.mag).toBeCloseTo(1, 5);
    expect(result.q3.mag).toBeCloseTo(1, 5);
    expect(result.q1.valid).toBe(true);
    expect(result.q2.valid).toBe(true);
    expect(result.q3.valid).toBe(true);
  });
  
  test('drift correction: normalize should prevent accumulation error', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { fromAxisAngle, multiply, normalize, magnitude } = require('@/lib/navigation/quaternion');
      
      // Simulate many small rotations (drift simulation)
      let q = { w: 1, x: 0, y: 0, z: 0 };
      const smallRotation = fromAxisAngle({ x: 0, y: 0, z: 1 }, 0.01);
      
      // Apply 100 small rotations without normalization
      let accumulated = q;
      for (let i = 0; i < 100; i++) {
        accumulated = multiply(smallRotation, accumulated);
      }
      const magBefore = magnitude(accumulated);
      
      // Apply normalization
      const normalized = normalize(accumulated);
      const magAfter = magnitude(normalized);
      
      return { magBefore, magAfter };
    });
    
    // Without normalization, magnitude drifts from 1
    expect(result.magBefore).not.toBeCloseTo(1, 5);
    
    // After normalization, magnitude is restored to 1
    expect(result.magAfter).toBeCloseTo(1, 5);
  });
  
  test('slerp should smoothly interpolate between quaternions', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      const { fromAxisAngle, slerp, magnitude } = require('@/lib/navigation/quaternion');
      
      // Start and end rotations
      const q1 = fromAxisAngle({ x: 0, y: 0, z: 1 }, 0);
      const q2 = fromAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI / 2);
      
      // Interpolate at t=0, 0.5, 1
      const t0 = slerp(q1, q2, 0);
      const tHalf = slerp(q1, q2, 0.5);
      const t1 = slerp(q1, q2, 1);
      
      return {
        t0: { q: t0, mag: magnitude(t0) },
        tHalf: { q: tHalf, mag: magnitude(tHalf) },
        t1: { q: t1, mag: magnitude(t1) },
      };
    });
    
    // All interpolated quaternions should be unit quaternions
    expect(result.t0.mag).toBeCloseTo(1, 5);
    expect(result.tHalf.mag).toBeCloseTo(1, 5);
    expect(result.t1.mag).toBeCloseTo(1, 5);
    
    // t=0 should match q1 (identity)
    expect(result.t0.q.w).toBeCloseTo(1, 5);
    
    // t=1 should match q2 (90° rotation)
    expect(result.t1.q.w).toBeCloseTo(Math.cos(Math.PI / 4), 5);
  });
});
