const { MongoClient } = require('mongodb');

const url = process.env.MONGODB_URI || 'mongodb+srv://diamanta:didi2008_%23@cluster0.obk35.mongodb.net/experiment_db?retryWrites=true&w=majority';
const dbName = 'experiment_db';

class DatabaseConnection {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        if (this.db) return this.db;

        try {
            this.client = await MongoClient.connect(url);
            this.db = this.client.db(dbName);
            console.log('Connected successfully to database');
            return this.db;
        } catch (error) {
            console.error('Error connecting to database:', error);
            throw error;
        }
    }

    async close() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
        }
    }
}

module.exports = new DatabaseConnection();