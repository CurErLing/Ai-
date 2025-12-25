import React from 'react';
import { ExamData } from '../types';

interface ExamListProps {
  exams: ExamData[];
  onView: (exam: ExamData) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const ExamList: React.FC<ExamListProps> = ({ exams, onView, onDelete, onCreateNew }) => {
  if (exams.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-regular fa-folder-open text-4xl text-slate-300"></i>
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">暂无试卷</h3>
        <p className="text-slate-500 mb-8">您还没有生成任何试卷，快去创建一个吧！</p>
        <button 
          onClick={onCreateNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          新建试卷
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">
          <i className="fa-solid fa-list-check mr-2 text-indigo-600"></i>
          试卷管理 ({exams.length})
        </h2>
        <button 
          onClick={onCreateNew}
          className="text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          生成新试卷
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">试卷标题</th>
              <th className="px-6 py-4 font-medium">科目</th>
              <th className="px-6 py-4 font-medium">分数 / 时长</th>
              <th className="px-6 py-4 font-medium">创建时间</th>
              <th className="px-6 py-4 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exams.map((exam) => (
              <tr key={exam.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{exam.title}</div>
                  <div className="text-xs text-slate-400 md:hidden mt-1">{exam.subject}</div>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">{exam.subject}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {exam.totalScore}分 <span className="mx-1 text-slate-300">|</span> {exam.durationMinutes}分钟
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {exam.createdAt ? new Date(exam.createdAt).toLocaleString('zh-CN', {
                     month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : '-'}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button 
                    onClick={() => onView(exam)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm px-3 py-1 rounded hover:bg-indigo-50 transition-colors"
                  >
                    查看 / 下载
                  </button>
                  <button 
                    onClick={() => exam.id && onDelete(exam.id)}
                    className="text-slate-400 hover:text-red-600 font-medium text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <i className="fa-regular fa-trash-can"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExamList;