import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { useWorkspace } from "@/features/workspace/context/WorkspaceContext";

export const WorkspaceSelector: React.FC = () => {
  const { workspace, workspaces, setWorkspace, addWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newSemester, setNewSemester] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSemester.trim()) {
      addWorkspace(newSemester.trim());
      setNewSemester("");
      setIsAdding(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-3 bg-[#F7F7F4] hover:bg-[#EFEFEA] transition-colors rounded-lg flex flex-col gap-0.5 text-left cursor-pointer border border-transparent focus:outline-none focus:border-[#5553B7]"
      >
        <span className="text-[11px] font-semibold text-[#747683] tracking-wider uppercase">
          YOUR WORKSPACE
        </span>
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-semibold text-[#252735] truncate">{workspace}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#747683] transition-transform ${
              isOpen ? "rotate-180 text-[#5553B7]" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] w-full bg-white border border-[#E5E6EB] rounded-xl shadow-lg p-1.5 z-50 flex flex-col gap-1">
          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
            {workspaces.map((ws) => {
              const isSelected = ws === workspace;
              return (
                <button
                  key={ws}
                  type="button"
                  onClick={() => {
                    setWorkspace(ws);
                    setIsOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between text-left cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#EFEEF9] text-[#5553B7]"
                      : "text-[#252735] hover:bg-[#F7F7F4]"
                  }`}
                >
                  <span className="truncate">{ws}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#5553B7] flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 mt-1 border-t border-[#F0F1F5]">
            {isAdding ? (
              <form onSubmit={handleAddSubmit} className="flex flex-col gap-1.5 p-1">
                <input
                  type="text"
                  placeholder="e.g. Spring 2027"
                  autoFocus
                  value={newSemester}
                  onChange={(e) => setNewSemester(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-[#E5E6EB] rounded-md focus:outline-none focus:border-[#5553B7]"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-2 py-0.5 text-[11px] text-[#747683] hover:text-[#252735]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-0.5 text-[11px] bg-[#5553B7] text-white rounded font-medium hover:bg-[#48469F]"
                  >
                    Add
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="w-full px-2 py-1.5 text-xs text-[#5553B7] hover:bg-[#EFEEF9] rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add semester...</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
