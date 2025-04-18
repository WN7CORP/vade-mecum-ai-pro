
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    mql.addEventListener("change", onChange)
    
    // Executa imediatamente para definir o estado inicial
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Hook para ver se a tela é muito pequena (celulares)
export function useIsSmallMobile() {
  const [isSmallMobile, setIsSmallMobile] = React.useState<boolean | undefined>(undefined)
  const SMALL_MOBILE_BREAKPOINT = 480

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${SMALL_MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsSmallMobile(window.innerWidth < SMALL_MOBILE_BREAKPOINT)
    }
    
    mql.addEventListener("change", onChange)
    
    // Executa imediatamente para definir o estado inicial
    setIsSmallMobile(window.innerWidth < SMALL_MOBILE_BREAKPOINT)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isSmallMobile
}

// Novos breakpoints para layouts mais otimizados
export function useIsMediumScreen() {
  const [isMediumScreen, setIsMediumScreen] = React.useState<boolean | undefined>(undefined)
  const MEDIUM_SCREEN_BREAKPOINT = 992

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MEDIUM_SCREEN_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMediumScreen(window.innerWidth < MEDIUM_SCREEN_BREAKPOINT)
    }
    
    mql.addEventListener("change", onChange)
    
    // Executa imediatamente para definir o estado inicial
    setIsMediumScreen(window.innerWidth < MEDIUM_SCREEN_BREAKPOINT)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMediumScreen
}
