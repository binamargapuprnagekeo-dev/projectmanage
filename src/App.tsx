import React, { useState, useMemo } from 'react';
import { ProjectInfo, ScheduleItem, Category, UserRole, GoogleSheetsConfig } from './types/schedule';
import { sampleProjectPicu, sampleProjectCleanroom, emptyCleanProject } from './data/sampleProjects';
import {
  recalculateProject,
  calculateWeekSummaries,
  autoDistributeWeeklyPlan,
} from './utils/calculator';

import { Header } from './components/Header';
import { ProjectInfoBanner } from './components/ProjectInfoBanner';
import { SCurveChart } from './components/SCurveChart';
import { ScheduleGrid } from './components/ScheduleGrid';
import { WeeklyProgressInputModal } from './components/WeeklyProgressInputModal';
import { ItemEditorModal } from './components/ItemEditorModal';
import { ProjectEditorModal } from './components/ProjectEditorModal';
import { TerminCalculator } from './components/TerminCalculator';
import { AiAssistantModal } from './components/AiAssistantModal';
import { PrintReportView } from './components/PrintReportView';
import { CriticalPathAlertBanner } from './components/CriticalPathAlertBanner';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { ConsultantNoteModal } from './components/ConsultantNoteModal';
import { ChecklistModal } from './components/ChecklistModal';

