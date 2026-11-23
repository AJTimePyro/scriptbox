import { useState, useRef, useEffect, useId, useMemo } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import type { LanguageDefinition } from "../config/languages";
import { SEARCH_THRESHOLD } from "../config/languages";
import type { RuntimeState } from "../types";
import { formatDuration, formatTransfer } from "../utils/timing";
import { RuntimeDot } from "./RuntimeDot";

export type LanguageStateMap = Record<
  string,
  {
    state: RuntimeState;
    loadMs: number | null;
    transferBytes: number | null;
    isFromCache?: boolean;
  }
>;

type Props = {
  languages: LanguageDefinition[];
  selectedId: string;
  runtimeStates: LanguageStateMap;
  onSelect: (id: string) => void;
  isMobile?: boolean;
};

export function GlyphBadge({ glyph }: { glyph: string }) {
  return (
    <span
      className="inline-flex h-[18px] min-w-[22px] px-1 items-center justify-center shrink-0 whitespace-nowrap rounded-xs border border-border-subtle bg-base font-mono text-[10px] leading-none tracking-[-0.02em] font-medium text-text-muted select-none"
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}

export function LanguageSelect({
  languages,
  selectedId,
  runtimeStates,
  onSelect,
  isMobile = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selectedLang = useMemo(
    () => languages.find((l) => l.id === selectedId) || languages[0],
    [languages, selectedId],
  );

  const selectedState = runtimeStates[selectedLang.id]?.state ?? "unloaded";

  const showSearch = languages.length > SEARCH_THRESHOLD;
  const showGrouping = languages.length > SEARCH_THRESHOLD;

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return languages;
    return languages.filter((lang) => {
      if (lang.name.toLowerCase().includes(q)) return true;
      if (lang.extension.toLowerCase().includes(q)) return true;
      if (lang.id.toLowerCase().includes(q)) return true;
      if (lang.aliases.some((alias) => alias.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [languages, searchQuery]);

  const groupedLanguages = useMemo(() => {
    if (!showGrouping) {
      return [{ category: null, items: filteredLanguages }];
    }
    const interpreted = filteredLanguages.filter((l) => l.category === "Interpreted");
    const compiled = filteredLanguages.filter((l) => l.category === "Compiled");
    const groups: { category: string | null; items: LanguageDefinition[] }[] = [];
    if (interpreted.length > 0) {
      groups.push({ category: "Interpreted", items: interpreted });
    }
    if (compiled.length > 0) {
      groups.push({ category: "Compiled", items: compiled });
    }
    return groups;
  }, [filteredLanguages, showGrouping]);

  const flatItems = useMemo(
    () => groupedLanguages.flatMap((g) => g.items),
    [groupedLanguages],
  );

  // Reset on open only; clearing the query on filter changes would wipe the user's typing.
  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }
    setSearchQuery("");
    const idx = languages.findIndex((l) => l.id === selectedId);
    setActiveIndex(idx >= 0 ? idx : 0);
    if (showSearch) {
      const timer = window.setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, languages, selectedId, showSearch]);

  // Clamp the highlight when filtering removes rows.
  useEffect(() => {
    setActiveIndex((prev) => (prev > flatItems.length - 1 ? flatItems.length - 1 : prev));
  }, [flatItems.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectLanguage = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        setActiveIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
        break;
      }
      case "Home": {
        e.preventDefault();
        setActiveIndex(0);
        break;
      }
      case "End": {
        e.preventDefault();
        setActiveIndex(flatItems.length - 1);
        break;
      }
      case "Enter": {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < flatItems.length) {
          selectLanguage(flatItems[activeIndex].id);
        }
        break;
      }
      case "Tab": {
        setIsOpen(false);
        break;
      }
    }
  };

  const activeOptionId =
    activeIndex >= 0 && flatItems[activeIndex]
      ? `${listboxId}-option-${flatItems[activeIndex].id}`
      : undefined;

  return (
    <div className="relative inline-block font-mono" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-label={`Select language: current is ${selectedLang.name}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-8 sm:h-8 max-sm:h-10 items-center gap-2 rounded border border-border bg-surface px-2.5 font-mono text-xs text-text transition-colors duration-150 hover:border-border hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent select-none"
      >
        <GlyphBadge glyph={selectedLang.glyph} />

        <span className="font-sans font-medium text-text">{selectedLang.name}</span>

        <RuntimeDot state={selectedState} labelled />

        <ChevronsUpDown size={14} className="text-text-muted shrink-0 ml-0.5" strokeWidth={1.5} />
      </button>

      {isOpen && (
        <>
          {isMobile && (
            <div
              className="fixed inset-0 z-40 bg-base/80 backdrop-blur-xs transition-opacity"
              aria-hidden="true"
              onClick={() => setIsOpen(false)}
            />
          )}

          <div
            ref={popoverRef}
            id={listboxId}
            role="listbox"
            aria-label="Available languages"
            className={
              isMobile
                ? "fixed inset-x-0 bottom-0 z-50 flex max-h-[75dvh] flex-col rounded-t-lg border-t border-border bg-elevated shadow-2xl overflow-hidden"
                : "absolute left-0 top-full mt-1.5 z-40 flex w-[340px] sm:w-[350px] max-w-[calc(100vw-24px)] max-h-[60dvh] flex-col rounded-md border border-border bg-elevated shadow-xl overflow-hidden"
            }
          >
            {isMobile && (
              <div className="flex h-11 shrink-0 items-center justify-between border-b border-border-subtle px-4">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-faint">
                  Select Language
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close language selector"
                  className="rounded p-1 text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
            )}

            {showSearch && (
              <div className="shrink-0 border-b border-border-subtle p-2">
                <div className="flex items-center gap-2 rounded border border-border-subtle bg-surface px-2.5 py-1.5 text-xs">
                  <Search size={14} className="text-text-faint shrink-0" strokeWidth={1.5} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search languages..."
                    aria-label="Search languages"
                    className="w-full bg-transparent font-mono text-xs text-text placeholder:text-text-faint focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="text-text-faint hover:text-text"
                    >
                      <X size={13} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-1 font-mono [scrollbar-width:thin]">
              {flatItems.length === 0 ? (
                <div className="p-4 text-center font-mono text-xs text-text-faint">
                  no language matches
                </div>
              ) : (
                groupedLanguages.map((group, groupIdx) => (
                  <div key={groupIdx} className="mb-1 last:mb-0">
                    {group.category && (
                      <div className="px-2.5 py-1 text-[11px] font-mono font-medium uppercase tracking-wider text-text-faint select-none">
                        {group.category}
                      </div>
                    )}

                    {group.items.map((lang) => {
                      const isSelected = lang.id === selectedId;
                      const itemIndex = flatItems.findIndex((l) => l.id === lang.id);
                      const isFocused = itemIndex === activeIndex;
                      const runtimeInfo = runtimeStates[lang.id];
                      const langState = runtimeInfo?.state ?? "unloaded";
                      const loadMs = runtimeInfo?.loadMs ?? null;
                      const transferBytes = runtimeInfo?.transferBytes ?? null;
                      const isFromCache = runtimeInfo?.isFromCache ?? false;

                      const formattedSize = formatTransfer(transferBytes, isFromCache);

                      let rowDescription = `${lang.engine.name}${lang.engine.version ? ` ${lang.engine.version}` : ""}`;
                      if (langState === "ready" && loadMs !== null) {
                        rowDescription = `loaded ${formatDuration(loadMs)}${formattedSize ? ` · ${formattedSize}` : ""}`;
                      } else if (langState === "loading") {
                        rowDescription = "loading…";
                      } else if (langState === "failed") {
                        rowDescription = "failed";
                      }

                      const stateTitle =
                        langState === "ready" && loadMs !== null
                          ? `${lang.engine.name}${lang.engine.version ? ` ${lang.engine.version}` : ""} · Loaded in ${formatDuration(loadMs)}${formattedSize ? ` (${formattedSize})` : ""}`
                          : langState === "loading"
                          ? "Runtime loading…"
                          : langState === "failed"
                          ? "Runtime failed to load"
                          : `${lang.engine.name}${lang.engine.version ? ` ${lang.engine.version}` : ""} (not loaded)`;

                      return (
                        <div
                          key={lang.id}
                          id={`${listboxId}-option-${lang.id}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => selectLanguage(lang.id)}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          className={`flex h-9 sm:h-9 max-sm:h-11 cursor-pointer items-center justify-between rounded px-2.5 text-xs transition-colors duration-100 select-none ${
                            isSelected
                              ? "bg-surface text-text"
                              : isFocused
                              ? "bg-surface/70 text-text"
                              : "text-text-muted hover:bg-surface/50 hover:text-text"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 shrink-0">
                            <GlyphBadge glyph={lang.glyph} />
                            <span className="font-sans font-medium text-text whitespace-nowrap">
                              {lang.name}
                            </span>
                            <span className="font-mono text-[11px] text-text-faint whitespace-nowrap">
                              .{lang.extension}
                            </span>
                          </div>

                          <div
                            className="flex items-center gap-2 min-w-0 ml-3 font-mono justify-end"
                            title={stateTitle}
                          >
                            <span className="text-[11px] text-text-muted truncate whitespace-nowrap">
                              {rowDescription}
                            </span>

                            <RuntimeDot state={langState} labelled />

                            {/* Fixed width keeps rows from shifting when selection changes */}
                            <div className="w-4 flex items-center justify-center shrink-0">
                              {isSelected ? (
                                <Check size={14} className="text-accent" strokeWidth={2} />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
