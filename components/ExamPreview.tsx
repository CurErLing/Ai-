import React, { useState } from 'react';
import { ExamData, QuestionType } from '../types';
import MathText from './MathText';

interface ExamPreviewProps {
  exam: ExamData;
  showAnswersInit: boolean;
}

const ExamPreview: React.FC<ExamPreviewProps> = ({ exam, showAnswersInit }) => {
  const [showAnswers, setShowAnswers] = useState(showAnswersInit);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    // Critical: Wait for fonts (especially KaTeX/MathJax fonts) to load before capturing canvas
    try {
      await document.fonts.ready;
      // Add a small delay to ensure MathJax layout is fully settled
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      console.warn("Font loading check failed", e);
    }

    const element = document.getElementById('exam-printable-content');
    
    // Configuration for html2pdf
    const opt = {
      margin:       [10, 10, 10, 10], // top, left, bottom, right
      filename:     `${exam.title || 'exam'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 3, // Increased scale for sharper text and formulas
        useCORS: true, // Allow loading fonts from CDN
        logging: false,
        letterRendering: true, // Attempt to fix text kerning issues
        allowTaint: true,
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] }
    };

    // Use html2pdf from window object
    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save().then(() => {
        setIsDownloading(false);
      }).catch((err: any) => {
        console.error("PDF generation failed:", err);
        setIsDownloading(false);
        // Fallback to print if library fails
        window.print();
      });
    } else {
      // Fallback if library didn't load
      window.print();
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none">
      {/* Controls - Hidden when printing/saving as PDF */}
      <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        <h2 className="font-bold text-slate-700 flex items-center gap-2">
          <i className="fa-regular fa-file-lines"></i>
          试卷预览
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-slate-200">
            <input 
              type="checkbox" 
              id="showAnswers" 
              checked={showAnswers} 
              onChange={(e) => setShowAnswers(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="showAnswers" className="text-sm text-slate-700 cursor-pointer select-none">
              附带答案解析页
            </label>
          </div>
          
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className={`px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-colors flex items-center gap-2 ${isDownloading ? 'opacity-75 cursor-wait' : ''}`}
            title="生成并下载 PDF 文件"
          >
            {isDownloading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                生成中...
              </>
            ) : (
              <>
                <i className="fa-solid fa-download"></i>
                下载 PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Printable Area - targeted by html2pdf */}
      <div id="exam-printable-content" className="p-8 max-w-4xl mx-auto print:p-0 print:w-full print:max-w-none print:m-0 bg-white text-slate-900">
        
        {/* Exam Header */}
        <div className="text-center border-b-2 border-black pb-6 mb-8 print:mb-6">
          <h1 className="text-3xl font-serif font-bold mb-3 tracking-wide">{exam.title}</h1>
          <div className="flex justify-center gap-8 text-sm font-serif mb-4 text-slate-700 print:text-black">
            <span>科目: {exam.subject}</span>
            <span>总分: {exam.totalScore}</span>
            <span>时长: {exam.durationMinutes} 分钟</span>
          </div>
          {/* Student Info Fields */}
          <div className="flex justify-between px-16 text-sm font-serif print:px-0 mt-6 text-black">
             <span>姓名: ______________</span>
             <span>班级: ______________</span>
             <span>考号: ______________</span>
          </div>
        </div>

        {/* Exam Content (Questions) */}
        <div className="space-y-8 print:space-y-6 min-h-[50vh]">
          {exam.sections.map((section, sIndex) => (
            <div key={sIndex} className="section mb-6">
              <h3 className="text-lg font-bold mb-4 font-serif bg-slate-100 p-2 print:bg-transparent print:p-0 print:border-b print:border-slate-200 text-slate-800 print:text-black">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-slate-600 italic mb-4 text-sm print:text-black">{section.description}</p>
              )}
              
              <div className="space-y-6 print:space-y-4">
                {section.questions.map((q, qIndex) => (
                  <div key={q.id} className="question break-inside-avoid">
                    <div className="flex gap-2">
                      <span className="font-bold font-serif text-slate-800 print:text-black">{qIndex + 1}.</span>
                      <div className="flex-1">
                        <div className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <div className="mb-2 font-medium text-justify w-full leading-loose text-slate-800 print:text-black">
                              <MathText text={q.content} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 print:text-black print:px-1 shrink-0 ml-2">({q.score} 分)</span>
                          </div>
                          
                          {/* Generated Geometry Diagram (SVG) */}
                          {q.diagramSvg && (
                            <div 
                              className="my-3 flex justify-center p-4"
                              dangerouslySetInnerHTML={{ __html: q.diagramSvg }} 
                            />
                          )}
                        </div>

                        {/* Options for MCQ */}
                        {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 mt-2 ml-1">
                            {q.options.map((opt, i) => (
                              <div key={i} className="flex gap-2 items-start group">
                                <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-sm font-serif print:border-black shrink-0 text-slate-600 print:text-black">
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span className="text-sm leading-relaxed text-slate-700 print:text-black pt-0.5">
                                  <MathText text={opt} />
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Space for written answers */}
                        {(q.type === QuestionType.SHORT_ANSWER || q.type === QuestionType.ESSAY) && (
                           <div className="mt-8 mb-2 h-20 border-b border-dotted border-slate-300 print:border-slate-400 w-full opacity-50"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 mb-12 text-center text-xs text-slate-400 print:mb-0 print:text-black">
          —— 试卷结束 ——
        </div>

        {/* Answer Key Section (New Page) */}
        {showAnswers && (
           <div className="page-break pt-8 html2pdf__page-break">
             {/* Header for Answer Page */}
             <div className="text-center border-b-2 border-black pb-4 mb-8">
               <h2 className="text-2xl font-serif font-bold text-black">参考答案与解析</h2>
               <p className="text-sm text-slate-500 mt-1 print:text-black">{exam.title}</p>
             </div>
             
             <div className="space-y-8">
               {exam.sections.map((section, sIndex) => (
                 <div key={sIndex} className="break-inside-avoid">
                   <h3 className="font-bold text-base mb-3 border-l-4 border-indigo-500 pl-3 print:border-black text-black">{section.title}</h3>
                   <div className="grid grid-cols-1 gap-4">
                     {section.questions.map((q, qIndex) => (
                       <div key={q.id} className="text-sm border-b border-slate-100 pb-2 print:border-none">
                         <div className="flex items-baseline gap-2 mb-2">
                           <span className="font-bold text-slate-900 w-6 text-right print:text-black">{qIndex + 1}.</span>
                           <span className="font-bold text-indigo-800 bg-indigo-50 px-2 rounded print:text-black print:bg-transparent print:border print:border-black print:px-2">
                             <MathText text={q.answer} />
                           </span>
                         </div>
                         <div className="pl-8 text-slate-600 print:text-black text-justify leading-relaxed">
                           <span className="font-bold text-xs text-slate-400 mr-1 print:text-black">[解析]</span> 
                           <MathText text={q.explanation} />
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default ExamPreview;