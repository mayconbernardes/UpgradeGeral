import React, { useState, useEffect, useRef } from 'react';
import type { Topic } from '../types';

interface ContentDisplayProps {
  topic: Topic | null;
  onPrevTopic: () => void;
  onNextTopic: () => void;
  hasPrevTopic: boolean;
  hasNextTopic: boolean;
}

const TimelineItem: React.FC<{ event: { date: string; description: string }; isLeft: boolean }> = ({ event, isLeft }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                root: null,
                rootMargin: '0px',
                threshold: 0.5,
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    const desktopClasses = isLeft
        ? 'md:text-right md:pr-8'
        : 'md:col-start-3 md:pl-8';

    const animationClasses = isVisible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-4';

    const mobileAnimationClasses = isVisible
        ? 'opacity-100 translate-x-0'
        : 'opacity-0 -translate-x-4'

    return (
        <>
            {/* Desktop view */}
            <div ref={ref} className={`hidden md:block col-start-2 row-start-${event.date.replace(/\s/g, '-')}`}></div>
            <div className={`hidden md:block ${desktopClasses} transition-all duration-700 ease-out ${animationClasses}`}>
                 <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow-md border border-gray-200 dark:border-slate-600">
                    <p className="font-bold text-primary-600 dark:text-primary-400">{event.date}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{event.description}</p>
                </div>
            </div>

            {/* Mobile view */}
             <div ref={!ref.current ? ref : null} className={`md:hidden col-start-2 transition-all duration-700 ease-out ${mobileAnimationClasses}`}>
                 <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow-md border border-gray-200 dark:border-slate-600 ml-4">
                    <p className="font-bold text-primary-600 dark:text-primary-400">{event.date}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{event.description}</p>
                </div>
            </div>
        </>
    );
};


