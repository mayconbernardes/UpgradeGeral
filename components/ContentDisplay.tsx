import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Topic, TopicGroup } from '../types';

interface ContentDisplayProps {
  topic: Topic | null;
  onPrevTopic: () => void;
  onNextTopic: () => void;
  hasPrevTopic: boolean;
  hasNextTopic: boolean;
  groups: TopicGroup[];
  onSelectTopic: (topic: Topic) => void;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ topic, onPrevTopic, onNextTopic, hasPrevTopic, hasNextTopic, groups, onSelectTopic }) => {
    // TTS State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [highlightedWord, setHighlightedWord] = useState<{ start: number, end: number } | null>(null);


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
    
    // Font State
    const [selectedFont, setSelectedFont] = useState<string>(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            return localStorage.getItem('preferredFont') || 'font-sans';
        }
        return 'font-sans';
    });

    const fontOptions = [
        { name: 'Inter', class: 'font-sans' },
        { name: 'Roboto', class: 'font-roboto' },
        { name: 'Open Sans', class: 'font-open-sans' },
    ];

    const fontSizes = [
        { name: 'Pequena', class: 'text-sm' },
        { name: 'Normal', class: 'text-base' },
        { name: 'Grande', class: 'text-lg' },
        { name: 'Extra Grande', class: 'text-xl' },
    ];

    const [fontSize, setFontSize] = useState<string>(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            return localStorage.getItem('preferredFontSize') || 'text-base';
        }
        return 'text-base';
    });

    // Pre-process summary text to get words and their indices for reliable highlighting
    const words = useMemo(() => {
        if (!topic?.summary) return [];
        const wordList: { text: string; index: number }[] = [];
        // This regex finds sequences of non-whitespace characters
        const regex = /\S+/g;
        let match;
        while ((match = regex.exec(topic.summary)) !== null) {
            wordList.push({
                text: match[0],
                index: match.index,
            });
        }
        return wordList;
    }, [topic?.summary]);

    const cleanupSpeech = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setIsPaused(false);
        setHighlightedWord(null);
    };

    // Effect to cleanup speech on component unmount
    useEffect(() => {
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Effect to save font choice
    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('preferredFont', selectedFont);
        }
    }, [selectedFont]);
    
    // Effect to save font size choice
    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('preferredFontSize', fontSize);
        }
    }, [fontSize]);

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
            newUtterance.onboundary = (event) => {
                if (!words.length) return;
                
                // Find the word that contains the current character index from the event.
                const currentWord = words.find(word => 
                    event.charIndex >= word.index && 
                    event.charIndex < (word.index + word.text.length)
                );

                if (currentWord) {
                    setHighlightedWord({
                        start: currentWord.index,
                        end: currentWord.index + currentWord.text.length,
                    });
                }
            };
            newUtterance.onend = () => {
                setIsSpeaking(false);
                setIsPaused(false);
                setHighlightedWord(null);
            };
            newUtterance.onerror = (e: SpeechSynthesisErrorEvent) => {
                console.error("Speech Synthesis Error:", e.error);
                setIsSpeaking(false);
                setIsPaused(false);
                setHighlightedWord(null);
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
            return 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300';
        }
        const correctAnswer = topic.questions[currentQuestionIndex].correctAnswer;
        if (option === correctAnswer) {
            return 'bg-green-500 border-green-500 text-white cursor-not-allowed';
        }
        if (option === selectedAnswer && option !== correctAnswer) {
            return 'bg-red-500 border-red-500 text-white cursor-not-allowed';
        }
        return 'bg-slate-200 dark:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed';
    };

     const relatedTopics = useMemo(() => {
        if (!topic || !groups) return [];
        
        const currentGroup = groups.find(group => group.topics.some(t => t.id === topic.id));
        if (!currentGroup) return [];

        return currentGroup.topics.filter(t => t.id !== topic.id);
    }, [topic, groups]);

    if (!topic) {
        return (
            <div className="text-center text-slate-500 dark:text-slate-400">
                Selecione um tópico para começar.
            </div>
        );
    }
    
    const currentFontSizeIndex = fontSizes.findIndex(s => s.class === fontSize);
    const handleDecreaseFontSize = () => {
        if (currentFontSizeIndex > 0) {
            setFontSize(fontSizes[currentFontSizeIndex - 1].class);
        }
    };
    const handleIncreaseFontSize = () => {
        if (currentFontSizeIndex < fontSizes.length - 1) {
            setFontSize(fontSizes[currentFontSizeIndex + 1].class);
        }
    };


    const getButtonIcon = () => {
        if (!isSpeaking) return 'fa-play';
        if (isPaused) return 'fa-play';
        return 'fa-pause';
    };

    const getButtonLabel = () => {
        if (!isSpeaking) return 'Ouvir';
        if (isPaused) return 'Continuar';
        return 'Pausar';
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <article className="bg-white dark:bg-slate-900 shadow-sm rounded-xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">
                <h2 className="text-3xl font-extrabold mb-4 text-slate-900 dark:text-white tracking-tight">{topic.title}</h2>
                <div className={`prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 ${selectedFont}`}>
                    <div className="flex flex-wrap justify-between items-center gap-y-4 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                       <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 !mb-0">Resumo</h3>
                       <div className="flex items-center gap-3">
                            <div className="relative">
                                <select 
                                    id="font-selector"
                                    value={selectedFont} 
                                    onChange={(e) => setSelectedFont(e.target.value)}
                                    className="text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1 pl-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
                                    aria-label="Selecionar fonte do resumo"
                                >
                                    {fontOptions.map(font => (
                                        <option key={font.class} value={font.class}>{font.name}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400">
                                    <i className="fas fa-chevron-down text-xs"></i>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-600 p-0.5">
                                <button
                                    onClick={handleDecreaseFontSize}
                                    disabled={currentFontSizeIndex === 0}
                                    className="px-2 py-0.5 rounded disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    aria-label="Diminuir tamanho da fonte"
                                >
                                    <span className="text-xs font-bold">A-</span>
                                </button>
                                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                                <button
                                    onClick={handleIncreaseFontSize}
                                    disabled={currentFontSizeIndex === fontSizes.length - 1}
                                    className="px-2 py-0.5 rounded disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    aria-label="Aumentar tamanho da fonte"
                                >
                                    <span className="text-base font-bold">A+</span>
                                </button>
                            </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={handleSpeak}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 text-sm font-semibold"
                        >
                            <i className={`fas ${getButtonIcon()}`}></i>
                            <span>{getButtonLabel()}</span>
                        </button>
                        {isSpeaking && (
                            <button
                                onClick={handleStop}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 text-sm font-semibold"
                            >
                                <i className="fas fa-stop"></i>
                                <span>Parar</span>
                            </button>
                        )}
                    </div>

                    <p className={`text-justify whitespace-pre-line leading-relaxed ${fontSize}`}>
                        {!highlightedWord ? topic.summary : (
                            <>
                                {topic.summary.substring(0, highlightedWord.start)}
                                <mark className="bg-primary-200 dark:bg-primary-700/50 rounded transition-all duration-100">
                                    {topic.summary.substring(highlightedWord.start, highlightedWord.end)}
                                </mark>
                                {topic.summary.substring(highlightedWord.end)}
                            </>
                        )}
                    </p>
                </div>
            </article>

            <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-slate-800 dark:text-slate-200">💡 Curiosidade</h3>
                    <blockquote className="italic text-slate-600 dark:text-slate-400 border-l-4 border-primary-400 pl-4">
                        <p>{topic.curiosity}</p>
                    </blockquote>
                </div>
            </div>
            
            {topic.timeline && topic.timeline.length > 0 && (
                 <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">
                     <div className="prose prose-slate dark:prose-invert max-w-none">
                        <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-700 pb-2 mb-8 text-slate-800 dark:text-slate-200">🗓️ Linha do Tempo</h3>
                        <div className="relative">
                             {/* The vertical line */}
                            <div className="absolute left-0 md:left-1/2 w-0.5 h-full bg-slate-200 dark:bg-slate-700 -translate-x-1/2"></div>
                            
                            {topic.timeline.map((event, index) => (
                                <div key={index} className="relative mb-8 last:mb-0">
                                     {/* The circle on the line */}
                                    <div className="absolute left-0 md:left-1/2 w-4 h-4 bg-primary-500 rounded-full -translate-x-1/2 mt-1 border-4 border-white dark:border-slate-900"></div>
                                    
                                    {/* The content card */}
                                    <div className={`
                                        pl-8 md:pl-0 
                                        md:w-1/2 
                                        ${index % 2 === 0 ? 'md:pr-8 md:text-right md:ml-0' : 'md:pl-8 md:ml-[50%] md:text-left'}
                                    `}>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 inline-block w-full">
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

            <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-slate-800 dark:text-slate-200">🃏 Flashcards de Estudo</h3>
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
                                    <div className="absolute w-full h-full p-4 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 [backface-visibility:hidden]">
                                        <div>
                                            <p className="text-sm font-semibold text-primary-500 dark:text-primary-400 mb-2 uppercase tracking-wider">Pergunta</p>
                                            <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                                                {flashcards[currentCardIndex].question}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Back Side */}
                                    <div className="absolute w-full h-full p-4 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                                         <div>
                                            <p className="text-sm font-semibold text-green-500 dark:text-green-400 mb-2 uppercase tracking-wider">Resposta</p>
                                            <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                                                {flashcards[currentCardIndex].answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePrevCard}
                                        disabled={currentCardIndex === 0}
                                        className="p-2 w-10 h-10 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Card anterior"
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                                        {currentCardIndex + 1} / {flashcards.length}
                                    </span>
                                    <button
                                        onClick={handleNextCard}
                                        disabled={currentCardIndex >= flashcards.length - 1}
                                        className="p-2 w-10 h-10 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Próximo card"
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                                <button
                                    onClick={handleMarkCard}
                                    className={`p-2 w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${markedCards.has(currentCardIndex) ? 'text-yellow-500' : 'text-slate-400 dark:text-slate-500'}`}
                                    aria-label="Marcar card para revisão"
                                >
                                    <i className={`fas fa-star ${markedCards.has(currentCardIndex) ? 'text-yellow-400' : ''}`}></i>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400">Este tópico não possui flashcards.</p>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-slate-800 dark:text-slate-200">📝 Quiz de Revisão</h3>
                    {showScore ? (
                        <div className="text-center">
                            <p className="text-lg text-slate-700 dark:text-slate-300 mb-2">
                                Sua pontuação final:
                            </p>
                            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-6">
                                {score} de {topic.questions.length}
                            </p>
                            <button
                                onClick={restartQuiz}
                                className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Tentar Novamente
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-1">
                                Pergunta {currentQuestionIndex + 1}/{topic.questions.length}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                {topic.questions[currentQuestionIndex].question}
                            </p>
                            <div className="space-y-3">
                                {topic.questions[currentQuestionIndex].options.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handleAnswerOptionClick(option)}
                                        disabled={!!selectedAnswer}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-300 font-medium ${getButtonClass(option)}`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {topic.sources && topic.sources.length > 0 && (
                <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-slate-800 dark:text-slate-200">📚 Fontes e Referências</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            {topic.sources.map((source, index) => (
                                <li key={index}>
                                    <a 
                                        href={source.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary-600 dark:text-primary-400 hover:underline"
                                    >
                                        {source.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {relatedTopics.length > 0 && (
                <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-slate-800 dark:text-slate-200">Tópicos Relacionados</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {relatedTopics.map(relatedTopic => (
                                <button
                                    key={relatedTopic.id}
                                    onClick={() => onSelectTopic(relatedTopic)}
                                    className="w-full text-left p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all"
                                >
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{relatedTopic.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mt-8">
                <button
                    onClick={onPrevTopic}
                    disabled={!hasPrevTopic}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <i className="fas fa-arrow-left"></i>
                    Anterior
                </button>
                <button
                    onClick={onNextTopic}
                    disabled={!hasNextTopic}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Próximo
                    <i className="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    );
};

export default ContentDisplay;
