
import { GoogleGenAI, Type } from "@google/genai";
import type { BodyAnalysis, Exercise, UserGoals, WorkoutPlan } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const workoutPlanSchema = {
  type: Type.OBJECT,
  properties: {
    planSummary: {
      type: Type.STRING,
      description: "A 2-3 sentence motivational summary of the workout plan, explaining its focus and expected benefits for the user."
    },
    weeklyPlan: {
      type: Type.ARRAY,
      description: "A 5-day workout plan for the week. Include 2 rest days.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: {
            type: Type.STRING,
            description: "Day of the week (e.g., 'Monday', 'Tuesday')."
          },
          focus: {
            type: Type.STRING,
            description: "The main focus of the day's workout (e.g., 'Upper Body Strength', 'Full Body Conditioning', 'Active Recovery'). Use 'Rest Day' for non-workout days."
          },
          exercises: {
            type: Type.ARRAY,
            description: "List of exercises for the day. Should be empty if it's a Rest Day.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Name of the exercise."
                },
                sets: {
                  type: Type.INTEGER,
                  description: "Number of sets."
                },
                reps: {
                  type: Type.STRING,
                  description: "Number of repetitions per set (e.g., '10-12', 'AMRAP 15min')."
                },
                rest: {
                  type: Type.INTEGER,
                  description: "Rest time in seconds between sets."
                }
              },
              required: ["name", "sets", "reps", "rest"]
            }
          }
        },
        required: ["day", "focus", "exercises"]
      }
    }
  },
  required: ["planSummary", "weeklyPlan"]
};

const bodyAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        analysis: {
            type: Type.STRING,
            description: "A detailed but encouraging fitness-focused analysis of the user's physique based on the image. Do not provide medical advice or exact measurements. Describe general body type, apparent muscle development (e.g., 'well-defined shoulders'), and posture. Keep the tone positive and motivational. Maximum 3 sentences."
        },
        focusAreas: {
            type: Type.ARRAY,
            description: "A list of 2-3 general fitness areas to focus on for a balanced physique (e.g., 'Core Strength', 'Lower Body Power', 'Posture Improvement').",
            items: {
                type: Type.STRING
            }
        }
    },
    required: ["analysis", "focusAreas"]
};


const fileToGenerativePart = async (file: string) => {
    return {
      inlineData: {
        data: file,
        mimeType: 'image/jpeg' 
      },
    };
}


export const analyzeBodyFromImage = async (base64Image: string): Promise<BodyAnalysis> => {
    const imagePart = await fileToGenerativePart(base64Image);
    const prompt = "Analyze the physique in this photo from a fitness perspective. Respond in JSON format according to the provided schema.";
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{text: prompt}, imagePart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: bodyAnalysisSchema,
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as BodyAnalysis;
};

export const generateWorkoutPlan = async (analysis: string, goals: UserGoals): Promise<WorkoutPlan> => {
    const prompt = `
    Based on the following user information, create a personalized 5-day weekly workout plan. The user has 2 rest days.

    **User Fitness Analysis:**
    ${analysis}

    **User Goals:**
    - Primary Goal: ${goals.primaryGoal}
    - Secondary Goals: ${goals.secondaryGoals.join(', ')}

    Please generate a structured workout plan in JSON format that follows the provided schema. The plan should be challenging but achievable, and tailored to the user's goals and analysis.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: workoutPlanSchema,
        },
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as WorkoutPlan;
};

export const getExerciseDetails = async (exerciseName: string): Promise<Pick<Exercise, 'description' | 'image'>> => {
    const descriptionPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide a concise, step-by-step guide on how to perform a "${exerciseName}". Include tips for proper form and common mistakes to avoid. Use markdown for formatting.`
    });

    const imagePromise = ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Fitness exercise illustration of a person doing a "${exerciseName}". Clear, anatomical, diagrammatic style, showing correct form. White background, simple lines, gender-neutral figure.`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });
    
    const [descriptionResponse, imageResponse] = await Promise.all([descriptionPromise, imagePromise]);

    const description = descriptionResponse.text;
    const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

    return { description, image: imageUrl };
};
