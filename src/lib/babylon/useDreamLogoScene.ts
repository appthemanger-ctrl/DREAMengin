// Babylon.js dependency removed — logo now uses CSS animations via LogoHero component
export interface DreamLogoSceneOptions {
  dreamSrc?: string
  enginSrc?: string
}

export function useDreamLogoScene() {
  return { canvasRef: null as React.RefObject<HTMLCanvasElement> | null, pause: () => {}, resume: () => {} }
}
