const dbConnection = require('./db');

class ExperimentDataService {
    constructor() {
        this.db = null;
        this.collection = null;
    }

    async initialize() {
        try {
            console.log('Trying to connect to MongoDB...');
            this.db = await dbConnection.connect();
            console.log('Connected successfully to MongoDB.');

            
            // בדיקה האם הקולקציה קיימת, אם לא - יוצר אותה
            const collections = await this.db.listCollections({ name: 'experiment_results' }).toArray();
            if (collections.length === 0) {
                console.log('Creating experiment_results collection...');
                await this.db.createCollection('experiment_results');
            }
            
            this.collection = this.db.collection('experiment_results');
            console.log('Data service initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize data service:', error);
            throw error;
        }
    }

    async saveParticipantData(participantData) {
        try {
            if (!this.collection) {
                console.log('Collection not initialized, initializing...');
                await this.initialize();
            }

            if (!participantData || !participantData.results) {
                throw new Error('Invalid participant data');
            }
        
            const experimentData = {
                participantId: participantData.participantId || Date.now().toString(),
                timestamp: new Date(),
                demographic: participantData.demographic || {},
                results: participantData.results
            };
        
            console.log('Attempting to save participant data...');
            const result = await this.collection.insertOne(experimentData);
            console.log(`Saved participant data with ID: ${result.insertedId}`);
            return result.insertedId;
            
        } catch (error) {
            console.error('Error saving participant data:', error);
            // במקום לזרוק שגיאה, נחזיר אובייקט עם סטטוס השגיאה
            return {
                success: false,
                error: error.message,
                data: participantData
            };
        }
    }

    // מתודה לבדיקת החיבור
    async testConnection() {
        try {
            await this.initialize();
            return { success: true, message: 'Connection successful' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ExperimentDataService();