export default function App() {
  const [project, setProject] = useState<ProjectInfo>(emptyCleanProject);
  const [userRole, setUserRole] = useState<UserRole>('kontraktor');
  const [activeTab, setActiveTab] = useState<'schedule' | 'termin' | 'chart'>('schedule');
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [showOnlyCritical, setShowOnlyCritical] = useState<boolean>(false);

  // Modals state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string | undefined>(undefined);

  const [isInputProgressOpen, setIsInputProgressOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isProjectEditOpen, setIsProjectEditOpen] = useState(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);
  const [isConsultantNotesOpen, setIsConsultantNotesOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  // Recalculate project totals & weight percentages on every change
  const updatedProject = useMemo(() => {
    return recalculateProject(project);
  }, [project]);

  // Compute week-by-week planned & actual summaries
  const weekSummaries = useMemo(() => {
    return calculateWeekSummaries(updatedProject);
  }, [updatedProject]);

  // Compute grand total cost
  const grandTotalCost = useMemo(() => {
    return updatedProject.categories.reduce((catSum, cat) => {
      return catSum + cat.items.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
    }, 0);
  }, [updatedProject]);

  // Preset switch
  const handleSelectPreset = (presetKey: string) => {
    if (presetKey === 'empty-clean' || presetKey === 'new') {
      setProject({
        ...emptyCleanProject,
        id: `project-${Date.now()}`,
      });
    } else if (presetKey === 'picu-2026') {
      setProject(sampleProjectPicu);
    } else if (presetKey === 'cleanroom-2026') {
      setProject(sampleProjectCleanroom);
    }
  };

  // Item save
  const handleSaveItem = (savedItem: ScheduleItem) => {
    setProject((prev) => {
      const categoriesCopy = prev.categories.map((cat) => {
        const itemExists = cat.items.some((i) => i.id === savedItem.id);
        if (itemExists) {
          // Update existing item
          return {
            ...cat,
            items: cat.items.map((i) => (i.id === savedItem.id ? savedItem : i)),
          };
        } else if (cat.id === savedItem.categoryId) {
          // Append to target category
          return {
            ...cat,
            items: [...cat.items, savedItem],
          };
        }
        return cat;
      });

      return {
        ...prev,
        categories: categoriesCopy,
      };
    });
  };

  // Item delete
  const handleDeleteItem = (itemId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus item pekerjaan ini?')) return;
    setProject((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) => ({
        ...cat,
        items: cat.items.filter((i) => i.id !== itemId),
      })),
    }));
  };

  // Add item to category
  const handleAddItemToCategory = (categoryId: string) => {
    setEditingItem(null);
    setTargetCategoryId(categoryId);
    setIsAddItemOpen(true);
  };

  // Auto distribute trigger
  const handleAutoDistributeItem = (item: ScheduleItem) => {
    setEditingItem(item);
    setIsAddItemOpen(true);
  };

  // Single cell edit
  const handleUpdateWeeklyCell = (
    itemId: string,
    weekNum: number,
    planVal: number,
    actualVal?: number
  ) => {
    setProject((prev) => {
      const categoriesCopy = prev.categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => {
          if (item.id === itemId) {
            const updatedWeeklyPlan = { ...item.weeklyPlan, [weekNum]: planVal };
            const updatedWeeklyActual = { ...item.weeklyActual };
            if (actualVal !== undefined) {
              updatedWeeklyActual[weekNum] = actualVal;
            }
            return {
              ...item,
              weeklyPlan: updatedWeeklyPlan,
              weeklyActual: updatedWeeklyActual,
            };
          }
          return item;
        }),
      }));
      return { ...prev, categories: categoriesCopy };
    });
  };

  // Save consultant field notes
  const handleSaveConsultantNote = (
    itemId: string,
    note: string,
    isApproved: boolean
  ) => {
    setProject((prev) => {
      const categoriesCopy = prev.categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              consultantNote: note,
              isApprovedByConsultant: isApproved,
            };
          }
          return item;
        }),
      }));
      return { ...prev, categories: categoriesCopy };
    });
  };

  // Save weekly progress batch
  const handleSaveProgress = (
    weekNum: number,
    progressUpdates: Record<string, number>
  ) => {
    setProject((prev) => {
      const categoriesCopy = prev.categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => {
          if (progressUpdates[item.id] !== undefined) {
            return {
              ...item,
              weeklyActual: {
                ...item.weeklyActual,
                [weekNum]: progressUpdates[item.id],
              },
            };
          }
          return item;
        }),
      }));
      return { ...prev, currentWeek: weekNum, categories: categoriesCopy };
    });
  };

  // Save project info
  const handleSaveProjectInfo = (infoUpdates: Partial<ProjectInfo>) => {
    setProject((prev) => ({
      ...prev,
      ...infoUpdates,
    }));
  };

  // Update Google Sheets Config
  const handleUpdateGoogleSheetsConfig = (config: GoogleSheetsConfig) => {
    setProject((prev) => ({
      ...prev,
      sheetsConfig: config,
    }));
  };

  // Export CSV
  const handleExportExcel = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `NO,URAIAN PEKERJAAN,SATUAN,VOLUME,HARGA SATUAN,TOTAL HARGA,BOBOT %\n`;

    updatedProject.categories.forEach((cat) => {
      csvContent += `"${cat.code}","${cat.name.replace(/"/g, '""')}",,,,\n`;
      cat.items.forEach((item) => {
        csvContent += `"${item.itemNo}","${item.description.replace(/"/g, '""')}","${item.unit}",${item.volume},${item.unitPrice},${item.totalPrice},${item.weightPercent.toFixed(2)}\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${updatedProject.title.toLowerCase().replace(/\s+/g, '_')}_jadwal.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(updatedProject, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${updatedProject.title.toLowerCase().replace(/\s+/g, '_')}_data.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (importedData && importedData.title && importedData.categories) {
          setProject(recalculateProject(importedData));
          alert('Data proyek berhasil diimpor!');
        } else {
          alert('Format file JSON tidak sesuai standar proyek.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Import AI Generated Project
  const handleImportGeneratedProject = (generatedJson: any) => {
    if (!generatedJson || !generatedJson.categories) return;

    const formattedCategories: Category[] = generatedJson.categories.map(
      (cat: any, cIdx: number) => ({
        id: `c-ai-${cIdx}`,
        code: cat.code || `CAT-${cIdx + 1}`,
        name: cat.name || 'PEKERJAAN',
        items: (cat.items || []).map((item: any, iIdx: number) => {
          const vol = item.volume || 1;
          const price = item.unitPrice || 100000;
          const startW = item.startWeek || 1;
          const endW = item.endWeek || 4;

          const distributedPlan = autoDistributeWeeklyPlan(
            10, // dummy weight, will be recalculated
            startW,
            endW,
            'equal'
          );

          return {
            id: `item-ai-${cIdx}-${iIdx}`,
            categoryId: `c-ai-${cIdx}`,
            itemNo: item.itemNo || `${iIdx + 1}`,
            description: item.description || 'Pekerjaan',
            unit: item.unit || 'm²',
            volume: vol,
            unitPrice: price,
            totalPrice: vol * price,
            weightPercent: 0,
            startWeek: startW,
            endWeek: endW,
            weeklyPlan: distributedPlan,
            weeklyActual: {},
          };
        }),
      })
    );

    const newProjectInfo: ProjectInfo = {
      id: `ai-proj-${Date.now()}`,
      title: generatedJson.title || 'PROYEK AI GENERATED',
      location: generatedJson.location || 'Kab. Nagekeo',
      agency: 'Pengguna Jasa',
      fiscalYear: '2026',
      durationDays: generatedJson.durationDays || 120,
      durationMonths: generatedJson.durationMonths || 4,
      weeksPerMonth: 4,
      totalWeeks: generatedJson.totalWeeks || 16,
      bidderName: 'CV. KONTRAKTOR UTAMA',
      directorName: 'DIREKTUR PROYEK',
      directorTitle: 'Kuasa Direktur',
      cityDate: 'Mbay, 01 Juli 2026',
      currentWeek: 1,
      categories: formattedCategories,
    };

    setProject(recalculateProject(newProjectInfo));
  };

  // If print view is triggered
  if (isPrintMode) {
    return (
      <PrintReportView
        project={updatedProject}
        weekSummaries={weekSummaries}
        grandTotalCost={grandTotalCost}
        onBack={() => setIsPrintMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans antialiased selection:bg-[#C8FF00] selection:text-black flex flex-col pb-12">
      {/* Header Bar */}
      <Header
        project={updatedProject}
        role={userRole}
        onRoleChange={setUserRole}
        onSelectPreset={handleSelectPreset}
        onOpenAddItem={() => {
          setEditingItem(null);
          setTargetCategoryId(undefined);
          setIsAddItemOpen(true);
        }}
        onOpenInputProgress={() => setIsInputProgressOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onOpenProjectEdit={() => setIsProjectEditOpen(true)}
        onOpenGoogleSheetsModal={() => setIsGoogleSheetsOpen(true)}
        onOpenConsultantModal={() => setIsConsultantNotesOpen(true)}
        onOpenChecklistModal={() => setIsChecklistOpen(true)}
        onExportExcel={handleExportExcel}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onTogglePrintMode={() => setIsPrintMode(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Project Banner & Status */}
      <ProjectInfoBanner
        project={updatedProject}
        weekSummaries={weekSummaries}
        onOpenProjectEdit={() => setIsProjectEditOpen(true)}
        grandTotalCost={grandTotalCost}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 space-y-6">
        {/* Critical Path & Early Warning System */}
        <CriticalPathAlertBanner
          project={updatedProject}
          weekSummaries={weekSummaries}
          onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
          showOnlyCritical={showOnlyCritical}
          onToggleShowOnlyCritical={() => setShowOnlyCritical(!showOnlyCritical)}
        />

        {/* Tab 1: Combined Schedule Grid & Chart */}
        {activeTab === 'schedule' && (
          <>
            {/* Interactive S-Curve Chart */}
            <SCurveChart
              weekSummaries={weekSummaries}
              currentWeek={updatedProject.currentWeek}
            />

            {/* Matrix Schedule Table */}
            <ScheduleGrid
              project={updatedProject}
              role={userRole}
              weekSummaries={weekSummaries}
              showOnlyCritical={showOnlyCritical}
              onEditItem={(item) => {
                setEditingItem(item);
                setIsAddItemOpen(true);
              }}
              onDeleteItem={handleDeleteItem}
              onAddItemToCategory={handleAddItemToCategory}
              onAutoDistributeItem={handleAutoDistributeItem}
              onUpdateWeeklyCell={handleUpdateWeeklyCell}
              grandTotalCost={grandTotalCost}
            />
          </>
        )}

        {/* Tab 2: Standalone S-Curve Chart Focus */}
        {activeTab === 'chart' && (
          <div className="space-y-6">
            <SCurveChart
              weekSummaries={weekSummaries}
              currentWeek={updatedProject.currentWeek}
            />
          </div>
        )}

        {/* Tab 3: Financial Payment Projections (Termin) */}
        {activeTab === 'termin' && (
          <TerminCalculator
            project={updatedProject}
            weekSummaries={weekSummaries}
            grandTotalCost={grandTotalCost}
          />
        )}
      </main>

      {/* Interactive Modals */}
      <WeeklyProgressInputModal
        isOpen={isInputProgressOpen}
        onClose={() => setIsInputProgressOpen(false)}
        project={updatedProject}
        onSaveProgress={handleSaveProgress}
      />

      <ItemEditorModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        item={editingItem}
        categories={updatedProject.categories}
        targetCategoryId={targetCategoryId}
        project={updatedProject}
        onSaveItem={handleSaveItem}
      />

      <ProjectEditorModal
        isOpen={isProjectEditOpen}
        onClose={() => setIsProjectEditOpen(false)}
        project={updatedProject}
        onSaveProjectInfo={handleSaveProjectInfo}
      />

      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        project={updatedProject}
        onImportGeneratedProject={handleImportGeneratedProject}
      />

      {isGoogleSheetsOpen && (
        <GoogleSheetsSyncModal
          project={updatedProject}
          onProjectUpdated={(updated) => setProject(recalculateProject(updated))}
          onClose={() => setIsGoogleSheetsOpen(false)}
        />
      )}

      {isConsultantNotesOpen && (
        <ConsultantNoteModal
          project={updatedProject}
          role={userRole}
          onProjectUpdated={(updated) => setProject(recalculateProject(updated))}
          onClose={() => setIsConsultantNotesOpen(false)}
        />
      )}

      {isChecklistOpen && (
        <ChecklistModal
          project={updatedProject}
          role={userRole}
          onProjectUpdated={(updated) => setProject(recalculateProject(updated))}
          onClose={() => setIsChecklistOpen(false)}
        />
      )}
    </div>
  );
}

