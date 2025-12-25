import React, { useState } from 'react';
import { UploadedFile, ExamData, GenerationConfig } from './types';
import FileUpload from './components/FileUpload';
import ExamPreview from './components/ExamPreview';
import ExamList from './components/ExamList';
import { generateExamPaper } from './services/geminiService';

type ViewMode = 'upload' | 'preview' | 'list';

const App: React.FC = () => {
  // State
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [config] = useState<GenerationConfig>({ includeAnswers: true });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Exam Management State
  const [exams, setExams] = useState<ExamData[]>([]);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('upload');

  const activeExam = exams.find(e => e.id === activeExamId) || null;

  // Handlers
  const handleFilesAdded = (newFiles: UploadedFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleGenerate = async () => {
    if (files.length === 0) {
      setError("请先上传参考试卷文件。");
      return;
    }
    setError(null);
    setIsGenerating(true);
    
    try {
      const newExam = await generateExamPaper(files, config);
      
      // Add management metadata
      const examWithMeta: ExamData = {
        ...newExam,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: Date.now()
      };

      setExams(prev => [examWithMeta, ...prev]);
      setActiveExamId(examWithMeta.id!);
      setView('preview');
      setFiles([]); // Clear files after successful generation
    } catch (err) {
      setError("生成试卷时出错，请重试。" + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsGenerating(false);
    }
  };

  const navigateToUpload = () => {
    setView('upload');
    setFiles([]); // Optional: clear files when starting over
    setError(null);
  };

  const navigateToList = () => {
    setView('list');
    setError(null);
  };

  const handleViewExam = (exam: ExamData) => {
    if (exam.id) {
      setActiveExamId(exam.id);
      setView('preview');
    }
  };

  const handleDeleteExam = (id: string) => {
    if (confirm('确定要删除这份试卷吗？')) {
      setExams(prev => prev.filter(e => e.id !== id));
      if (activeExamId === id) {
        setActiveExamId(null);
        setView('list'); // Go back to list if we deleted the active one
      }
    }
  };

  const getFileIcon = (type: UploadedFile['type']) => {
    if (type === 'image') return 'fa-image';
    if (type === 'pdf') return 'fa-file-pdf';
    return 'fa-file-lines';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-md no-print sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={navigateToUpload}
            title="回到首页"
          >
            <i className="fa-solid fa-graduation-cap text-2xl"></i>
            <h1 className="text-xl font-bold tracking-wide hidden sm:block">AI 智能试卷生成器</h1>
          </div>
          
          <nav className="flex gap-2">
            <button 
              onClick={navigateToUpload} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'upload' ? 'bg-indigo-800 text-white' : 'hover:bg-indigo-600 text-indigo-100'}`}
            >
              <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
              生成试卷
            </button>
            <button 
              onClick={navigateToList} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'list' ? 'bg-indigo-800 text-white' : 'hover:bg-indigo-600 text-indigo-100'}`}
            >
              <i className="fa-solid fa-folder-open mr-2"></i>
              试卷管理
              {exams.length > 0 && (
                <span className="ml-2 bg-indigo-500 text-xs px-2 py-0.5 rounded-full">{exams.length}</span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex items-start gap-3 no-print">
             <i className="fa-solid fa-circle-exclamation text-red-500 mt-1"></i>
             <div>
               <h3 className="text-red-800 font-medium">出错了</h3>
               <p className="text-red-700 text-sm">{error}</p>
             </div>
          </div>
        )}

        {/* View: Upload / Home */}
        {view === 'upload' && (
          <div className="flex flex-col lg:flex-row gap-6 animate-fade-in items-start min-h-[500px]">
            {/* Left Column: Upload / Sidebar - Fixed width 320px */}
            <div className="w-full lg:w-[320px] shrink-0 space-y-4 flex flex-col">
              <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col">
                <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                  上传参考试卷
                </h2>
                <FileUpload onFilesAdded={handleFilesAdded} />
                
                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-4 flex-1 flex flex-col">
                     <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                       <ul className="space-y-2 mb-4">
                        {files.map(file => (
                          <li key={file.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 text-xs group">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <i className={`fa-regular ${getFileIcon(file.type)} text-slate-400`}></i>
                              <span className="truncate w-[160px]">{file.name}</span>
                            </div>
                            <button onClick={() => removeFile(file.id)} className="text-slate-400 hover:text-red-500 p-1">
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button 
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full py-2.5 rounded-lg font-semibold text-white shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-sm mt-auto"
                    >
                      {isGenerating ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin"></i>
                          生成中...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-wand-magic-sparkles"></i>
                          生成试卷
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {files.length === 0 && (
                  <div className="mt-4 text-xs text-slate-400 bg-slate-50 p-3 rounded border border-slate-100 border-dashed">
                    <p>请上传 1-3 份参考试卷，AI 将自动分析其题型分布、难度系数和知识点，为您生成一份风格一致的全新试卷。</p>
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Hero / Instructions - Takes remaining space */}
            <div className="flex-1 w-full flex flex-col justify-center items-center text-center p-8 bg-white rounded-xl border border-slate-100 shadow-sm opacity-90 h-full min-h-[500px]">
              <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative">
                 <div className="absolute inset-0 rounded-full border-4 border-dashed border-indigo-200 animate-[spin_10s_linear_infinite]"></div>
                 <i className="fa-solid fa-robot text-5xl text-indigo-300"></i>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">一键生成同款试卷</h2>
              <p className="text-slate-500 max-w-md text-sm mb-8">
                只需要上传 PDF 或图片，AI 就会自动模仿原卷的结构、题型和难度，为您生成一份全新的练习试卷。
              </p>
              
              <div className="grid grid-cols-3 gap-8 w-full max-w-lg">
                <div className="text-center group">
                  <div className="w-10 h-10 mx-auto bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-2 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <i className="fa-solid fa-file-pdf text-lg"></i>
                  </div>
                  <h4 className="font-bold text-sm text-slate-700">1. 上传试卷</h4>
                  <p className="text-xs text-slate-400 mt-1">支持 PDF/图片</p>
                </div>
                 <div className="text-center group">
                  <div className="w-10 h-10 mx-auto bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mb-2 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <i className="fa-solid fa-microchip text-lg"></i>
                  </div>
                  <h4 className="font-bold text-sm text-slate-700">2. AI 仿写</h4>
                  <p className="text-xs text-slate-400 mt-1">智能复刻结构</p>
                </div>
                 <div className="text-center group">
                  <div className="w-10 h-10 mx-auto bg-green-50 text-green-500 rounded-xl flex items-center justify-center mb-2 group-hover:bg-green-500 group-hover:text-white transition-colors">
                    <i className="fa-solid fa-download text-lg"></i>
                  </div>
                  <h4 className="font-bold text-sm text-slate-700">3. 打印下载</h4>
                  <p className="text-xs text-slate-400 mt-1">导出 PDF</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View: Exam List (Content Management) */}
        {view === 'list' && (
          <div className="animate-fade-in">
             <ExamList 
               exams={exams} 
               onView={handleViewExam} 
               onDelete={handleDeleteExam}
               onCreateNew={navigateToUpload}
             />
          </div>
        )}

        {/* View: Preview */}
        {view === 'preview' && activeExam && (
          <div className="animate-fade-in">
             <div className="mb-4 flex items-center justify-between no-print">
               <button onClick={navigateToList} className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium transition-colors">
                 <i className="fa-solid fa-arrow-left"></i> 返回试卷列表
               </button>
               
               <button 
                 onClick={navigateToUpload}
                 className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
               >
                 <i className="fa-solid fa-rotate-right"></i>
                 再次生成新试卷
               </button>
             </div>
             
             <ExamPreview exam={activeExam} showAnswersInit={config.includeAnswers} />
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6 mt-8 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© 2024 AI Exam Generator. Powered by Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;