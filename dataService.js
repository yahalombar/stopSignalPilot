const dbConnection = require('./db');

class ExperimentDataService {
    constructor() {
        this.db = null;
        this.collection = null;
    }

    async initialize() {
        try {
            this.db = await dbConnection.connect();
            this.collection = this.db.collection('experiment_results');
        } catch (error) {
            console.error('Failed to initialize data service:', error);
            throw error;
        }
    }

    async saveParticipantData(participantData) {
        if (!this.collection) {
            await this.initialize();
        }

        const experimentData = {
            participantId: participantData.participantId,
            timestamp: new Date(),
            results: participantData.results
        };

        try {
            const result = await this.collection.insertOne(experimentData);
            console.log(`Saved participant data with ID: ${result.insertedId}`);
            return result.insertedId;
        } catch (error) {
            console.error('Error saving participant data:', error);
            throw error;
        }
    }
}

module.exports = new ExperimentDataService();