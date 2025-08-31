

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
      description: "Um resumo motivacional de 2-3 frases do plano de treino, explicando o seu foco e os benefícios esperados para o utilizador."
    },
    weeklyPlan: {
      type: Type.ARRAY,
      description: "Um plano de treino de 5 dias para a semana. Inclui 2 dias de descanso.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: {
            type: Type.STRING,
            description: "Dia da semana (ex: 'Segunda-feira', 'Terça-feira')."
          },
          focus: {
            type: Type.STRING,
            description: "O foco principal do treino do dia (ex: 'Força do Tronco Superior', 'Condicionamento de Corpo Inteiro', 'Recuperação Ativa'). Usa 'Dia de Descanso' para dias sem treino."
          },
          exercises: {
            type: Type.ARRAY,
            description: "Lista de exercícios para o dia. Deve estar vazia se for um Dia de Descanso.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Nome do exercício."
                },
                sets: {
                  type: Type.INTEGER,
                  description: "Número de séries."
                },
                reps: {
                  type: Type.STRING,
                  description: "Número de repetições por série (ex: '10-12', 'AMRAP 15min')."
                },
                rest: {
                  type: Type.INTEGER,
                  description: "Tempo de descanso em segundos entre as séries."
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
            description: "Uma análise detalhada mas encorajadora, focada no fitness, do físico do utilizador com base na imagem. Não forneças conselhos médicos ou medidas exatas. Descreve o tipo de corpo geral, desenvolvimento muscular aparente (ex: 'ombros bem definidos') e postura. Mantém o tom positivo e motivacional. Máximo de 3 frases."
        },
        focusAreas: {
            type: Type.ARRAY,
            description: "Uma lista de 2-3 áreas gerais de fitness para focar para um físico equilibrado (ex: 'Força do Core', 'Potência dos Membros Inferiores', 'Melhoria da Postura').",
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
    const prompt = "Analisa o físico nesta foto de uma perspetiva de fitness. Responde em Português de Portugal e em formato JSON de acordo com o esquema fornecido.";
    
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
    const analysisSection = analysis
        ? `**Análise de Fitness do Utilizador (com base na foto):**\n${analysis}`
        : `**Contexto do Utilizador:**\nNenhuma análise de foto foi fornecida. O plano deve ser criado com base apenas nos objetivos do utilizador.`;

    const prompt = `
    Cria um plano de treino semanal personalizado de 5 dias com base na seguinte informação do utilizador. O utilizador tem 2 dias de descanso.

    ${analysisSection}

    **Objetivos do Utilizador:**
    - Objetivo Principal: ${goals.primaryGoal}
    - Objetivos Secundários: ${goals.secondaryGoals.join(', ')}

    Por favor, gera um plano de treino estruturado em formato JSON que siga o esquema fornecido. O plano deve ser desafiador mas alcançável, e adaptado aos objetivos e (se disponível) à análise do utilizador. O plano e todos os seus conteúdos devem estar em Português de Portugal.
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
        contents: `Fornece um guia conciso, passo a passo, sobre como executar um(a) "${exerciseName}". Inclui dicas para a forma correta e erros comuns a evitar. Usa markdown para formatação. Responde em Português de Portugal.`
    });

    const imagePromise = ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Ilustração de exercício de fitness de uma pessoa a fazer "${exerciseName}". Estilo de diagrama claro, anatómico, mostrando a forma correta. Fundo branco, linhas simples, figura de género neutro.`,
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