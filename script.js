// configuration
const config = {
    initialSSD: 500,
    stepSSD: 50,
    maxSSD: 1000,
    minSSD: 100,
    goDuration: {
        simple: 700,   
        complex: 900,   
        practice: 700   
    },
    stopSignalDuration: 200,
    interTrialInterval: {
        min: 1000,
        max: 2000
    },
    stopRatio: 0.25,
    trialsPerTask: 200
};

// Task  mappings
const tasks = {
    simple: {
        stimuli: {
            circle: "⬤",
            arrow: "↑"
        },
        keys: {
            circle: "s",
            arrow: "k"
        },
        reminder: " ⬤ - S |  ↑ - K"
    },
    complex: {
        stimuli: {
            triangle: "▲",
            square: "■",
            hash: "#",
            star: "★"
        },
        keys: {
            triangle: "s",
            square: "a",
            hash: "k",
            star: "l"
        },
        reminder: "  ■ - A | ▲ - S | # - K | ★ - L"
    }
};

// Instructions 
const instructions = {
    welcome: `
    In the upcoming experiment, you will be exposed to different shapes and will be instructed to respond using different keys.
    The experiment takes approximately 10-12 minutes. While you may exit the experiment at any time by closing the window, 
    you must complete the entire experiment to receive payment.
    
    Press SPACE to continue.
    `,
    
    practice: `
    Practice Session
    
    In this practice session, you will learn how to perform the task.
    
    When you see an UP ARROW (↑), press the SPACE key.
    If you see a red X appear, try to stop yourself from pressing any key.
    
    Press SPACE to start the practice.
    `,
    
    practiceComplete: `
    Practice session completed!
    
    %FEEDBACK%
    
    Press SPACE to continue to the real experiment.
    `,
    
    consent: `
    Informed Consent Form
    [Your consent form content here]
    
    Press SPACE to continue if you agree to participate.
    `,
    
    simpleTask: `
    In the following task, different shapes will appear on the screen.
    
    When a circle (⬤) appears, press the S key
    When an up arrow (↑) appears, press the K key
    
    If an X appears on the screen, you must stop and not press any key until the next symbol appears.
    
    Try to respond as accurately and quickly as possible. Your performance will be measured based on both 
    response accuracy and reaction time.
    
    Press SPACE to begin.
    `,
    
    break: `
    You have completed the first part of the experiment. 
    Continue to the second part when you feel ready.
    
    Press SPACE to continue.
    `,
    
    complexTask: `
    Now, you will be exposed to additional shapes.
    
    When a triangle (▲) appears, press the S key
    When a square (■) appears, press the A key
    When a hash (#) appears, press the K key
    When a star (★) appears, press the L key
    
    Again, if an X appears on the screen, you must stop and not press any key until the next symbol appears.
    
    Try to respond as accurately and quickly as possible. Your performance will be measured based on both 
    response accuracy and reaction time.
    
    Press SPACE to begin.
    `,
    
    completed: `
    The experiment is now complete. Thank you for your participation!
    `
};

class ExperimentManager {
    constructor() {
        this.stimulusContainer = document.getElementById("stimulus-container");
        this.instructions = document.getElementById("instructions");
        this.keyReminder = document.getElementById("key-reminder");
        this.currentPhase = 'welcome';
        this.demographicForm = document.getElementById('demographic-form');
        this.startButton = document.getElementById('start-experiment');
        this.participantData = null;
        
        // Experiment state
        this.currentTask = null;
        this.currentSSD = config.initialSSD;
        this.results = [];
        this.trialIndex = 0;
        this.stopTrials = null;
        this.isWaitingForResponse = false;
        

        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleInstructionKeyPress = this.handleInstructionKeyPress.bind(this);
        this.startButton.addEventListener('click', () => this.handleDemographicSubmit());
    }

    handleDemographicSubmit() {
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const hand = document.getElementById('hand').value;
    
        if (!age || !gender || !hand) {
            alert('Please fill in all fields');
            return;
        }
    
        this.participantData = {
            age: parseInt(age),
            gender,
            hand,
            timestamp: new Date().toISOString()
        };
    
        this.demographicForm.style.display = 'none';
        this.startExperiment();
    }

