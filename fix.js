// ... (previous config and tasks objects remain the same)

class ExperimentManager {
    constructor() {
        this.stimulusContainer = document.getElementById("stimulus-container");
        this.instructions = document.getElementById("instructions");
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
        this.stimulusContainer.style.marginTop = '0';  // Adjust spacing after instructions are hidden
    }

    showInstructionsElement() {
        this.instructions.style.display = 'block';
        this.stimulusContainer.style.marginTop = '2em';
    }

    async showInstructions(phase) {
        this.showInstructionsElement();
        this.currentPhase = phase;
        this.instructions.textContent = instructions[phase];
        
        return new Promise(resolve => {
            this.resolveInstruction = () => {
                document.removeEventListener('keydown', this.handleInstructionKeyPress);
                this.resolveInstruction = null;
                if (phase !== 'completed') {
                    this.clearInstructions();
                }
                resolve();
            };
            document.addEventListener('keydown', this.handleInstructionKeyPress);
        });
    }

    async runTrial() {
        const taskConfig = tasks[this.currentTask];
        const stimulusType = this.selectRandomStimulus(taskConfig.stimuli);
        const isStopTrial = this.stopTrials[this.trialIndex];
        
        // Ensure instructions are hidden during trial
        this.clearInstructions();
        
        // Display stimulus
        this.stimulusContainer.textContent = taskConfig.stimuli[stimulusType];
        const trialStartTime = Date.now();
        
        // ... (rest of runTrial method remains the same)
    }

    async start() {
        try {
            // Welcome and consent
            await this.showInstructions('welcome');
            await this.showInstructions('consent');
            
            // Simple task
            await this.showInstructions('simpleTask');
            this.currentTask = "simple";
            this.stopTrials = this.generateStopTrials();
            for (this.trialIndex = 0; this.trialIndex < config.trialsPerTask; this.trialIndex++) {
                await this.runTrial();
            }
            
            // Break between tasks
            this.showInstructionsElement(); // Show instructions element for break
            await this.showInstructions('break');
            
            // Complex task
            await this.showInstructions('complexTask');
            this.currentTask = "complex";
            this.stopTrials = this.generateStopTrials();
            for (this.trialIndex = 0; this.trialIndex < config.trialsPerTask; this.trialIndex++) {
                await this.runTrial();
            }
            
            // Completion
            this.showInstructionsElement(); // Show instructions element for completion
            await this.showInstructions('completed');
            console.log("Results:", this.results);
            
        } catch (error) {
            console.error("Error during experiment:", error);
            this.endExperiment();
        }
    }

    // ... (rest of the class methods remain the same)
}

// Start experiment when page loads
window.addEventListener('load', () => {
    const experiment = new ExperimentManager();
    experiment.start();
});