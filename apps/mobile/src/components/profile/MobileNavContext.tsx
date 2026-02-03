import React, { createContext, useContext, useState, ReactNode } from 'react'

export type MobileNavSection =
  | 'basic'
  | 'climbing'
  | 'social'
  | 'experience'
  | 'advanced'
  | 'footprints'
  | 'settings'

interface MobileNavContextType {
  activeSection: MobileNavSection
  setActiveSection: (section: MobileNavSection) => void
  scrollToSection: (section: MobileNavSection) => void
  registerSectionRef: (section: MobileNavSection, ref: any) => void
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(undefined)

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<MobileNavSection>('basic')
  const sectionRefs = React.useRef<Map<MobileNavSection, any>>(new Map())

  const registerSectionRef = (section: MobileNavSection, ref: any) => {
    sectionRefs.current.set(section, ref)
  }

  const scrollToSection = (section: MobileNavSection) => {
    const ref = sectionRefs.current.get(section)
    if (ref?.current?.measureLayout) {
      // Scroll to section implementation
      setActiveSection(section)
    }
  }

  return (
    <MobileNavContext.Provider
      value={{
        activeSection,
        setActiveSection,
        scrollToSection,
        registerSectionRef,
      }}
    >
      {children}
    </MobileNavContext.Provider>
  )
}

export function useMobileNav() {
  const context = useContext(MobileNavContext)
  if (context === undefined) {
    throw new Error('useMobileNav must be used within a MobileNavProvider')
  }
  return context
}
