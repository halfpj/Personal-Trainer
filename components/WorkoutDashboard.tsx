

import React, { useState } from 'react';
import { BodyAnalysis, DailyWorkout, Exercise, WorkoutPlan } from '../types';
import ExerciseDetailModal from './ExerciseDetailModal';
import { IconSparkles } from './icons/IconSparkles';

interface WorkoutDashboardProps {
  workoutPlan: WorkoutPlan;
  bodyAnalysis: BodyAnalysis | null;
  onReset: () => void;
}

const WorkoutDashboard: React.FC<WorkoutDashboardProps> = ({ workoutPlan, bodyAnalysis, onReset }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const activeDay: DailyWorkout = workoutPlan.weeklyPlan[activeDayIndex];

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-white">O Seu Plano Semanal</h1>
        <button
            onClick={onReset}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
            Começar de Novo
        </button>
      </div>
      
      {bodyAnalysis && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
            <div className="flex items-center gap-3 mb-3">
            <IconSparkles className="w-6 h-6 text-indigo-400" />
            <h2 className="text-2xl font-bold text-white">Análise de Fitness por IA</h2>
            </div>
            <p className="text-gray-300 mb-4">{bodyAnalysis.analysis}</p>
            <div className="flex flex-wrap gap-2">
                <span className="font-semibold text-gray-200">Áreas de Foco:</span>
                {bodyAnalysis.focusAreas.map((area, index) => (
                    <span key={index} className="bg-indigo-500/50 text-indigo-200 text-sm font-medium px-3 py-1 rounded-full">
                        {area}
                    </span>
                ))}
            </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left side - Day selection */}
        <div className="lg:w-1/4">
          <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4 px-2">Resumo da Semana</h3>
            <ul className="space-y-2">
              {workoutPlan.weeklyPlan.map((day, index) => (
                <li key={index}>
                  <button
                    onClick={() => setActiveDayIndex(index)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      activeDayIndex === index
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'hover:bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    <p className="font-bold">{day.day}</p>
                    <p className="text-sm opacity-80">{day.focus}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right side - Workout details */}
        <div className="lg:w-3/4">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-1">{activeDay.day}: <span className="text-indigo-400">{activeDay.focus}</span></h2>
            {activeDay.exercises.length > 0 ? (
              <ul className="divide-y divide-gray-700 mt-6">
                {activeDay.exercises.map((exercise, index) => (
                  <li key={index} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="text-lg font-bold text-white">{exercise.name}</p>
                      <p className="text-gray-400">
                        {exercise.sets} séries &times; {exercise.reps} reps, {exercise.rest}s descanso
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedExercise(exercise)}
                      className="bg-gray-700 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Detalhes
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                  <p className="text-2xl font-bold text-gray-300">Dia de Descanso</p>
                  <p className="text-gray-400 mt-2">Tempo para recuperar e ficar mais forte!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
};

export default WorkoutDashboard;