// Experiment configuration
const config = {
    initialSSD: 500,
    stepSSD: 50,
    maxSSD: 1000,
    minSSD: 100,
    goDuration: 1500,
    stopSignalDuration: 200,
    interTrialInterval: {
        min: 1000,
        max: 2000
    },
    stopRatio: 0.25,
    trialsPerTask: 100
};

// Task stimuli and mappings
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
        reminder: " ▲ - S |  ■ - A | # - K | ★ - L"
    }
};

// Instructions object
const instructions = {
    welcome: `
    In the upcoming experiment, you will be exposed to different shapes and will be instructed to respond using different keys.
    The experiment takes approximately 10-12 minutes. While you may exit the experiment at any time by closing the window, 
    you must complete the entire experiment to receive payment.
    
    Press SPACE to continue.
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
        
        // Experiment state
        this.currentTask = null;
        this.currentSSD = config.initialSSD;
        this.results = [];
        this.trialIndex = 0;
        this.stopTrials = null;
        this.isWaitingForResponse = false;
        
        // Bind methods
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleInstructionKeyPress = this.handleInstructionKeyPress.bind(this);
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
        }
    }

    handleKeyPress(event) {
        if (!this.isWaitingForResponse) return;
        
        // Get both the key and the code of the pressed key
        const key = event.key.toLowerCase();
        const code = event.code.toLowerCase();
        
        // Valid keys for each task (both English and Hebrew layout will work)
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
        
        // Check if the pressed key matches any of our valid keys
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
        
        // אם זה מסך הסיום, המשך אוטומטית
        if (phase === 'completed') {
            return Promise.resolve();
        }
        
        // אחרת, חכה ללחיצת מקש רווח
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
        
        // Fisher-Yates shuffle
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
        
        // שמירת התוצאות
        try {
            const participantData = {
                participantId: Date.now().toString(),
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
        const taskConfig = tasks[this.currentTask];
        const stimulusType = this.selectRandomStimulus(taskConfig.stimuli);
        const isStopTrial = this.stopTrials[this.trialIndex];
        
        // Ensure instructions are hidden during trial
        this.clearInstructions();
        this.updateKeyReminder();
        
        // Set data attribute for specific styling
        this.stimulusContainer.setAttribute('data-symbol', taskConfig.stimuli[stimulusType]);
        
        // Display stimulus
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
                    new Promise(resolve => setTimeout(() => resolve(null), config.goDuration))
                ]);

                if (!result) {
                    correct = true;
                    this.currentSSD = Math.min(config.maxSSD, this.currentSSD + config.stepSSD);
                } else {
                    correct = false;
                    this.currentSSD = Math.max(config.minSSD, this.currentSSD - config.stepSSD);
                    responseTime = result.time - trialStartTime;
                }
            } else {
                const result = await Promise.race([
                    responsePromise,
                    new Promise(resolve => setTimeout(() => resolve(null), config.goDuration))
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

        // Save trial results
        this.results.push({
            taskType: this.currentTask,
            stimulusType,
            stopTrial: isStopTrial,
            responseTime,
            correct,
            ssd: this.currentSSD
        });

        // Reset stimulus display
        this.stimulusContainer.style.color = "black";
        this.stimulusContainer.textContent = "";

        // Wait for inter-trial interval
        await new Promise(resolve => 
            setTimeout(resolve, 
                Math.random() * (config.interTrialInterval.max - config.interTrialInterval.min) 
                + config.interTrialInterval.min
            )
        );
    }

    async start() {
        try {
            // Welcome and consent
            await this.showInstructions('welcome');
            
            // Simple task
            await this.showInstructions('simpleTask');
            this.currentTask = "simple";
            this.stopTrials = this.generateStopTrials();
            for (this.trialIndex = 0; this.trialIndex < config.trialsPerTask; this.trialIndex++) {
                await this.runTrial();
            }
            
            // Break between tasks
            this.keyReminder.style.display = 'none';
            await this.showInstructions('break');
            
            // Complex task
            await this.showInstructions('complexTask');
            this.currentTask = "complex";
            this.stopTrials = this.generateStopTrials();
            for (this.trialIndex = 0; this.trialIndex < config.trialsPerTask; this.trialIndex++) {
                await this.runTrial();
            }
            
            // Completion
            this.keyReminder.style.display = 'none';
            await this.showInstructions('completed');
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log("Results:", this.results);
            await this.endExperiment();
            
        } catch (error) {
            console.error("Error during experiment:", error);
            this.endExperiment();
        }
    }

    cleanup() {
        document.removeEventListener('keydown', this.handleInstructionKeyPress);
        document.removeEventListener('keydown', this.handleKeyPress);
    }
}

// Start experiment when page loads
window.addEventListener('load', () => {
    const experiment = new ExperimentManager();
    experiment.start();
});