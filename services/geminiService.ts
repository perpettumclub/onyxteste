import { GoogleGenAI } from "@google/genai";
import { Task } from "../types";

// NOTE: In a real app, do not expose API keys on the client side if possible.
// For this demo structure, we assume process.env.API_KEY is available.
const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

export const generateProjectSummary = async (tasks: Task[]): Promise<string> => {
  if (!apiKey) {
    return "API Key not configured. Please set process.env.API_KEY to use AI features.";
  }

  const tasksJson = JSON.stringify(tasks.map(t => ({
    title: t.title,
    status: t.status,
    assignee: t.assignee,
    dueDate: t.dueDate
  })));

  const prompt = `
    Atue como um Gerente de Projetos Sênior focado em eficiência.
    Analise a seguinte lista de tarefas de um lançamento de infoproduto (JSON):
    ${tasksJson}

    Gere um "Daily Briefing" curto e direto (máximo 1 parágrafo grande ou 3 bullet points) em Português.
    Foque no que está travado (atrasado ou bloqueado), o progresso geral e qual deve ser o foco do dia.
    Mantenha um tom profissional, encorajador e sério (estilo corporativo/premium).
    Não use formatação Markdown excessiva, apenas texto limpo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar o resumo.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao conectar com a IA para gerar o resumo.";
  }
};