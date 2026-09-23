import React, { useState, useRef, useEffect } from 'react';
import { INSTRUMENTS } from '../config/instruments';
import type { Instrument, InstrumentCategory } from '../types';
import { useTuner } from '../context/TunerContext';
import { Disc, Music, Check, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';

interface InstrumentsViewProps {
  onInstrumentSelected: () => void;
}

export const InstrumentsView: React.FC<InstrumentsViewProps> = ({ onInstrumentSelected }) => {
  const { currentInstrument, activeTuning, selectInstrument, selectTuning } = useTuner();
  const [selectedCategory, setSelectedCategory] = useState<InstrumentCategory>('all');

  // Mouse wheel & drag-to-scroll controls
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  // Non-passive wheel event listener that strictly blocks parent page vertical scroll
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      el.scrollLeft += e.deltaY * 0.9;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  const categories: { id: InstrumentCategory; label: string }[] = [
    { id: 'all', label: 'Все инструменты' },
    { id: 'guitars', label: 'Гитары' },
    { id: 'bass', label: 'Бас-гитары' },
    { id: 'folk', label: 'Укулеле и фолк' },
    { id: 'strings', label: 'Смычковые' },
  ];

  const filteredInstruments = INSTRUMENTS.filter((inst) => {
    if (selectedCategory === 'all') return true;
    return inst.category === selectedCategory;
  });

  const handleSelect = (inst: Instrument) => {
    if (inst.isStub) {
      alert(`Инструмент «${inst.name}»:\n${inst.stubMessage || 'Скоро появится!'}`);
      return;
    }
    selectInstrument(inst.id);
    onInstrumentSelected();
  };

  // Mouse drag-to-scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tabsRef.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.pageX - tabsRef.current.offsetLeft);
    setScrollLeftState(tabsRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tabsRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabsRef.current.offsetLeft;
    const walk = (x - startX) * 1.4;
    if (Math.abs(walk) > 4) {
      setHasDragged(true);
    }
    tabsRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const amount = direction === 'left' ? -160 : 160;
      tabsRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="view-content instruments-view">
      <h2 className="section-header-title">Инструменты</h2>
      <p className="section-header-desc">
        Выберите инструмент для настройки. Вся система строев адаптируется автоматически.
      </p>

      {/* Horizontal Tabs with mouse wheel & drag support */}
      <div className="horizontal-tabs-wrapper">
        <button
          className="tabs-nav-arrow left"
          onClick={() => scrollTabs('left')}
          title="Прокрутить назад"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={tabsRef}
          className={`horizontal-tabs-container ${isDragging ? 'is-dragging' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`tab-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                if (!hasDragged) {
                  setSelectedCategory(cat.id);
                }
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          className="tabs-nav-arrow right"
          onClick={() => scrollTabs('right')}
          title="Прокрутить вперед"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Cards List */}
      <div className="instruments-grid">
        {filteredInstruments.map((inst) => {
          const isSelected = currentInstrument.id === inst.id;
          return (
            <div
              key={inst.id}
              className={`glass-card instrument-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelect(inst)}
            >
              <div className="card-top-row">
                <div className="card-instrument-info">
                  <div className="card-icon-box">
                    {inst.category === 'folk' ? (
                      <Music size={22} />
                    ) : inst.isStub ? (
                      <Sparkles size={22} />
                    ) : (
                      <Disc size={22} />
                    )}
                  </div>
                  <div className="card-text-col">
                    <h3 className="card-title">{inst.name}</h3>
                    <span className="card-desc">{inst.description}</span>
                  </div>
                </div>

                <div className="card-badge-wrap">
                  {inst.isStub ? (
                    <span className="badge-tag badge-stub">Скоро</span>
                  ) : isSelected ? (
                    <span className="badge-tag badge-active">
                      <Check size={13} strokeWidth={2.5} />
                      <span>Активен</span>
                    </span>
                  ) : (
                    <ChevronRight size={18} color="var(--text-tertiary)" />
                  )}
                </div>
              </div>

              {/* Tunings options for non-stub instrument */}
              {!inst.isStub && inst.tunings.length > 0 && (
                <div
                  className="tunings-chips-row"
                  onClick={(e) => e.stopPropagation()} // Prevent card click
                >
                  {inst.tunings.map((tuning) => {
                    const isTuningActive = isSelected && activeTuning.id === tuning.id;
                    return (
                      <button
                        key={tuning.id}
                        className={`chip-btn ${isTuningActive ? 'active' : ''}`}
                        onClick={() => {
                          selectInstrument(inst.id);
                          selectTuning(tuning.id);
                        }}
                      >
                        {tuning.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
