'use client';

import { useState } from 'react';
import { analyzeEvidence } from '@/actions/supervision';
import { Sparkles, Brain, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIAnalysisPanelProps {
    evidenceId: string;
    existingAnalysis?: any;
}

export default function AIAnalysisPanel({ evidenceId, existingAnalysis }: AIAnalysisPanelProps) {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(existingAnalysis);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const result = await analyzeEvidence(evidenceId);
            setAnalysis(result);
        } catch (error) {
            console.error("AI Analysis failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mt-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Análisis Inteligente (AI)
            </h3>

            {!analysis ? (
                <div className="text-center py-6">
                    <p className="text-gray-400 mb-4 text-sm">
                        Utiliza nuestra IA para pre-validar esta evidencia automáticamente.
                    </p>
                    <Button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] border border-purple-500/50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analizando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Analizar Ahora
                            </>
                        )}
                    </Button>
                </div>
            ) : (
                <div className={`p-4 rounded-xl border ${analysis.status === 'PASS'
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    } animate-in fade-in zoom-in duration-300`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {analysis.status === 'PASS' ? (
                                <CheckCircle2 className="w-5 h-5 text-purple-400" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            )}
                            <span className={`font-bold ${analysis.status === 'PASS' ? 'text-purple-400' : 'text-yellow-400'
                                }`}>
                                {analysis.status === 'PASS' ? 'VALIDACIÓN EXITOSA' : 'REVISIÓN REQUERIDA'}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">
                            {(analysis.confidence * 100).toFixed(0)}% Confianza
                        </span>
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed border-t border-white/5 pt-3">
                        {analysis.reasoning}
                    </p>

                    <div className="mt-4 flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAnalyze}
                            className="text-xs text-gray-500 hover:text-white"
                        >
                            <Loader2 className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Re-analizando...' : 'Re-intentar'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
