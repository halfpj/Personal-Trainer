import React, { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { getExerciseDetails } from '../services/geminiService';
import { IconLoader } from './icons/IconLoader';

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
}

const MarkdownRenderer = ({ text }: { text: string }) => {
    const safeText = String(text || '');

    const lines = safeText.split('\n');
    let htmlContent = '';
    let inList = false;

    for (const line of lines) {
        let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        if (processedLine.trim().startsWith('* ')) {
            if (!inList) {
                htmlContent += '<ul>';
                inList = true;
            }
            htmlContent += `<li>${processedLine.trim().substring(2)}</li>`;
        } else {
            if (inList) {
                htmlContent += '</ul>';
                inList = false;
            }
            if (processedLine.trim().length > 0) {
                htmlContent += `<p>${processedLine}</p>`;
            }
        }
    }

    if (inList) {
        htmlContent += '</ul>';
    }
  
    return <div className="prose prose-invert text-gray-300" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};


const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, onClose }) => {
  const [details, setDetails] = useState<Pick<Exercise, 'description' | 'image'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const cacheKey = `exercise-details-${exercise.name}`;
      try {
        // 1. Check cache first
        const cachedDetails = localStorage.getItem(cacheKey);
        if (cachedDetails) {
          setDetails(JSON.parse(cachedDetails));
          setIsLoading(false);
          return;
        }

        // 2. If not in cache, check network connection
        if (!navigator.onLine) {
            setError("You are offline and these exercise details are not cached.");
            setIsLoading(false);
            return;
        }

        // 3. Fetch from network
        setIsLoading(true);
        setError(null);
        const fetchedDetails = await getExerciseDetails(exercise.name);
        setDetails(fetchedDetails);

        // 4. Cache the new data
        localStorage.setItem(cacheKey, JSON.stringify(fetchedDetails));

      } catch (err) {
        console.error("Failed to fetch exercise details:", err);
        setError("Could not load exercise details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [exercise.name]);

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-2">{exercise.name}</h2>
            <p className="text-indigo-400 font-semibold mb-6">
                {exercise.sets} sets &times; {exercise.reps} reps &bull; {exercise.rest}s rest
            </p>

            {isLoading && (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <IconLoader className="w-12 h-12" />
                    <p className="mt-4 text-gray-400">Loading exercise details...</p>
                </div>
            )}
            {error && <p className="text-red-500 text-center py-10">{error}</p>}
            
            {!isLoading && !error && details && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="w-full h-auto aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
                        {details.image ? <img src={details.image} alt={`AI generated image for ${exercise.name}`} className="rounded-lg object-cover w-full h-full" /> : <p>Image not available</p>}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-3 text-white">How to perform:</h3>
                        {details.description ? <MarkdownRenderer text={details.description} /> : <p>No description available.</p>}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetailModal;