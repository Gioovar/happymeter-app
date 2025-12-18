
// Types matching Prisma Schema
export interface Survey {
    id: string;
    userId: string;
    title: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    questions: Question[];
    responses: Response[];
}

export interface Question {
    id: string;
    surveyId: string;
    text: string;
    type: string; // "EMOJI", "TEXT", "RATING", "SELECT"
    options: any | null;
    order: number;
    required: boolean;
}

export interface Response {
    id: string;
    surveyId: string;
    createdAt: Date;
    customerName: string | null;
    customerEmail: string | null;
    answers: Answer[];
    // Extra metadata
    whatsapp?: string;
    satisfaction_bucket?: 'ROJO' | 'AMARILLO' | 'VERDE';
}

export interface Answer {
    id: string;
    responseId: string;
    questionId: string;
    value: string;
}

// Helper to generate random date within last days
const getRandomDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * days));
    return date;
};

// Helper to generate weighted random choice
const getWeightedChoice = (options: { value: string, weight: number }[]) => {
    const totalWeight = options.reduce((acc, opt) => acc + opt.weight, 0);
    let random = Math.random() * totalWeight;

    for (const option of options) {
        if (random < option.weight) return option.value;
        random -= option.weight;
    }
    return options[0].value;
};

// Generate 200 Mock Responses
const generateMockData = (): Response[] => {
    const responses: Response[] = [];
    const names = ["Juan", "Maria", "Carlos", "Ana", "Luis", "Sofia", "Pedro", "Laura", "Diego", "Valentina", "Javier", "Isabella", "Andres", "Camila", "Fernando", "Lucia"];

    for (let i = 0; i < 200; i++) {
        const id = (i + 1).toString();
        const createdAt = getRandomDate(30); // Last 30 days
        const name = names[Math.floor(Math.random() * names.length)] + " " + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + ".";

        // User Criteria:
        // 1. Good waiter service (Servicio Personal)
        // 2. High prices (Precios)
        // 3. Slow drink wait times (Tiempo Bebidas)

        const answers: Answer[] = [
            // Q1: Nombre
            { id: `a-${id}-1`, responseId: id, questionId: 'q1', value: name },
            // Q2: Edad
            { id: `a-${id}-2`, responseId: id, questionId: 'q2', value: (18 + Math.floor(Math.random() * 40)).toString() },
            // Q3: Email
            { id: `a-${id}-3`, responseId: id, questionId: 'q3', value: `user${id}@example.com` },
            // Q4: Canal
            { id: `a-${id}-4`, responseId: id, questionId: 'q4', value: getWeightedChoice([{ value: 'Instagram', weight: 40 }, { value: 'Facebook', weight: 30 }, { value: 'Google', weight: 20 }, { value: 'Recomendación', weight: 10 }]) },
            // Q5: Experiencia General (Mixed, mostly 3-4 due to prices/wait)
            { id: `a-${id}-5`, responseId: id, questionId: 'q5', value: getWeightedChoice([{ value: '5', weight: 10 }, { value: '4', weight: 40 }, { value: '3', weight: 30 }, { value: '2', weight: 15 }, { value: '1', weight: 5 }]) },
            // Q6: Servicio Personal (Mostly Good/Excellent)
            { id: `a-${id}-6`, responseId: id, questionId: 'q6', value: getWeightedChoice([{ value: 'Excelente', weight: 60 }, { value: 'Bueno', weight: 30 }, { value: 'Regular', weight: 8 }, { value: 'Malo', weight: 2 }]) },
            // Q7: Calidad Alimentos (Good)
            { id: `a-${id}-7`, responseId: id, questionId: 'q7', value: getWeightedChoice([{ value: 'Excelente', weight: 40 }, { value: 'Bueno', weight: 50 }, { value: 'Regular', weight: 10 }, { value: 'Malo', weight: 0 }]) },
            // Q8: Rapidez Bebidas (Slow)
            { id: `a-${id}-8`, responseId: id, questionId: 'q8', value: getWeightedChoice([{ value: 'Muy rápido', weight: 5 }, { value: 'A tiempo', weight: 15 }, { value: 'Lento', weight: 50 }, { value: 'Muy lento', weight: 30 }]) },
            // Q9: Precios (High)
            { id: `a-${id}-9`, responseId: id, questionId: 'q9', value: getWeightedChoice([{ value: 'Justos', weight: 10 }, { value: 'Altos', weight: 60 }, { value: 'Muy Altos', weight: 30 }]) },
            // Q10: Mejora (Comments reflecting the issues)
            {
                id: `a-${id}-10`, responseId: id, questionId: 'q10', value: getWeightedChoice([
                    { value: 'Bajar los precios', weight: 30 },
                    { value: 'Las bebidas tardan mucho', weight: 30 },
                    { value: 'Todo bien con los meseros pero muy caro', weight: 20 },
                    { value: '', weight: 20 }
                ])
            },
        ];

        // Determine bucket based on rating
        const rating = parseInt(answers.find(a => a.questionId === 'q5')?.value || '0');
        let bucket: 'ROJO' | 'AMARILLO' | 'VERDE' = 'VERDE';
        if (rating <= 2) bucket = 'ROJO';
        else if (rating === 3) bucket = 'AMARILLO';

        responses.push({
            id,
            surveyId: 's1',
            createdAt: createdAt,
            customerName: name,
            customerEmail: `user${id}@example.com`,
            answers,
            satisfaction_bucket: bucket
        });
    }

    // Sort by date
    return responses.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

const generatedResponses = generateMockData();

export const getStructuredData = (): Survey => {
    const questions: Question[] = [
        { id: 'q1', surveyId: 's1', text: 'Nombre', type: 'TEXT', options: null, order: 1, required: true },
        { id: 'q2', surveyId: 's1', text: 'Edad', type: 'TEXT', options: null, order: 2, required: true },
        { id: 'q3', surveyId: 's1', text: 'Email', type: 'TEXT', options: null, order: 3, required: true },
        { id: 'q4', surveyId: 's1', text: 'Canal', type: 'SELECT', options: ['Instagram', 'Facebook', 'Google', 'Recomendación'], order: 4, required: true },
        { id: 'q5', surveyId: 's1', text: 'Experiencia General', type: 'RATING', options: null, order: 5, required: true },
        { id: 'q6', surveyId: 's1', text: 'Servicio Personal', type: 'SELECT', options: ['Excelente', 'Bueno', 'Regular', 'Malo'], order: 6, required: true },
        { id: 'q7', surveyId: 's1', text: 'Calidad Alimentos', type: 'SELECT', options: ['Excelente', 'Bueno', 'Regular', 'Malo'], order: 7, required: true },
        { id: 'q8', surveyId: 's1', text: 'Tiempo de Bebidas', type: 'SELECT', options: ['Muy rápido', 'A tiempo', 'Lento', 'Muy lento'], order: 8, required: true },
        { id: 'q9', surveyId: 's1', text: 'Percepción de Precios', type: 'SELECT', options: ['Justos', 'Altos', 'Muy Altos'], order: 9, required: true },
        { id: 'q10', surveyId: 's1', text: 'Comentarios de Mejora', type: 'TEXT', options: null, order: 10, required: false },
    ];

    return {
        id: 's1',
        userId: 'user_mock',
        title: 'Encuesta de Satisfacción General',
        description: 'Datos generados automáticamente',
        createdAt: new Date(),
        updatedAt: new Date(),
        questions,
        responses: generatedResponses
    };
};

export const getSurveyStats = () => {
    const survey = getStructuredData();
    const totalResponses = survey.responses.length;

    // Calculate Average Satisfaction from Question 5 (Experiencia General)
    const totalSatisfaction = survey.responses.reduce((acc, curr) => {
        const ratingAnswer = curr.answers.find(a => a.questionId === 'q5');
        return acc + (ratingAnswer ? parseInt(ratingAnswer.value) : 0);
    }, 0);

    const averageSatisfaction = (totalSatisfaction / totalResponses).toFixed(1);

    return [
        { label: 'Total Respuestas', value: totalResponses.toString(), change: '+15%', icon: 'Users', color: 'text-blue-400' },
        { label: 'Satisfacción Promedio', value: averageSatisfaction, change: '-0.2', icon: 'Star', color: 'text-yellow-400' },
        { label: 'Encuestas Activas', value: '1', change: 'Active', icon: 'BarChart3', color: 'text-green-400' },
    ];
};

export const getChartData = () => {
    const survey = getStructuredData();
    const groupedByDate: Record<string, { date: string, responses: number, satisfaction: number }> = {};

    survey.responses.forEach(response => {
        const date = response.createdAt.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
        const ratingAnswer = response.answers.find(a => a.questionId === 'q5');
        const rating = ratingAnswer ? parseInt(ratingAnswer.value) : 0;

        if (!groupedByDate[date]) {
            groupedByDate[date] = { date, responses: 0, satisfaction: 0 };
        }

        groupedByDate[date].responses += 1;
        groupedByDate[date].satisfaction += rating;
    });

    // Ensure we sort by date correctly
    return Object.values(groupedByDate).sort((a, b) => {
        // Basic sort by string might fail for cross-month, but for mock data in same month/year it's okay. 
        // For better sorting we'd need the original timestamp.
        // Let's rely on the fact that responses are already sorted by date in generation.
        return 0;
    }).map(item => ({
        date: item.date,
        respuestas: item.responses,
        satisfaccion: parseFloat((item.satisfaction / item.responses).toFixed(1))
    }));
};