    clearInstructions() {
        this.instructions.style.display = 'none';
        this.stimulusContainer.style.marginTop = '0';
    }

    showInstructionsElement() {
        this.instructions.style.display = 'block';
        this.stimulusContainer.style.marginTop = '2em';
    }

    updateKeyReminder() {
        if (this.currentTask) {
            this.keyReminder.style.display = 'block';
            this.keyReminder.textContent = tasks[this.currentTask].reminder;
        } else {
            this.keyReminder.style.display = 'none';
        }
    }

    handleInstructionKeyPress(event) {
        if (event.code === 'Space' && this.resolveInstruction) {
            this.resolveInstruction();
        } else if (event.code === 'Escape') {
            this.endExperiment();
        } else if (event.code === 'Tab') {
            event.preventDefault();
            if (this.skipBlock) {
                this.skipBlock();
            }
        }
    }

    handleKeyPress(event) {
        if (!this.isWaitingForResponse) return;
        
        const key = event.key.toLowerCase();
        const code = event.code.toLowerCase();
        
        const validKeys = this.currentTask === "simple" ? 
            {
                's': ['keys', 'keyש'],
                'k': ['keyk', 'keyק']
            } : 
            {
                's': ['keys', 'keyש'],
                'a': ['keya', 'keyש'],
                'k': ['keyk', 'keyק'],
                'l': ['keyl', 'keyל']
            };
        
        let pressedKey = null;
        for (const [targetKey, possibleCodes] of Object.entries(validKeys)) {
            if (key === targetKey || possibleCodes.includes(code)) {
                pressedKey = targetKey;
                break;
            }
        }

        if (pressedKey && this.currentResolve) {
            this.currentResolve({ key: pressedKey, time: Date.now() });
            this.currentResolve = null;
            this.isWaitingForResponse = false;
        }
    }

    async showInstructions(phase) {
        this.showInstructionsElement();
        this.currentPhase = phase;
        this.instructions.textContent = instructions[phase];
        
        if (phase === 'completed') {
            return Promise.resolve();
        }
        
        return new Promise(resolve => {
            this.resolveInstruction = () => {
                document.removeEventListener('keydown', this.handleInstructionKeyPress);
                this.resolveInstruction = null;
                this.clearInstructions();
                resolve();
            };
            document.addEventListener('keydown', this.handleInstructionKeyPress);
        });
    }

    generateStopTrials() {
        const numStopTrials = Math.floor(config.trialsPerTask * config.stopRatio);
        const numGoTrials = config.trialsPerTask - numStopTrials;
        
        const trials = [
            ...Array(numStopTrials).fill(true),
            ...Array(numGoTrials).fill(false)
        ];
        
        
        for (let i = trials.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [trials[i], trials[j]] = [trials[j], trials[i]];
        }
        
        return trials;
    }

    selectRandomStimulus(stimuli) {
        const stimulusTypes = Object.keys(stimuli);
        return stimulusTypes[Math.floor(Math.random() * stimulusTypes.length)];
    }

    async endExperiment() {
        console.log("Experiment ended");
        this.showInstructionsElement();
        this.instructions.textContent = "Experiment ended. Thank you for your participation.";
        
        try {
            const participantData = {
                participantId: Date.now().toString(),
                demographic: this.participantData,
                results: this.results
            };
            
            const response = await fetch('/api/save-results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(participantData)
            });
    
            if (!response.ok) {
                throw new Error('Failed to save results');
            }
    
            const result = await response.json();
            console.log('Results saved successfully', result);
        } catch (error) {
            console.error('Failed to save results:', error);
        }
    
