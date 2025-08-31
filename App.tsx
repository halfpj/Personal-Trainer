
import React, { useState, useCallback } from 'react';
import OnboardingWizard from './components/OnboardingWizard';
import WorkoutDashboard from './components/WorkoutDashboard';
import { BodyAnalysis, Goal, UserGoals, WorkoutPlan, AppStep } from './types';
import { analyzeBodyFromImage, generateWorkoutPlan } from './services/geminiService';
import { IconSparkles } from './components/icons/IconSparkles';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.WELCOME);
  const [userGoals, setUserGoals] = useState<UserGoals>({
    primaryGoal: null,
    secondaryGoals: [],
  });
  const [userImages, setUserImages] = useState<string[]>([]);
  const [bodyAnalysis, setBodyAnalysis] = useState<BodyAnalysis | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleStart = () => {
    setStep(AppStep.GOALS);
  };

  const handleGoalsSubmit = (goals: UserGoals) => {
    setUserGoals(goals);
    setStep(AppStep.PHOTOS);
  };

  const handleAnalysis = useCallback(async (images: string[]) => {
    setUserImages(images);
    setIsLoading(true);
    setError(null);

    try {
      setLoadingMessage('Analyzing your physique...');
      setStep(AppStep.ANALYZING);
      const analysisResult = await analyzeBodyFromImage(images[0]); // Using first image for analysis
      setBodyAnalysis(analysisResult);

      setLoadingMessage('Generating your personalized workout plan...');
      const plan = await generateWorkoutPlan(analysisResult.analysis, userGoals);
      setWorkoutPlan(plan);

      setStep(AppStep.DASHBOARD);
    } catch (err) {
      console.error(err);
      setError('An error occurred during AI analysis. Please try again.');
      setStep(AppStep.PHOTOS); // Go back to photos step on error
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [userGoals]);
  
  const resetApp = () => {
    setStep(AppStep.WELCOME);
    setUserGoals({ primaryGoal: null, secondaryGoals: [] });
    setUserImages([]);
    setBodyAnalysis(null);
    setWorkoutPlan(null);
    setError(null);
    setIsLoading(false);
  };

  const renderContent = () => {
    switch (step) {
      case AppStep.WELCOME:
        return (
          <div className="text-center">
            <div className="flex justify-center items-center gap-4 mb-6">
              <IconSparkles className="w-12 h-12 text-indigo-400" />
              <h1 className="text-5xl font-bold tracking-tight text-white">AI Personal Trainer</h1>
            </div>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              Get a personalized fitness plan based on your unique physique and goals, powered by cutting-edge AI.
            </p>
            <button
              onClick={handleStart}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        );
      case AppStep.GOALS:
      case AppStep.PHOTOS:
        return <OnboardingWizard currentStep={step} onGoalsSubmit={handleGoalsSubmit} onPhotosSubmit={handleAnalysis} />;
      case AppStep.ANALYZING:
        return (
          <div className="text-center">
            <div className="flex justify-center items-center">
              <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold mt-6">{loadingMessage}</h2>
            <p className="text-gray-400 mt-2">This may take a moment. Please don't close the window.</p>
          </div>
        );
      case AppStep.DASHBOARD:
        if (workoutPlan && bodyAnalysis) {
          return <WorkoutDashboard workoutPlan={workoutPlan} bodyAnalysis={bodyAnalysis} onReset={resetApp} />;
        }
        // Fallback if data is missing
        setError("Workout plan could not be generated. Please start over.");
        setStep(AppStep.WELCOME);
        return null;
      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        {renderContent()}
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
       <footer className="w-full max-w-6xl mx-auto text-center text-gray-500 text-sm mt-8 py-4 border-t border-gray-800">
        Powered by Gemini AI. This is a demonstration and not medical advice.
      </footer>
    </div>
  );
};

export default App;
