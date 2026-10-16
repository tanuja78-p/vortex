// Demo only: mastery values are simulated

import React, { useState } from 'react';
import data from './data.json';
import { Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function ConceptMapDashboard() {
  // Default to Alex (Struggling Student) to show the adaptive routing live
  const [selectedStudentId, setSelectedStudentId] = useState('s1');

  // Find current student data
  const currentStudent = data.students.find(s => s.id === selectedStudentId);

  // Function to check if a concept is unlocked based on prerequisites and mastery
  const checkStatus = (concept) => {
    // If no prerequisites, it's always unlocked
    if (concept.prerequisites.length === 0) return 'unlocked';

    // Check if all prerequisites have mastery >= 50% (0.50)
    const prereqsMet = concept.prerequisites.every(
      prereqId => (currentStudent.mastery[prereqId] || 0) >= 0.50
    );

    if (!prereqsMet) return 'locked';

    // If prerequisites are met, check own mastery
    const ownMastery = currentStudent.mastery[concept.id] || 0;
    if (ownMastery >= 0.70) return 'mastered';
    return 'in-progress';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header & Student Switcher */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 p-6 rounded-xl border border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Adaptive Syllabus & Knowledge Map</h1>
            <p className="text-slate-400 text-sm mt-1">Real-time prerequisite graph tracking student mastery paths.</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-300">View as:</span>
            <select 
              value={selectedStudentId} 
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {data.students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.id === 's1' ? 'Remedial Path' : 'Advanced Path'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Concept Map Tree / Flow */}
        <div className="space-y-6 relative">
          <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate-800 -z-0 hidden md:block"></div>

          {data.concept_map.map((concept, index) => {
            const status = checkStatus(concept);
            const masteryScore = Math.round((currentStudent.mastery[concept.id] || 0) * 100);

            // Dynamic Styling based on Status
            let borderStyle = "border-slate-800 bg-slate-900/50";
            let badgeColor = "bg-slate-800 text-slate-400";
            let StatusIcon = Lock;

            if (status === 'mastered') {
              borderStyle = "border-emerald-500/40 bg-emerald-950/20";
              badgeColor = "bg-emerald-500/20 text-emerald-400";
              StatusIcon = CheckCircle2;
            } else if (status === 'in-progress') {
              borderStyle = "border-amber-500/40 bg-amber-950/20";
              badgeColor = "bg-amber-500/20 text-amber-400";
              StatusIcon = AlertCircle;
            } else if (status === 'locked') {
              borderStyle = "border-slate-800 bg-slate-950/50 opacity-60";
              badgeColor = "bg-slate-800 text-slate-500";
              StatusIcon = Lock;
            }

            return (
              <div key={concept.id} className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                
                {/* Step Node Indicator */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${borderStyle} shadow-lg shrink-0`}>
                  <StatusIcon className={`w-6 h-6 ${status === 'mastered' ? 'text-emerald-400' : status === 'in-progress' ? 'text-amber-400' : 'text-slate-500'}`} />
                </div>

                {/* Card Content */}
                <div className={`flex-1 w-full p-6 rounded-2xl border ${borderStyle} backdrop-blur-sm transition-all duration-300`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Module {index + 1}</span>
                      <h3 className="text-lg font-semibold text-white">{concept.name}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${badgeColor}`}>
                      {status.toUpperCase()} ({masteryScore}% Mastery)
                    </span>
                  </div>

                  <p className="text-slate-400 text-sm mb-4">{concept.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800/60">
                    <div>Prerequisites: <span className="text-slate-300 font-mono">{concept.prerequisites.length > 0 ? concept.prerequisites.join(', ') : 'None'}</span></div>
                    
                    {status === 'in-progress' && (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        Targeted for Remediation <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}