const ContentDisplay: React.FC<ContentDisplayProps> = ({ topic, onPrevTopic, onNextTopic, hasPrevTopic, hasNextTopic }) => {
    // TTS State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Quiz State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    
    // Flashcard State
    const [flashcards, setFlashcards] = useState<{ question: string; answer: string }[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [markedCards, setMarkedCards] = useState<Set<number>>(new Set());

    const cleanupSpeech = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setIsPaused(false);
    };
    
    // Effect to reset TTS, Quiz, and Flashcards when topic changes
    useEffect(() => {
        cleanupSpeech();

        // Reset Quiz
        setCurrentQuestionIndex(0);
        setScore(0);
        setShowScore(false);
        setSelectedAnswer(null);
        
        // Reset Flashcards
        if (topic && topic.questions.length > 0) {
            const newFlashcards = topic.questions.map(q => ({
                question: q.question,
                answer: q.correctAnswer,
            }));
            setFlashcards(newFlashcards);
        } else {
            setFlashcards([]);
        }
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setMarkedCards(new Set());

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
    
    // Flashcard Handlers
    const handlePrevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(currentCardIndex - 1);
            setIsFlipped(false);
        }
    };

    const handleNextCard = () => {
        if (currentCardIndex < flashcards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
            setIsFlipped(false);
        }
    };

    const handleMarkCard = () => {
        setMarkedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(currentCardIndex)) {
                newSet.delete(currentCardIndex);
            } else {
                newSet.add(currentCardIndex);
            }
            return newSet;
        });
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
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-slate-700 pb-2 mb-3">Resumo</h3>
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
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-slate-700 pb-2 mb-3">💡 Curiosidade</h3>
                    <p className="italic text-slate-700 dark:text-slate-300">{topic.curiosity}</p>
                </div>
            </div>
            
            {topic.timeline && topic.timeline.length > 0 && (
                 <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
                     <div className="prose prose-slate dark:prose-invert max-w-none">
                        <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-slate-700 pb-2 mb-6">🗓️ Linha do Tempo</h3>
                        <div className="relative">
                             {/* The vertical line */}
                            <div className="absolute left-0 md:left-1/2 w-0.5 h-full bg-gray-200 dark:bg-slate-700 -translate-x-1/2"></div>
                            
                            {topic.timeline.map((event, index) => (
                                <div key={index} className="relative mb-8 last:mb-0">
                                     {/* The circle on the line */}
                                    <div className="absolute left-0 md:left-1/2 w-4 h-4 bg-primary-500 rounded-full -translate-x-1/2 mt-1 border-4 border-white dark:border-slate-800"></div>
                                    
                                    {/* The content card */}
                                    <div className={`
                                        pl-8 md:pl-0 
                                        md:w-1/2 
                                        ${index % 2 === 0 ? 'md:pr-8 md:text-right md:ml-0' : 'md:pl-8 md:ml-[50%] md:text-left'}
                                    `}>
                                        <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg shadow-md border border-gray-200 dark:border-slate-600 inline-block w-full">
                                            <p className="font-bold text-primary-600 dark:text-primary-400">{event.date}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">{event.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-slate-700 pb-2 mb-4">🃏 Flashcards de Estudo</h3>
                    {flashcards.length > 0 ? (
                        <div>
                             <div 
                                className="w-full h-64 mb-4 cursor-pointer [perspective:1000px]"
                                onClick={() => setIsFlipped(!isFlipped)}
                                role="button"
                                tabIndex={0}
                                aria-label="Virar card"
                            >
                                <div 
                                    className={`relative w-full h-full text-center transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                                >
                                    {/* Front Side */}
                                    <div className="absolute w-full h-full p-4 rounded-lg flex items-center justify-center bg-primary-100 dark:bg-slate-700 [backface-visibility:hidden]">
                                        <div>
                                            <p className="text-sm font-semibold text-primary-500 dark:text-primary-400 mb-2">Pergunta</p>
                                            <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                                                {flashcards[currentCardIndex].question}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Back Side */}
                                    <div className="absolute w-full h-full p-4 rounded-lg flex items-center justify-center bg-green-100 dark:bg-slate-600 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                                         <div>
                                            <p className="text-sm font-semibold text-green-500 dark:text-green-400 mb-2">Resposta</p>
                                            <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                                                {flashcards[currentCardIndex].answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handlePrevCard}
                                        disabled={currentCardIndex === 0}
                                        className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Card anterior"
                                    >
                                        <i className="fas fa-chevron-left w-5 h-5"></i>
                                    </button>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        {currentCardIndex + 1} / {flashcards.length}
                                    </span>
                                    <button
                                        onClick={handleNextCard}
                                        disabled={currentCardIndex >= flashcards.length - 1}
                                        className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Próximo card"
                                    >
                                        <i className="fas fa-chevron-right w-5 h-5"></i>
                                    </button>
                                </div>

                                <button
                                    onClick={handleMarkCard}
                                    className="flex items-center gap-2 px-4 py-2 bg-transparent text-amber-500 border border-amber-500 rounded-md hover:bg-amber-500 hover:text-white dark:hover:text-slate-900 transition-colors"
                                >
                                    <i className={`${markedCards.has(currentCardIndex) ? 'fas' : 'far'} fa-star`}></i>
                                    <span>{markedCards.has(currentCardIndex) ? 'Marcado' : 'Marcar'}</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-600 dark:text-slate-400">Este tópico não possui perguntas para flashcards.</p>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-slate-700 pb-2 mb-4">📝 Quiz de Revisão</h3>
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

            {/* Topic Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                <button
                    onClick={onPrevTopic}
                    disabled={!hasPrevTopic}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4 sm:mb-0"
                >
                    <i className="fas fa-arrow-left"></i>
                    <span>Tópico Anterior</span>
                </button>
                <button
                    onClick={onNextTopic}
                    disabled={!hasNextTopic}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span>Tópico Seguinte</span>
                    <i className="fas fa-arrow-right"></i>
                </button>
            </div>

        </div>
    );
};

export default ContentDisplay;