        if (this.cleanup) {
            this.cleanup();
        }
    }

    async runTrial() {
        this.stimulusContainer.style.display = 'block';
        const taskConfig = tasks[this.currentTask];
        const stimulusType = this.selectRandomStimulus(taskConfig.stimuli);
        const isStopTrial = this.stopTrials[this.trialIndex];
        
        this.clearInstructions();
        this.updateKeyReminder();
        
        this.stimulusContainer.setAttribute('data-symbol', taskConfig.stimuli[stimulusType]);
        this.stimulusContainer.textContent = taskConfig.stimuli[stimulusType];
        const trialStartTime = Date.now();
        
        this.isWaitingForResponse = true;
        let responseTime = null;
        let correct = false;

        document.addEventListener("keydown", this.handleKeyPress);

        const responsePromise = new Promise(resolve => {
            this.currentResolve = resolve;
        });

        try {
            if (isStopTrial) {
                setTimeout(() => {
                    if (this.isWaitingForResponse) {
                        this.stimulusContainer.textContent = "X";
                        this.stimulusContainer.style.color = "red";
                    }
                }, this.currentSSD);
            
                const result = await Promise.race([
                    responsePromise,
                    new Promise(resolve => setTimeout(() => resolve(null), config.goDuration[this.currentTask]))
                ]);
            
                if (!result) {
                    correct = true;
                    this.currentSSD = Math.min(config.maxSSD, this.currentSSD + config.stepSSD);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    correct = false;
                    this.currentSSD = Math.max(config.minSSD, this.currentSSD - config.stepSSD);
                    responseTime = result.time - trialStartTime;
                    
                    // מציג X אדום לזמן ארוך יותר
                    this.stimulusContainer.textContent = "X";
                    this.stimulusContainer.style.color = "red";
                    // נמתין 1000ms נוספות להצגת ה-X
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } else {
                const result = await Promise.race([
                    responsePromise,
                    new Promise(resolve => setTimeout(() => resolve(null), config.goDuration[this.currentTask]))
                ]);

                if (result) {
                    responseTime = result.time - trialStartTime;
                    correct = result.key === taskConfig.keys[stimulusType];
                }
            }
        } finally {
            document.removeEventListener("keydown", this.handleKeyPress);
            this.isWaitingForResponse = false;
        }

        this.results.push({
            taskType: this.currentTask,
            stimulusType,
            stopTrial: isStopTrial,
            responseTime,
            correct,
            ssd: this.currentSSD
        });

        this.stimulusContainer.style.color = "black";
        this.stimulusContainer.textContent = "";

        await new Promise(resolve => 
            setTimeout(resolve, 
                Math.random() * (config.interTrialInterval.max - config.interTrialInterval.min) 
                + config.interTrialInterval.min
            )
        );
    }

async start() {
    this.demographicForm.style.display = 'flex';
}

async startExperiment() {
    try {
       
        await this.showInstructions('welcome');
        //await this.showInstructions('consent');
        
        await this.runPracticeTrials();

        // Simple task
        await this.showInstructions('simpleTask');
        this.currentTask = "simple";
        this.currentSSD = config.initialSSD;
        this.stopTrials = this.generateStopTrials();
        
        this.skipBlock = () => {
            this.trialIndex = config.trialsPerTask;
            this.skipBlock = null;
        };
        
        for (this.trialIndex = 0; this.trialIndex < config.trialsPerTask; this.trialIndex++) {
            if (this.trialIndex >= config.trialsPerTask) break;
            await this.runTrial();
        }
        

        this.keyReminder.style.display = 'none';
        await this.showInstructions('break');
        
        // Complex task
        await this.showInstructions('complexTask');
        this.currentTask = "complex";
        this.currentSSD = config.initialSSD;
        this.stopTrials = this.generateStopTrials();
        
        this.skipBlock = () => {
            this.trialIndex = config.trialsPerTask;
            this.skipBlock = null;
            this.endExperiment();
        };
        
        for (this.trialIndex = 0; this.trialIndex < config.trialsPerTask; this.trialIndex++) {
            if (this.trialIndex >= config.trialsPerTask) break;
            await this.runTrial();
        }
        
        this.keyReminder.style.display = 'none';
        await this.showInstructions('completed');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.endExperiment();
        
    } catch (error) {
        console.error("Error during experiment:", error);
        this.endExperiment();
    }
}

async runPracticeTrials() {
    await this.showInstructions('practice');
    
    console.log("Starting practice trials...");
    const practiceTrials = 10;
    const numStopTrials = 4;
    
    let trials = Array(practiceTrials).fill(false);
    let stopTrialIndices = [];
    while (stopTrialIndices.length < numStopTrials) {
        const randomIndex = Math.floor(Math.random() * practiceTrials);
        if (!stopTrialIndices.includes(randomIndex)) {
            stopTrialIndices.push(randomIndex);
            trials[randomIndex] = true;
        }
    }
    
    let totalGoTrials = practiceTrials - numStopTrials;
    let correctResponses = 0;
    let successfulStops = 0;
    
    this.currentSSD = config.initialSSD;

    for (let i = 0; i < practiceTrials; i++) {
        const isStopTrial = trials[i];
        const currentTrialSSD = this.currentSSD; 
        
        this.stimulusContainer.style.display = 'block';
        this.stimulusContainer.textContent = "↑";
        this.stimulusContainer.style.color = "black";
        const trialStartTime = Date.now();
        
        this.isWaitingForResponse = true;
        let responseReceived = false;

        const responsePromise = new Promise(resolve => {
            this.currentResolve = resolve;

            const handleSpace = (event) => {
                if (event.code === 'Space' && this.isWaitingForResponse) {
                    responseReceived = true;
                    resolve({ time: Date.now() });
                }
            };
            document.addEventListener('keydown', handleSpace);

            // ניקוי אוטומטי של ה-event listener
            setTimeout(() => {
                document.removeEventListener('keydown', handleSpace);
            }, config.goDuration.practice);
        });

        try {
            if (isStopTrial) {
                setTimeout(() => {
                    if (this.isWaitingForResponse) {
                        this.stimulusContainer.textContent = "X";
                        this.stimulusContainer.style.color = "red";
                    }
                }, currentTrialSSD);
            
                const result = await Promise.race([
                    responsePromise,
                    new Promise(resolve => setTimeout(() => resolve(null), config.goDuration.practice))
                ]);
            
                if (!result) {
                    successfulStops++;
                    this.currentSSD = Math.min(config.maxSSD, this.currentSSD + config.stepSSD);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    // הנבדק לחץ כשלא היה צריך
                    this.currentSSD = Math.max(config.minSSD, this.currentSSD - config.stepSSD);
                    // מציג X אדום לזמן ארוך יותר
                    this.stimulusContainer.textContent = "X";
                    this.stimulusContainer.style.color = "red";
                    // נמתין 1000ms נוספות להצגת ה-X
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } else {
                const result = await Promise.race([
                    responsePromise,
                    new Promise(resolve => setTimeout(() => resolve(null), config.goDuration.practice))
                ]);

                if (result) {
                    correctResponses++;
                }
            }
        } finally {
            this.isWaitingForResponse = false;
            this.stimulusContainer.style.color = "black";
            this.stimulusContainer.textContent = "";
        }

        // המתנה בין ניסיונות
        await new Promise(resolve => 
            setTimeout(resolve, 
                Math.random() * (config.interTrialInterval.max - config.interTrialInterval.min) 
                + config.interTrialInterval.min
            )
        );
    }

    this.stimulusContainer.style.display = 'none';

    const feedbackText = `
    Your performance:
    - You correctly pressed SPACE ${correctResponses} times out of ${totalGoTrials} opportunities
    - You successfully stopped ${successfulStops} times out of ${numStopTrials} stop signals
    `;
    
    this.instructions.textContent = instructions.practiceComplete.replace('%FEEDBACK%', feedbackText);
    this.showInstructionsElement();
    
    return new Promise(resolve => {
        const handler = (event) => {
            if (event.code === 'Space') {
                document.removeEventListener('keydown', handler);
                this.clearInstructions();
                resolve();
            }
        };
        document.addEventListener('keydown', handler);
    });
}

cleanup() {
    document.removeEventListener('keydown', this.handleInstructionKeyPress);
    document.removeEventListener('keydown', this.handleKeyPress);
}
}

window.addEventListener('load', () => {
const experiment = new ExperimentManager();
experiment.start();
});