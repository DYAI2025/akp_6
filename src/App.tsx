import { useState, useEffect, useCallback, useRef } from 'react';
import {
  indexEntries,
  kompetenzen,
  leistungen,
  netzwerk,
  pages,
  projects,
  publikationen,
  timeline,
  zusatzleistungen,
  type PageId,
  type Project,
} from './siteData';
import { filterProjects, getPageByHash, shouldDelegateWheelToScrollable } from './navigation';

// Main App Component
export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('cover');
  const [previousPage, setPreviousPage] = useState<PageId | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [coverOpened, setCoverOpened] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('alle');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [history, setHistory] = useState<PageId[]>(['cover']);
  const lastWheelTime = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Handle hash routing
  useEffect(() => {
    const pageFromHash = getPageByHash(window.location.hash);
    if (pageFromHash) {
      if (pageFromHash !== 'cover') {
        setCoverOpened(true);
      }
      setCurrentPage(pageFromHash);
      setHistory(pageFromHash === 'cover' ? ['cover'] : ['cover', pageFromHash]);
    }
  }, []);

  // Keep browser hash and document metadata in sync with the active page.
  useEffect(() => {
    if (window.location.hash !== `#${currentPage}`) {
      window.location.hash = currentPage;
    }

    const page = pages.find(p => p.id === currentPage);
    if (page) {
      document.title = `${page.title} — AKP Architekten Kauschke + Partner`;
    }
  }, [currentPage]);

  // Support browser back/forward buttons and manual hash edits.
  useEffect(() => {
    const handleHashChange = () => {
      const pageFromHash = getPageByHash(window.location.hash);
      if (!pageFromHash || pageFromHash === currentPage) {
        return;
      }

      if (pageFromHash !== 'cover') {
        setCoverOpened(true);
      }
      setCurrentPage(pageFromHash);
      setHistory(prev => (prev.at(-1) === pageFromHash ? prev : [...prev, pageFromHash]));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentPage]);

  // Navigate to page
  const navigateTo = useCallback((pageId: PageId) => {
    if (isTransitioning || pageId === currentPage) return;
    
    setIsTransitioning(true);
    setPreviousPage(currentPage);
    
    if (pageId !== 'cover' && !coverOpened) {
      setCoverOpened(true);
    }
    
    setTimeout(() => {
      setCurrentPage(pageId);
      setHistory(prev => (prev.at(-1) === pageId ? prev : [...prev, pageId]));
    }, 50);
    
    setTimeout(() => {
      setIsTransitioning(false);
      setPreviousPage(null);
    }, reducedMotion ? 300 : 1200);
  }, [currentPage, isTransitioning, coverOpened, reducedMotion]);

  // Go to next page
  const nextPage = useCallback(() => {
    const currentIndex = pages.findIndex(p => p.id === currentPage);
    if (currentIndex < pages.length - 1) {
      navigateTo(pages[currentIndex + 1].id);
    }
  }, [currentPage, navigateTo]);

  // Go to previous page
  const prevPage = useCallback(() => {
    const currentIndex = pages.findIndex(p => p.id === currentPage);
    if (currentIndex > 0) {
      navigateTo(pages[currentIndex - 1].id);
    }
  }, [currentPage, navigateTo]);

  // Go to index
  const goToIndex = useCallback(() => {
    navigateTo('index');
  }, [navigateTo]);

  // Go to cover
  const goToCover = useCallback(() => {
    navigateTo('cover');
  }, [navigateTo]);

  // Go back in history
  const goBack = useCallback(() => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const previousPageId = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setIsTransitioning(true);
      setPreviousPage(currentPage);
      
      setTimeout(() => {
        setCurrentPage(previousPageId);
      }, 50);
      
      setTimeout(() => {
        setIsTransitioning(false);
        setPreviousPage(null);
      }, reducedMotion ? 300 : 1200);
    }
  }, [history, currentPage, reducedMotion]);

  // Handle wheel events - throttle to prevent rapid page changes
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const container = containerRef.current;
      if (container && shouldDelegateWheelToScrollable(e, container)) {
        return;
      }

      e.preventDefault();
      
      const now = Date.now();
      if (now - lastWheelTime.current < 1000) return; // 1 second throttle
      lastWheelTime.current = now;
      
      if (!coverOpened) {
        setCoverOpened(true);
        setTimeout(() => navigateTo('index'), 800);
        return;
      }
      
      if (e.deltaY > 0 || e.deltaX > 0) {
        nextPage();
      } else if (e.deltaY < 0 || e.deltaX < 0) {
        prevPage();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [coverOpened, nextPage, prevPage, navigateTo]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          nextPage();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          prevPage();
          break;
        case 'Escape':
          goToIndex();
          break;
        case 'Home':
          goToCover();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, goToIndex, goToCover]);

  // Handle touch/swipe
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          nextPage();
        } else {
          prevPage();
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [nextPage, prevPage]);

  // Filter projects
  const filteredProjects = filterProjects(projects, selectedFilter);

  // Render page content based on current page
  const renderPageContent = (pageId: PageId) => {
    switch (pageId) {
      case 'cover':
        return <CoverPage onOpen={() => { setCoverOpened(true); setTimeout(() => navigateTo('index'), 800); }} isOpened={coverOpened} reducedMotion={reducedMotion} />;
      case 'index':
        return <IndexPage entries={indexEntries} onNavigate={navigateTo} />;
      case 'buero':
        return <BueroPage />;
      case 'leistungen':
        return <LeistungenPage leistungen={leistungen} zusatzleistungen={zusatzleistungen} />;
      case 'projekte':
        return <ProjektePage projects={filteredProjects} filter={selectedFilter} onFilterChange={setSelectedFilter} />;
      case 'wohnen':
        return <WohnenPage projects={projects.filter(p => p.category === 'wohnen')} />;
      case 'gesundheit':
        return <GesundheitPage />;
      case 'gewerbe':
        return <GewerbePage projects={projects.filter(p => p.category === 'gewerbe')} />;
      case 'bestand':
        return <BestandPage />;
      case 'kompetenzen':
        return <KompetenzenPage data={kompetenzen} />;
      case 'geschichte':
        return <GeschichtePage timeline={timeline} />;
      case 'publikationen':
        return <PublikationenPage data={publikationen} />;
      case 'netzwerk':
        return <NetzwerkPage data={netzwerk} />;
      case 'kontakt':
        return <KontaktPage />;
      case 'impressum':
        return <ImpressumPage />;
      default:
        return null;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-[#0a0f0a]"
      style={{ 
        touchAction: 'pan-y',
        userSelect: 'none'
      }}
    >
      {/* Magazine Stage */}
      <div 
        className="magazine-stage relative w-full h-full"
        style={{ 
          perspective: reducedMotion ? 'none' : '2000px',
          perspectiveOrigin: '50% 50%'
        }}
      >
        {/* All pages in Z-space */}
        {pages.map((page, index) => {
          const isActive = currentPage === page.id;
          const wasActive = previousPage === page.id;
          const currentIndex = pages.findIndex(p => p.id === currentPage);
          const pageIndex = index;
          const diff = pageIndex - currentIndex;
          
          let transform = '';
          let opacity = 0;
          let zIndex = 0;
          let pointerEvents: 'auto' | 'none' = 'none';
          
          if (reducedMotion) {
            if (isActive) {
              opacity = 1;
              zIndex = 100;
              pointerEvents = 'auto';
            } else if (wasActive && isTransitioning) {
              opacity = 0;
              zIndex = 50;
              transform = 'scale(0.95)';
            } else {
              opacity = 0;
              zIndex = 0;
            }
          } else {
            if (isActive) {
              transform = 'translateZ(0) rotateY(0deg)';
              opacity = 1;
              zIndex = 100;
              pointerEvents = 'auto';
            } else if (wasActive && isTransitioning) {
              // Page leaving
              const direction = diff > 0 ? -1 : 1;
              transform = `translateZ(200px) rotateY(${direction * 15}deg) translateX(${direction * -5}%)`;
              opacity = 0.3;
              zIndex = 80;
            } else if (diff > 0) {
              // Future pages - stacked behind
              transform = `translateZ(${-300 * diff}px) scale(${1 - diff * 0.05})`;
              opacity = Math.max(0, 0.5 - diff * 0.15);
              zIndex = 100 - diff;
            } else {
              // Past pages - folded away
              transform = `translateZ(${200}px) rotateY(${-20}deg) translateX(-20%)`;
              opacity = 0;
              zIndex = 50 + diff;
            }
          }
          
          // Special handling for cover
          if (page.id === 'cover' && coverOpened && currentPage !== 'cover') {
            transform = 'translateZ(400px) rotateY(-35deg) translateX(-30%)';
            opacity = 0.15;
            zIndex = 10;
          }
          
          return (
            <div
              key={page.id}
              className={`page absolute inset-0 transition-all ${reducedMotion ? 'duration-300' : 'duration-[1200ms]'}`}
              style={{
                transform,
                opacity,
                zIndex,
                pointerEvents,
                transformStyle: 'preserve-3d',
                transitionTimingFunction: reducedMotion ? 'ease-out' : 'cubic-bezier(0.19, 1, 0.22, 1)',
                willChange: 'transform, opacity'
              }}
            >
              {/* Page content wrapper - magazine frame */}
              <div className="absolute inset-4 md:inset-8 lg:inset-12 xl:inset-16 flex items-center justify-center">
                <div 
                  className="w-full h-full max-w-[1600px] bg-[#f5f2ed] shadow-2xl relative overflow-hidden"
                  style={{ 
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 25px 50px -12px rgba(0,0,0,0.5)',
                    aspectRatio: page.id === 'cover' ? 'auto' : undefined
                  }}
                >
                  {/* Subtle grid lines */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
                    backgroundImage: `
                      linear-gradient(to right, #1a1a1a 1px, transparent 1px),
                      linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px'
                  }} />
                  
                  {/* Page content */}
                  <div className="relative z-10 w-full h-full overflow-hidden">
                    {renderPageContent(page.id)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation UI - outside magazine */}
      {currentPage !== 'cover' && (
        <>
          {/* Bottom navigation bar */}
          <div className="fixed bottom-0 left-0 right-0 z-[200] flex items-center justify-between px-6 py-4 pointer-events-none">
            {/* Left: Back and Index buttons */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={goBack}
                disabled={history.length <= 1 || isTransitioning}
                className="px-4 py-2 bg-[#1a1f1a]/80 backdrop-blur-sm text-[#f5f2ed] text-sm font-medium rounded hover:bg-[#2a2f2a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Zurück"
              >
                ← Zurück
              </button>
              <button
                onClick={goToIndex}
                disabled={isTransitioning}
                className="px-4 py-2 bg-[#1a1f1a]/80 backdrop-blur-sm text-[#f5f2ed] text-sm font-medium rounded hover:bg-[#2a2f2a] transition-colors"
                aria-label="Inhaltsverzeichnis"
              >
                Index
              </button>
            </div>

            {/* Center: Page indicator */}
            <div className="pointer-events-auto">
              <div className="px-4 py-2 bg-[#1a1f1a]/80 backdrop-blur-sm text-[#f5f2ed]/60 text-xs tracking-wider rounded">
                {pages.findIndex(p => p.id === currentPage) + 1} / {pages.length}
              </div>
            </div>

            {/* Right: Next/Prev buttons */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={prevPage}
                disabled={currentPage === 'index' || isTransitioning}
                className="px-4 py-2 bg-[#1a1f1a]/80 backdrop-blur-sm text-[#f5f2ed] text-sm font-medium rounded hover:bg-[#2a2f2a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Vorherige Seite"
              >
                ◄
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === 'impressum' || isTransitioning}
                className="px-4 py-2 bg-[#1a1f1a]/80 backdrop-blur-sm text-[#f5f2ed] text-sm font-medium rounded hover:bg-[#2a2f2a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Nächste Seite"
              >
                ►
              </button>
            </div>
          </div>
        </>
      )}

      {/* Cover hint */}
      {currentPage === 'cover' && !coverOpened && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-pulse">
          <div className="px-6 py-3 bg-[#1a1f1a]/60 backdrop-blur-sm text-[#f5f2ed]/70 text-sm tracking-wider rounded-full">
            Scrollen oder klicken zum Öffnen
          </div>
        </div>
      )}
    </div>
  );
}

// Cover Page Component
function CoverPage({ onOpen, isOpened, reducedMotion }: { onOpen: () => void; isOpened: boolean; reducedMotion: boolean }) {
  return (
    <div 
      className="w-full h-full cursor-pointer flex flex-col"
      onClick={!isOpened ? onOpen : undefined}
    >
      {/* Vento Grid Layout */}
      <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-3 p-6 md:p-8 lg:p-10">
        
        {/* Large featured image - left */}
        <div 
          className={`col-span-12 md:col-span-7 row-span-7 relative overflow-hidden group ${!reducedMotion ? 'animate-fadeIn' : ''}`}
          style={{ animationDelay: '0.2s' }}
        >
          <img 
            src="/images/cover-building.jpg" 
            alt="Projektvisualisierung aus dem AKP-Archiv"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white/80 text-xs tracking-widest uppercase">
            Projektarchiv
          </div>
        </div>

        {/* Smaller images - right column */}
        <div 
          className={`col-span-6 md:col-span-5 row-span-3 relative overflow-hidden ${!reducedMotion ? 'animate-fadeIn' : ''}`}
          style={{ animationDelay: '0.4s' }}
        >
          <img 
            src="/images/klinker-abend.jpg" 
            alt="Projektbild aus dem AKP-Archiv"
            className="w-full h-full object-cover"
          />
        </div>
        <div 
          className={`col-span-6 md:col-span-5 row-span-3 relative overflow-hidden ${!reducedMotion ? 'animate-fadeIn' : ''}`}
          style={{ animationDelay: '0.5s' }}
        >
          <img 
            src="/images/holz-fassade.jpg" 
            alt="Projektbild aus dem AKP-Archiv"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text card - bottom left */}
        <div 
          className={`col-span-12 md:col-span-7 row-span-4 flex flex-col justify-center p-6 md:p-8 ${!reducedMotion ? 'animate-fadeIn' : ''}`}
          style={{ animationDelay: '0.6s' }}
        >
          <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl lg:text-4xl font-medium text-[#1a1a1a] leading-tight mb-3">
            AKP Architekten<br />Kauschke + Partner
          </h1>
          <p className="text-[#1a1a1a]/60 text-sm md:text-base mb-4">
            Architektur und Generalplanung aus Berlin
          </p>
          <p className="text-[#1a1a1a]/50 text-xs md:text-sm leading-relaxed max-w-lg">
            Architektur, die städtebaulichen Kontext, wirtschaftliche Realisierbarkeit und technische Planungssicherheit zusammenführt.
          </p>
          
          {/* Meta info */}
          <div className="mt-6 flex flex-wrap gap-4 text-[10px] md:text-xs text-[#1a1a1a]/40 tracking-wider uppercase">
            <span>Berlin</span>
            <span>·</span>
            <span>seit 1991</span>
            <span>·</span>
            <span>Entwurf bis Schlüsselübergabe</span>
          </div>
        </div>

        {/* Bottom index bar */}
        <div 
          className={`col-span-12 md:col-span-5 row-span-1 flex items-center justify-between px-4 border-t border-[#1a1a1a]/10 ${!reducedMotion ? 'animate-fadeIn' : ''}`}
          style={{ animationDelay: '0.8s' }}
        >
          <div className="flex gap-4 text-[10px] text-[#1a1a1a]/40 tracking-wider uppercase">
            <span>Wohnungsbau</span>
            <span>Gesundheitsbau</span>
            <span>Sanierung</span>
          </div>
        </div>
      </div>

      {/* Navigation hints */}
      <div className={`absolute bottom-6 right-6 md:bottom-8 md:right-8 flex gap-4 text-[10px] text-[#1a1a1a]/30 tracking-wider uppercase ${!reducedMotion ? 'animate-fadeIn' : ''}`} style={{ animationDelay: '1s' }}>
        <span>Inhaltsverzeichnis öffnen</span>
        <span>·</span>
        <span>Kontakt</span>
      </div>
    </div>
  );
}

// Index Page Component
function IndexPage({ entries, onNavigate }: { entries: typeof indexEntries; onNavigate: (id: PageId) => void }) {
  return (
    <div className="w-full h-full p-6 md:p-8 lg:p-10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl lg:text-5xl font-medium text-[#1a1a1a] mb-2">
          Architektonischer Atlas
        </h2>
        <p className="text-[#1a1a1a]/50 text-sm md:text-base">
          Büro, Leistungen, Projekte, Kompetenzen, Geschichte und Netzwerk
        </p>
      </div>

      {/* Grid of index cards */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 overflow-y-auto pr-2"
        data-scrollable="true">
        {entries.map((entry, i) => (
          <button
            key={entry.id}
            onClick={() => onNavigate(entry.id as PageId)}
            className="group text-left p-4 md:p-5 bg-white/50 border border-[#1a1a1a]/5 hover:border-[#1a1a1a]/15 hover:bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <span className="text-[10px] md:text-xs text-[#1a1a1a]/30 tracking-wider font-mono">
              {entry.number}
            </span>
            <h3 className="font-['Playfair_Display'] text-base md:text-lg text-[#1a1a1a] mt-1 mb-2 group-hover:text-[#2a4a2a] transition-colors">
              {entry.title}
            </h3>
            <p className="text-xs md:text-sm text-[#1a1a1a]/50 leading-relaxed mb-3">
              {entry.text}
            </p>
            <span className="text-[10px] md:text-xs text-[#1a1a1a]/30 tracking-wider uppercase group-hover:text-[#1a1a1a]/60 transition-colors">
              Aufblättern →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Büro & Haltung Page
function BueroPage() {
  return (
    <div className="w-full h-full grid grid-cols-12 grid-rows-12 gap-3 p-6 md:p-8 lg:p-10 overflow-hidden">
      {/* Main text card - left */}
      <div className="col-span-12 md:col-span-7 row-span-7 p-6 md:p-8 flex flex-col justify-center">
        <span className="text-[10px] md:text-xs text-[#1a1a1a]/40 tracking-widest uppercase mb-4">02 / Büro & Haltung</span>
        <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl lg:text-4xl font-medium text-[#1a1a1a] leading-tight mb-4">
          Kontext statt Stilvorgabe
        </h2>
        <div className="text-sm md:text-base text-[#1a1a1a]/70 leading-relaxed space-y-4">
          <p>
            AKP ist ein erfahrenes Berliner Architekturbüro und Generalplaner, seit 1991 mit städtebaulicher Einbindung, Kostenkontrolle und Materialangemessenheit.
          </p>
          <p>
            Das Büro vertritt keine materialdogmatische Haltung. Lösungen ergeben sich aus Ort, Funktion, Wirtschaftlichkeit, Ökologie und Bauherrenziel.
          </p>
          <p>
            Die Interessen der Bauherren stehen im Mittelpunkt jeder Planungsentscheidung.
          </p>
        </div>
      </div>

      {/* Image - right */}
      <div className="col-span-12 md:col-span-5 row-span-7 relative overflow-hidden">
        <img 
          src="/images/buero-team.jpg" 
          alt="AKP Büro Berlin"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Bottom cards */}
      <div className="col-span-6 md:col-span-3 row-span-4 p-4 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-sm md:text-base text-[#1a1a1a] mb-2">Kontext statt Stilvorgabe</h4>
        <p className="text-xs text-[#1a1a1a]/50">Architektur aus dem Ort und seiner Geschichte.</p>
      </div>
      <div className="col-span-6 md:col-span-3 row-span-4 p-4 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-sm md:text-base text-[#1a1a1a] mb-2">Wirtschaftlichkeit</h4>
        <p className="text-xs text-[#1a1a1a]/50">Kostenkontrolle als Entwurfsfaktor.</p>
      </div>
      <div className="col-span-6 md:col-span-2 row-span-4 p-4 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-sm md:text-base text-[#1a1a1a] mb-2">Planungssicherheit</h4>
        <p className="text-xs text-[#1a1a1a]/50">Technische Kompetenz.</p>
      </div>
      <div className="col-span-6 md:col-span-2 row-span-4 p-4 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-sm md:text-base text-[#1a1a1a] mb-2">Material</h4>
        <p className="text-xs text-[#1a1a1a]/50">Nach Aufgabe und Ort.</p>
      </div>
      <div className="col-span-12 md:col-span-2 row-span-4 p-4 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-sm md:text-base text-[#1a1a1a] mb-2">Grundrisse</h4>
        <p className="text-xs text-[#1a1a1a]/50">Ordnendes Werkzeug.</p>
      </div>
    </div>
  );
}

// Leistungen & Prozess Page
function LeistungenPage({ leistungen: leistungenData, zusatzleistungen }: { leistungen: Array<{number: string; title: string; desc: string}>; zusatzleistungen: string[] }) {
  return (
    <div className="w-full h-full p-6 md:p-8 lg:p-10 flex flex-col overflow-hidden">
      <div className="mb-6">
        <span className="text-[10px] md:text-xs text-[#1a1a1a]/40 tracking-widest uppercase mb-2 block">03 / Leistungen</span>
        <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl lg:text-4xl font-medium text-[#1a1a1a]">
          Leistungen & Prozess
        </h2>
      </div>

      {/* Process band */}
      <div className="flex-1 grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3 mb-6">
        {leistungenData.map((l) => (
          <div 
            key={l.number}
            className="p-3 md:p-4 bg-white/60 border border-[#1a1a1a]/5 hover:border-[#1a1a1a]/15 transition-all hover:shadow-md group"
          >
            <span className="text-2xl md:text-3xl font-mono text-[#1a1a1a]/10 group-hover:text-[#1a1a1a]/30 transition-colors">
              {l.number}
            </span>
            <h4 className="font-['Playfair_Display'] text-sm md:text-base text-[#1a1a1a] mt-2 mb-1">
              {l.title}
            </h4>
            <p className="text-[10px] md:text-xs text-[#1a1a1a]/50">
              {l.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Additional services and CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-[#1a1f1a] text-[#f5f2ed]">
          <h4 className="font-['Playfair_Display'] text-lg mb-3">Zusätzliche Leistungen</h4>
          <ul className="text-xs md:text-sm text-[#f5f2ed]/70 space-y-1">
            {zusatzleistungen.map((z, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#f5f2ed]/30">·</span>
                {z}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5 flex flex-col justify-center">
          <p className="font-['Playfair_Display'] text-xl md:text-2xl text-[#1a1a1a] leading-relaxed">
            Von der ersten Analyse bis zur Schlüsselübergabe.
          </p>
          <p className="text-sm text-[#1a1a1a]/50 mt-3">
            Generalplanung aus einer Hand.
          </p>
        </div>
      </div>
    </div>
  );
}

// Projekte Page
function ProjektePage({ 
  projects, 
  filter, 
  onFilterChange
}: { 
  projects: Project[]; 
  filter: string; 
  onFilterChange: (f: string) => void;
}) {
  const filters = ['alle', 'wohnen', 'gesundheit', 'gewerbe', 'bestand'];
  
  return (
    <div className="w-full h-full p-6 md:p-8 lg:p-10 flex flex-col overflow-hidden">
      <div className="mb-4">
        <span className="text-[10px] md:text-xs text-[#1a1a1a]/40 tracking-widest uppercase mb-2 block">04 / Projektarchiv</span>
        <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl lg:text-4xl font-medium text-[#1a1a1a]">
          Projektarchiv
        </h2>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-4 py-2 text-xs tracking-wider uppercase whitespace-nowrap transition-all ${
              filter === f 
                ? 'bg-[#1a1f1a] text-[#f5f2ed]' 
                : 'bg-white/50 text-[#1a1a1a]/50 hover:bg-white hover:text-[#1a1a1a]'
            }`}
          >
            {f === 'alle' ? 'Alle Projekte' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Projects grid */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pr-2"
        data-scrollable="true">
        {projects.map((project) => (
          <div 
            key={project.id}
            className="group bg-white/60 border border-[#1a1a1a]/5 hover:border-[#1a1a1a]/15 transition-all overflow-hidden"
          >
            {project.image && (
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src={project.image} 
                  alt={`Projektvisualisierung: ${project.title}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}
            <div className="p-4">
              <h4 className="font-['Playfair_Display'] text-sm md:text-base text-[#1a1a1a] mb-1">
                {project.title}
              </h4>
              <p className="text-[10px] md:text-xs text-[#1a1a1a]/40 mb-2">
                {project.location} · {project.typology}
              </p>
              <p className="text-xs text-[#1a1a1a]/50 mb-3 line-clamp-2">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {project.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[9px] px-2 py-0.5 bg-[#1a1a1a]/5 text-[#1a1a1a]/40">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Wohnen & Stadtreparatur Page
function WohnenPage({ projects }: { projects: Project[] }) {
  return (
    <div className="w-full h-full grid grid-cols-12 grid-rows-12 gap-3 p-6 md:p-8 lg:p-10 overflow-hidden">
      {/* Large image */}
      <div className="col-span-12 md:col-span-8 row-span-6 relative overflow-hidden">
        <img 
          src="/images/cover-building.jpg" 
          alt="Projektvisualisierung aus dem AKP-Archiv"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white/70 text-xs tracking-widest uppercase">
          Projektvisualisierung aus dem AKP-Archiv
        </div>
      </div>

      {/* Text content */}
      <div className="col-span-12 md:col-span-4 row-span-6 p-5 flex flex-col justify-center">
        <span className="text-[10px] text-[#1a1a1a]/40 tracking-widest uppercase mb-3">05 / Wohnen</span>
        <h2 className="font-['Playfair_Display'] text-xl md:text-2xl lg:text-3xl font-medium text-[#1a1a1a] leading-tight mb-4">
          Wohnen &<br />Stadtreparatur
        </h2>
        <p className="text-sm text-[#1a1a1a]/60 leading-relaxed mb-4">
          Baulückenschließung, Nachverdichtung und barrierefreies Wohnen in komplexem städtischem Umfeld.
        </p>
        <div className="text-xs text-[#1a1a1a]/40 space-y-1">
          <p>· Stadtreparatur</p>
          <p>· Preisgünstiger Wohnraum</p>
          <p>· Ökologische Materiallogik</p>
        </div>
      </div>

      {/* Second image */}
      <div className="col-span-6 md:col-span-4 row-span-5 relative overflow-hidden">
        <img 
          src="/images/wohnen-hof.jpg" 
          alt="Wohnqualität und Freiraum"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Project cards */}
      <div className="col-span-6 md:col-span-4 row-span-5 p-4 bg-white/60 border border-[#1a1a1a]/5 overflow-y-auto"
        data-scrollable="true">
        <h4 className="font-['Playfair_Display'] text-sm text-[#1a1a1a] mb-3">Projekte</h4>
        <div className="space-y-2">
          {projects.slice(0, 4).map(p => (
            <div key={p.id} className="text-xs border-b border-[#1a1a1a]/5 pb-2">
              <p className="text-[#1a1a1a]">{p.title}</p>
              <p className="text-[#1a1a1a]/40">{p.location}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Small image */}
      <div className="col-span-12 md:col-span-4 row-span-5 relative overflow-hidden">
        <img 
          src="/images/holz-fassade.jpg" 
          alt="Projektbild aus dem AKP-Archiv"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

// Gesundheit Page
function GesundheitPage() {
  return (
    <div className="w-full h-full grid grid-cols-12 grid-rows-12 gap-3 p-6 md:p-8 lg:p-10 overflow-hidden">
      {/* Panoramic image */}
      <div className="col-span-12 row-span-6 relative overflow-hidden">
        <img 
          src="/images/innenraum-atrium.jpg" 
          alt="Räumliche Studie aus dem AKP-Archiv"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        <div className="absolute top-6 left-6 max-w-md">
          <span className="text-[10px] text-white/50 tracking-widest uppercase mb-2 block">06 / Gesundheit</span>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl text-white leading-tight">
            Gesundheit, Pflege &<br />öffentliche Bauten
          </h2>
        </div>
      </div>

      {/* Case study cards */}
      <div className="col-span-4 md:col-span-2 row-span-5 p-3 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-xs md:text-sm text-[#1a1a1a] mb-1">Funktion</h4>
        <p className="text-[10px] text-[#1a1a1a]/50">Klare Nutzungsstrukturen und Orientierung.</p>
      </div>
      <div className="col-span-4 md:col-span-2 row-span-5 p-3 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-xs md:text-sm text-[#1a1a1a] mb-1">Orientierung</h4>
        <p className="text-[10px] text-[#1a1a1a]/50">Intuitive Wegeführung und Erschließung.</p>
      </div>
      <div className="col-span-4 md:col-span-2 row-span-5 p-3 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-xs md:text-sm text-[#1a1a1a] mb-1">Sicherheit</h4>
        <p className="text-[10px] text-[#1a1a1a]/50">Sicherheitstechnische Anforderungen.</p>
      </div>
      <div className="col-span-4 md:col-span-2 row-span-5 p-3 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-xs md:text-sm text-[#1a1a1a] mb-1">Licht</h4>
        <p className="text-[10px] text-[#1a1a1a]/50">Natürliche Belichtung und Atmosphäre.</p>
      </div>
      <div className="col-span-4 md:col-span-2 row-span-5 p-3 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-xs md:text-sm text-[#1a1a1a] mb-1">Energie</h4>
        <p className="text-[10px] text-[#1a1a1a]/50">Energieeffiziente Gebäudehülle.</p>
      </div>
      <div className="col-span-4 md:col-span-2 row-span-5 p-3 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-xs md:text-sm text-[#1a1a1a] mb-1">Denkmal</h4>
        <p className="text-[10px] text-[#1a1a1a]/50">Respekt vor bestehender Bausubstanz.</p>
      </div>
    </div>
  );
}

// Gewerbe Page
function GewerbePage({ projects }: { projects: Project[] }) {
  return (
    <div className="w-full h-full grid grid-cols-12 grid-rows-12 gap-3 p-6 md:p-8 lg:p-10 overflow-hidden">
      {/* Image */}
      <div className="col-span-12 md:col-span-6 row-span-6 relative overflow-hidden">
        <img 
          src="/images/industrie-halle.jpg" 
          alt="Projektvisualisierung aus dem AKP-Archiv"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Text */}
      <div className="col-span-12 md:col-span-6 row-span-6 p-6 flex flex-col justify-center">
        <span className="text-[10px] text-[#1a1a1a]/40 tracking-widest uppercase mb-3">07 / Gewerbe</span>
        <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-medium text-[#1a1a1a] leading-tight mb-4">
          Gewerbe, Industrie &<br />Logistik
        </h2>
        <p className="text-sm text-[#1a1a1a]/60 leading-relaxed mb-4">
          Funktionalität, Wirtschaftlichkeit und ästhetischer Anspruch bei engem Budget. Vorfertigung und Corporate Architecture.
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#1a1f1a] text-[#f5f2ed]">
            <span className="text-[#f5f2ed]/50">Fokus</span>
            <p className="mt-1">Prozesslogik und Erweiterbarkeit</p>
          </div>
          <div className="p-3 bg-[#1a1f1a] text-[#f5f2ed]">
            <span className="text-[#f5f2ed]/50">Ansatz</span>
            <p className="mt-1">Green Building</p>
          </div>
        </div>
      </div>

      {/* Project list */}
      <div className="col-span-12 row-span-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        {projects.map(p => (
          <div key={p.id} className="p-4 bg-white/60 border border-[#1a1a1a]/5">
            <h4 className="font-['Playfair_Display'] text-sm text-[#1a1a1a] mb-1">{p.title}</h4>
            <p className="text-[10px] text-[#1a1a1a]/40 mb-2">{p.location}</p>
            <p className="text-xs text-[#1a1a1a]/50">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bestand Page
function BestandPage() {
  return (
    <div className="w-full h-full grid grid-cols-12 grid-rows-12 gap-3 p-6 md:p-8 lg:p-10 overflow-hidden">
      {/* Main content */}
      <div className="col-span-12 md:col-span-7 row-span-6 p-6 flex flex-col justify-center">
        <span className="text-[10px] text-[#1a1a1a]/40 tracking-widest uppercase mb-3">08 / Bestand</span>
        <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-medium text-[#1a1a1a] leading-tight mb-4">
          Bestand, Sanierung &<br />Modernisierung
        </h2>
        <blockquote className="text-lg md:text-xl font-['Playfair_Display'] text-[#1a1a1a]/70 italic border-l-2 border-[#1a1a1a]/20 pl-4">
          „Bestehende Stadt weiterbauen statt nur neu bebauen."
        </blockquote>
      </div>

      {/* Image */}
      <div className="col-span-12 md:col-span-5 row-span-6 relative overflow-hidden">
        <img 
          src="/images/sanierung-vorher.jpg" 
          alt="Bestand Berlin"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Topic cards */}
      <div className="col-span-4 md:col-span-2 row-span-5 p-3 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-xs text-[#1a1a1a] mb-1">Umnutzung</h4>
        <p className="text-[10px] text-[#1a1a1a]/50">Neue Funktionen für Bestandsbauten.</p>
      </div>
      <div className="col-span-4 md:col-span-2 row-span-5 p-3 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-xs text-[#1a1a1a] mb-1">Bestandserhalt</h4>
        <p className="text-[10px] text-[#1a1a1a]/50">Substanzerhalt und Wertsteigerung.</p>
      </div>
      <div className="col-span-4 md:col-span-2 row-span-5 p-3 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-xs text-[#1a1a1a] mb-1">Balkonergänzung</h4>
        <p className="text-[10px] text-[#1a1a1a]/50">Wohnqualität verbessern.</p>
      </div>
      <div className="col-span-4 md:col-span-2 row-span-5 p-3 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-xs text-[#1a1a1a] mb-1">Dachausbau</h4>
        <p className="text-[10px] text-[#1a1a1a]/50">Zusätzliche Nutzfläche.</p>
      </div>
      <div className="col-span-4 md:col-span-2 row-span-5 p-3 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-xs text-[#1a1a1a] mb-1">Energetische Sanierung</h4>
        <p className="text-[10px] text-[#1a1a1a]/50">Energieverbrauch senken.</p>
      </div>
      <div className="col-span-4 md:col-span-2 row-span-5 p-3 bg-white/60 border border-[#1a1a1a]/5">
        <h4 className="font-['Playfair_Display'] text-xs text-[#1a1a1a] mb-1">Materialgesundheit</h4>
        <p className="text-[10px] text-[#1a1a1a]/50">Schadstoffarme Sanierung.</p>
      </div>
    </div>
  );
}

// Kompetenzen Page
function KompetenzenPage({ data }: { data: typeof kompetenzen }) {
  return (
    <div className="w-full h-full p-6 md:p-8 lg:p-10 flex flex-col overflow-hidden">
      <div className="mb-6">
        <span className="text-[10px] text-[#1a1a1a]/40 tracking-widest uppercase mb-2 block">09 / Kompetenzen</span>
        <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl lg:text-4xl font-medium text-[#1a1a1a]">
          Kompetenzen
        </h2>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {data.map((k, i) => (
          <div 
            key={i}
            className="p-4 md:p-5 bg-white/60 border border-[#1a1a1a]/5 hover:border-[#1a1a1a]/15 transition-all group hover:shadow-lg hover:-translate-y-1"
          >
            <h3 className="font-['Playfair_Display'] text-base md:text-lg text-[#1a1a1a] mb-2">
              {k.title}
            </h3>
            <p className="text-xs md:text-sm text-[#1a1a1a]/60 mb-4 leading-relaxed">
              {k.text}
            </p>
            <div className="flex flex-wrap gap-1">
              {k.keywords.map((kw, j) => (
                <span key={j} className="text-[9px] md:text-[10px] px-2 py-0.5 bg-[#1a1a1a]/5 text-[#1a1a1a]/40">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Geschichte & Vita Page
function GeschichtePage({ timeline }: { timeline: Array<{year: string; title: string; text: string}> }) {
  return (
    <div className="w-full h-full p-6 md:p-8 lg:p-10 flex flex-col overflow-hidden">
      <div className="mb-6">
        <span className="text-[10px] text-[#1a1a1a]/40 tracking-widest uppercase mb-2 block">10 / Geschichte</span>
        <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl lg:text-4xl font-medium text-[#1a1a1a]">
          Geschichte & Vita
        </h2>
      </div>

      {/* Timeline */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {timeline.map((t, i) => (
          <div 
            key={i}
            className="p-5 bg-white/60 border border-[#1a1a1a]/5 flex flex-col"
          >
            <span className="text-3xl md:text-4xl font-mono text-[#1a1a1a]/10 mb-3">
              {t.year}
            </span>
            <h4 className="font-['Playfair_Display'] text-lg text-[#1a1a1a] mb-2">
              {t.title}
            </h4>
            <p className="text-sm text-[#1a1a1a]/60 leading-relaxed">
              {t.text}
            </p>
          </div>
        ))}
      </div>

      {/* Key figures */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-4 bg-[#1a1f1a] text-[#f5f2ed] text-center">
          <span className="text-2xl md:text-3xl font-mono">21</span>
          <p className="text-xs text-[#f5f2ed]/50 mt-1">Wettbewerbe</p>
        </div>
        <div className="p-4 bg-[#1a1f1a] text-[#f5f2ed] text-center">
          <span className="text-2xl md:text-3xl font-mono">2</span>
          <p className="text-xs text-[#f5f2ed]/50 mt-1">Erste Preise</p>
        </div>
        <div className="p-4 bg-[#1a1f1a] text-[#f5f2ed] text-center">
          <span className="text-2xl md:text-3xl font-mono">20+</span>
          <p className="text-xs text-[#f5f2ed]/50 mt-1">Veröffentlichungen</p>
        </div>
        <div className="p-4 bg-[#1a1f1a] text-[#f5f2ed] text-center">
          <span className="text-2xl md:text-3xl font-mono">7+</span>
          <p className="text-xs text-[#f5f2ed]/50 mt-1">Länder</p>
        </div>
      </div>
    </div>
  );
}

// Publikationen Page
function PublikationenPage({ data }: { data: typeof publikationen }) {
  return (
    <div className="w-full h-full p-6 md:p-8 lg:p-10 flex flex-col overflow-hidden">
      <div className="mb-6">
        <span className="text-[10px] text-[#1a1a1a]/40 tracking-widest uppercase mb-2 block">11 / Veröffentlichungen</span>
        <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl lg:text-4xl font-medium text-[#1a1a1a]">
          Veröffentlichungen
        </h2>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.map((group, i) => (
          <div key={i} className="p-4 bg-white/60 border border-[#1a1a1a]/5">
            <h4 className="font-['Playfair_Display'] text-sm md:text-base text-[#1a1a1a] mb-3 pb-2 border-b border-[#1a1a1a]/10">
              {group.group}
            </h4>
            <ul className="space-y-2">
              {group.items.map((item, j) => (
                <li key={j} className="text-xs text-[#1a1a1a]/60 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-[#1a1f1a] text-[#f5f2ed] text-center">
        <p className="text-sm">Mehr als 20 Veröffentlichungen in Fachzeitschriften und Architekturpublikationen.</p>
      </div>
    </div>
  );
}

// Netzwerk Page
function NetzwerkPage({ data }: { data: typeof netzwerk }) {
  return (
    <div className="w-full h-full p-6 md:p-8 lg:p-10 flex flex-col overflow-hidden">
      <div className="mb-6">
        <span className="text-[10px] text-[#1a1a1a]/40 tracking-widest uppercase mb-2 block">12 / Netzwerk</span>
        <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl lg:text-4xl font-medium text-[#1a1a1a]">
          Netzwerk
        </h2>
        <p className="text-sm text-[#1a1a1a]/50 mt-2">
          Partner für Tragwerk, Technik und Brandschutz.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.map((n, i) => (
          <div 
            key={i}
            className="p-4 bg-white/60 border border-[#1a1a1a]/5 hover:border-[#1a1a1a]/15 transition-all group hover:shadow-lg"
          >
            <h4 className="font-['Playfair_Display'] text-sm md:text-base text-[#1a1a1a] mb-2">
              {n.category}
            </h4>
            <ul className="space-y-1">
              {n.names.map((name, j) => (
                <li key={j} className="text-xs text-[#1a1a1a]/50">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// Kontakt Page
function KontaktPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: '',
    location: '',
    phase: '',
    budget: '',
    message: '',
    privacyAccepted: false
  });

  const [formStatus, setFormStatus] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, privacyAccepted: e.target.checked }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim() || !formData.privacyAccepted) {
      setFormStatus('Bitte füllen Sie Name, E-Mail und Nachricht aus und bestätigen Sie die Datenverarbeitung.');
      return;
    }

    const subject = encodeURIComponent(`Projektanfrage von ${formData.name}`);
    const body = encodeURIComponent([
      `Name: ${formData.name}`,
      `E-Mail: ${formData.email}`,
      `Telefon: ${formData.phone || '-'}`,
      `Projekttyp: ${formData.projectType || '-'}`,
      `Ort: ${formData.location || '-'}`,
      `Leistungsphase / Anliegen: ${formData.phase || '-'}`,
      `Budgetrahmen: ${formData.budget || '-'}`,
      '',
      formData.message,
    ].join('\n'));

    window.location.href = `mailto:info@architekten-kauschke.de?subject=${subject}&body=${body}`;
    setFormStatus('Ihr E-Mail-Programm wurde geöffnet. Bitte prüfen und senden Sie die vorbereitete Anfrage.');
  };

  return (
    <div className="w-full h-full grid grid-cols-12 grid-rows-12 gap-3 p-6 md:p-8 lg:p-10 overflow-hidden">
      {/* Contact info */}
      <div className="col-span-12 md:col-span-5 row-span-8 p-6 flex flex-col justify-center bg-[#1a1f1a] text-[#f5f2ed]">
        <span className="text-[10px] text-[#f5f2ed]/40 tracking-widest uppercase mb-3">13 / Kontakt</span>
        <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-medium mb-6">
          Projekt besprechen
        </h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium">AKP Architekten Kauschke + Partner</p>
            <p className="text-[#f5f2ed]/60">Hohenzollerndamm 12</p>
            <p className="text-[#f5f2ed]/60">10717 Berlin-Wilmersdorf</p>
          </div>
          <div>
            <p className="text-[#f5f2ed]/60">Telefon: +49 (0)30 862 20-51</p>
            <p className="text-[#f5f2ed]/60">Telefax: +49 (0)30 862 20-60</p>
          </div>
          <div>
            <p className="text-[#f5f2ed]/60">E-Mail: info@architekten-kauschke.de</p>
            <p className="text-[#f5f2ed]/60">www.architekten-kauschke.de</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#f5f2ed]/10">
          <p className="text-xs text-[#f5f2ed]/40 mb-2">Anfragen zu:</p>
          <div className="flex flex-wrap gap-2">
            {['Grundstück prüfen', 'Sanierung anfragen', 'Generalplanung', 'Kooperation'].map(cta => (
              <span key={cta} className="text-[10px] px-3 py-1 bg-[#f5f2ed]/10 text-[#f5f2ed]/60">
                {cta}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Contact form */}
      <div className="col-span-12 md:col-span-7 row-span-11 p-5 overflow-y-auto"
        data-scrollable="true">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#1a1a1a]/50 block mb-1">Name *</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-[#1a1a1a]/10 bg-white/50 text-sm focus:border-[#1a1a1a]/30 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs text-[#1a1a1a]/50 block mb-1">E-Mail *</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-[#1a1a1a]/10 bg-white/50 text-sm focus:border-[#1a1a1a]/30 outline-none"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#1a1a1a]/50 block mb-1">Telefon</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2 border border-[#1a1a1a]/10 bg-white/50 text-sm focus:border-[#1a1a1a]/30 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#1a1a1a]/50 block mb-1">Projekttyp</label>
              <select 
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="w-full p-2 border border-[#1a1a1a]/10 bg-white/50 text-sm focus:border-[#1a1a1a]/30 outline-none"
              >
                <option value="">Bitte wählen</option>
                <option value="wohnen">Wohnungsbau</option>
                <option value="gesundheit">Gesundheitsbau</option>
                <option value="gewerbe">Gewerbe / Industrie</option>
                <option value="sanierung">Sanierung / Modernisierung</option>
                <option value="sonstiges">Sonstiges</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#1a1a1a]/50 block mb-1">Ort des Projekts</label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-2 border border-[#1a1a1a]/10 bg-white/50 text-sm focus:border-[#1a1a1a]/30 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#1a1a1a]/50 block mb-1">Leistungsphase / Anliegen</label>
              <select 
                name="phase"
                value={formData.phase}
                onChange={handleChange}
                className="w-full p-2 border border-[#1a1a1a]/10 bg-white/50 text-sm focus:border-[#1a1a1a]/30 outline-none"
              >
                <option value="">Bitte wählen</option>
                <option value="entwurf">Entwurf</option>
                <option value="generalplanung">Generalplanung</option>
                <option value="beratung">Beratung</option>
                <option value="wettbewerb">Wettbewerb</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#1a1a1a]/50 block mb-1">Budgetrahmen</label>
            <input 
              type="text" 
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full p-2 border border-[#1a1a1a]/10 bg-white/50 text-sm focus:border-[#1a1a1a]/30 outline-none placeholder:text-[#1a1a1a]/20"
            />
          </div>
          <div>
            <label className="text-xs text-[#1a1a1a]/50 block mb-1">Nachricht *</label>
            <textarea 
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full p-2 border border-[#1a1a1a]/10 bg-white/50 text-sm focus:border-[#1a1a1a]/30 outline-none resize-none"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-[#1a1a1a]/50">
            <input
              type="checkbox"
              name="privacyAccepted"
              checked={formData.privacyAccepted}
              onChange={handlePrivacyChange}
              className="h-4 w-4 accent-[#1a1f1a]"
              required
            />
            <span>Ich stimme der Datenverarbeitung zur Bearbeitung meiner Anfrage zu.</span>
          </label>
          {formStatus && (
            <p className="text-xs text-[#1a1a1a]/60" role="status">
              {formStatus}
            </p>
          )}
          <button 
            type="submit"
            className="w-full py-3 bg-[#1a1f1a] text-[#f5f2ed] text-sm tracking-wider uppercase hover:bg-[#2a2f2a] transition-colors"
          >
            Anfrage senden
          </button>
        </form>
      </div>

      {/* Bottom info */}
      <div className="col-span-12 row-span-3 flex items-center justify-center">
        <p className="text-[10px] text-[#1a1a1a]/30 tracking-wider">
          DATEI-UPLOAD OPTIONAL · DATENSCHUTZBESTÄTIGUNG PLATZHALTER
        </p>
      </div>
    </div>
  );
}

// Impressum Page
function ImpressumPage() {
  return (
    <div className="w-full h-full p-6 md:p-8 lg:p-10 flex flex-col overflow-hidden">
      <div className="mb-6">
        <span className="text-[10px] text-[#1a1a1a]/40 tracking-widest uppercase mb-2 block">14 / Impressum</span>
        <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-medium text-[#1a1a1a]">
          Impressum
        </h2>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <h3 className="font-['Playfair_Display'] text-lg text-[#1a1a1a] mb-3">Angaben gemäß § 5 TMG</h3>
            <div className="text-sm text-[#1a1a1a]/70 space-y-1">
              <p className="font-medium">Dipl.-Ing. Hans-Gerhard Kauschke</p>
              <p>AKP Architekten Kauschke + Partner</p>
              <p>Hohenzollerndamm 12</p>
              <p>10717 Berlin-Wilmersdorf</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#1a1a1a] mb-2">Kontakt</h4>
            <div className="text-sm text-[#1a1a1a]/70 space-y-1">
              <p>Telefon: +49 (0)30 862 20-51</p>
              <p>Telefax: +49 (0)30 862 20-60</p>
              <p>E-Mail: info@architekten-kauschke.de</p>
              <p>Internet: www.architekten-kauschke.de</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#1a1a1a] mb-2">Berufsrechtliche Angaben</h4>
            <div className="text-sm text-[#1a1a1a]/70 space-y-1">
              <p>Architektenkammer Berlin</p>
              <p>Registernummer: 06750</p>
              <p>Steuer-Nr.: 376/60776</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-[#1a1a1a] mb-2">Bild- und Designcredits</h4>
            <p className="text-sm text-[#1a1a1a]/70">
              Alle Bilder und Projektvisualisierungen: © AKP Architekten Kauschke + Partner, soweit nicht anders angegeben.
            </p>
          </div>

          {/* TODO: Impressum und Datenschutz rechtlich aktualisieren lassen */}
          <div className="p-4 bg-[#1a1a1a]/5 border border-[#1a1a1a]/10">
            <p className="text-xs text-[#1a1a1a]/40">
              Dieses Impressum dient der Information. Eine Haftung für die Vollständigkeit und Richtigkeit wird nicht übernommen. 
              {/* TODO: Impressum und Datenschutz rechtlich aktualisieren lassen. 
                  Der MDStV-Verweis ist laut SSOT rechtlich zu prüfen.
                  Nicht unkritisch als aktuellen Rechtsstand inszenieren. */}
            </p>
          </div>

          <div className="pt-4 border-t border-[#1a1a1a]/10">
            <p className="text-xs text-[#1a1a1a]/40">
              Design und Entwicklung: AKP Architekten Kauschke + Partner
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
