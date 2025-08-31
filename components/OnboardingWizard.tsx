

import React, { useState, useCallback } from 'react';
import { AppStep, Goal, UserGoals } from '../types';
import { IconUpload } from './icons/IconUpload';
import { IconCheck } from './icons/IconCheck';

interface OnboardingWizardProps {
  currentStep: AppStep;
  onGoalsSubmit: (goals: UserGoals) => void;
  onPhotosSubmit: (photos: string[]) => void;
  onSkipPhotos: () => void;
}

const goalsOptions: Goal[] = [
  Goal.FAT_LOSS,
  Goal.MUSCLE_GAIN,
  Goal.IMPROVE_ENDURANCE,
  Goal.INCREASE_FLEXIBILITY,
  Goal.GENERAL_FITNESS,
];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ currentStep, onGoalsSubmit, onPhotosSubmit, onSkipPhotos }) => {
  const [selectedPrimaryGoal, setSelectedPrimaryGoal] = useState<Goal | null>(null);
  const [selectedSecondaryGoals, setSelectedSecondaryGoals] = useState<Goal[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const handlePrimaryGoalSelect = (goal: Goal) => {
    setSelectedPrimaryGoal(goal);
    // Ensure a goal is not both primary and secondary
    setSelectedSecondaryGoals(prev => prev.filter(g => g !== goal));
  };
  
  const handleSecondaryGoalToggle = (goal: Goal) => {
    setSelectedSecondaryGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleNextToGoals = () => {
    if (selectedPrimaryGoal) {
      onGoalsSubmit({
        primaryGoal: selectedPrimaryGoal,
        secondaryGoals: selectedSecondaryGoals,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setPhotos([base64String]);
        setPhotoPreviews([URL.createObjectURL(file)]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = () => {
    if (photos.length > 0) {
      onPhotosSubmit(photos);
    }
  };
  
  if (currentStep === AppStep.GOALS) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-2 text-white">Qual é o Seu Objetivo Principal?</h2>
        <p className="text-center text-gray-400 mb-8">Selecione um objetivo principal para se focar.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {goalsOptions.map(goal => (
            <button
              key={goal}
              onClick={() => handlePrimaryGoalSelect(goal)}
              className={`p-4 rounded-lg text-center font-semibold transition-all duration-200 ${
                selectedPrimaryGoal === goal
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 scale-105'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>

        <h3 className="text-2xl font-bold text-center mb-2 text-white">Algum Objetivo Secundário?</h3>
        <p className="text-center text-gray-400 mb-8">Selecione até duas outras áreas que gostaria de melhorar.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {goalsOptions.filter(g => g !== selectedPrimaryGoal).map(goal => (
                <button
                key={goal}
                onClick={() => handleSecondaryGoalToggle(goal)}
                disabled={selectedSecondaryGoals.length >= 2 && !selectedSecondaryGoals.includes(goal)}
                className={`p-4 rounded-lg text-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedSecondaryGoals.includes(goal)
                    ? 'bg-indigo-500 text-white ring-1 ring-indigo-300'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                >
                {goal}
                </button>
            ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleNextToGoals}
            disabled={!selectedPrimaryGoal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Seguinte: Carregar Foto
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === AppStep.PHOTOS) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-2 text-white">Análise de Físico por IA (Opcional)</h2>
        <p className="text-center text-gray-400 mb-8">Carregue uma foto de corpo inteiro para a nossa IA analisar. Isto ajuda a criar um plano verdadeiramente personalizado. A sua foto é privada e usada apenas para esta análise.</p>
        
        <div className="flex justify-center items-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors">
                {photoPreviews.length > 0 ? (
                    <div className="relative w-full h-full">
                        <img src={photoPreviews[0]} alt="Preview" className="object-contain w-full h-full rounded-lg" />
                         <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5">
                            <IconCheck className="w-6 h-6 text-white"/>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <IconUpload className="w-10 h-10 mb-4 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Clique para carregar</span> ou arraste e largue</p>
                        <p className="text-xs text-gray-500">PNG, JPG ou JPEG</p>
                    </div>
                )}
                <input id="dropzone-file" type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
            </label>
        </div> 

        <div className="text-center mt-8">
          <button
            onClick={handleFinish}
            disabled={photos.length === 0}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Analisar e Criar o Meu Plano
          </button>
          <div className="mt-4">
             <button
                onClick={onSkipPhotos}
                className="text-gray-400 hover:text-white font-semibold py-2 px-4 transition-colors rounded-lg"
              >
                Ignorar e criar plano geral
              </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OnboardingWizard;