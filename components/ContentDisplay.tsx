import React, { useState, useEffect, useRef } from 'react';
import type { Topic } from '../types';

interface ContentDisplayProps {
  topic: Topic | null;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ topic }) => {
    // TTS State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Quiz State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    const cleanupSpeech = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setIsPaused(false);
    };
    
    // Effect to reset TTS and Quiz when topic changes
    useEffect(() => {
        cleanupSpeech();
        setCurrentQuestionIndex(0);
        setScore(0);
        setShowScore(false);
        setSelectedAnswer(null);
    }, [topic]);
    
    const handleSpeak = () => {
        if (!topic) return;

        if (isSpeaking && !isPaused) { // Is speaking, so pause
            window.speechSynthesis.pause();
            setIsPaused(true);
        } else if (isSpeaking && isPaused) { // Is paused, so resume
            window.speechSynthesis.resume();
            setIsPaused(false);
        } else { // Not speaking, so start
            cleanupSpeech();
            const newUtterance = new SpeechSynthesisUtterance(topic.summary);
            newUtterance.lang = 'pt-BR';
            newUtterance.onend = () => {
                setIsSpeaking(false);
                setIsPaused(false);
            };
            newUtterance.onerror = () => {
                setIsSpeaking(false);
                setIsPaused(false);
            };
            utteranceRef.current = newUtterance;
            window.speechSynthesis.speak(newUtterance);
            setIsSpeaking(true);
            setIsPaused(false);
        }
    };

    const handleStop = () => {
        cleanupSpeech();
    };

    const handleAnswerOptionClick = (option: string) => {
        if (selectedAnswer || !topic) return;

        const correctAnswer = topic.questions[currentQuestionIndex].correctAnswer;
        setSelectedAnswer(option);

        if (option === correctAnswer) {
            setScore(score + 1);
        }

        setTimeout(() => {
            const nextQuestion = currentQuestionIndex + 1;
            if (nextQuestion < topic.questions.length) {
                setCurrentQuestionIndex(nextQuestion);
            } else {
                setShowScore(true);
            }
            setSelectedAnswer(null);
        }, 1500);
    };

    const restartQuiz = () => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setShowScore(false);
        setSelectedAnswer(null);
    };

    const getButtonClass = (option: string) => {
        if (!topic) return '';
        if (!selectedAnswer) {
            return 'bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700';
        }
        const correctAnswer = topic.questions[currentQuestionIndex].correctAnswer;
        if (option === correctAnswer) {
            return 'bg-green-500 cursor-not-allowed';
        }
        if (option === selectedAnswer && option !== correctAnswer) {
            return 'bg-red-500 cursor-not-allowed';
        }
        return 'bg-gray-400 dark:bg-slate-600 cursor-not-allowed';
    };

    if (!topic) {
        return (
            <div className="text-center text-slate-500 dark:text-slate-400">
                Selecione um tópico para começar.
            </div>
        );
    }

    const getButtonIcon = () => {
        if (!isSpeaking) return 'fa-play';
        if (isPaused) return 'fa-play';
        return 'fa-pause';
    };

    const getButtonLabel = () => {
        if (!isSpeaking) return 'Ouvir Resumo';
        if (isPaused) return 'Continuar';
        return 'Pausar';
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4 text-primary-600 dark:text-primary-400">{topic.title}</h2>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-slate-700 pb-2 mb-3 dark:text-white">Resumo</h3>
                    <p className="text-justify whitespace-pre-line text-slate-700 dark:text-slate-300">{topic.summary}</p>
                </div>
                <div className="mt-6 flex items-center gap-4">
                    <button
                        onClick={handleSpeak}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                    >
                        <i className={`fas ${getButtonIcon()}`}></i>
                        <span>{getButtonLabel()}</span>
                    </button>
                    {isSpeaking && (
                        <button
                            onClick={handleStop}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                        >
                            <i className="fas fa-stop"></i>
                            <span>Parar</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-slate-700 pb-2 mb-3 dark:text-white">💡 Curiosidade</h3>
                    <p className="italic text-slate-700 dark:text-slate-300">{topic.curiosity}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-slate-700 pb-2 mb-4 dark:text-white">📝 Quiz de Revisão</h3>
                    {showScore ? (
                        <div className="text-center">
                            <h4 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Quiz Finalizado!</h4>
                            <p className="text-lg mb-6 text-slate-700 dark:text-slate-300">Você acertou {score} de {topic.questions.length} perguntas.</p>
                            <button
                                onClick={restartQuiz}
                                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                            >
                                Tentar Novamente
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-6">
                                <h4 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">Pergunta {currentQuestionIndex + 1}/{topic.questions.length}</h4>
                                <p className="text-slate-700 dark:text-slate-300">{topic.questions[currentQuestionIndex].question}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {topic.questions[currentQuestionIndex].options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswerOptionClick(option)}
                                        disabled={!!selectedAnswer}
                                        className={`w-full text-left p-4 rounded-lg text-white transition-colors duration-300 ${getButtonClass(option)}`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentDisplay;
