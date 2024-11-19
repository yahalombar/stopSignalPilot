const { MongoClient } = require('mongodb');

// כתובת החיבור ל-MongoDB Atlas
const url = 'mongodb+srv://diamanta:didi2008_%23@cluster0.obk35.mongodb.net/experiment_db?retryWrites=true&w=majority';
const dbName = 'experiment_db';
const collectionName = 'experiment_results';

async function checkDatabaseAndCollection() {
    const client = new MongoClient(url, {
        serverSelectionTimeoutMS: 30000, // 30 שניות
        connectTimeoutMS: 30000
    });

    try {
        console.log('Trying to connect to MongoDB...');
        await client.connect();
        console.log(`Connected to database: ${dbName}`);

        const db = client.db(dbName);

        // בדיקת האם הקולקציה קיימת
        const collections = await db.listCollections({ name: collectionName }).toArray();
        if (collections.length > 0) {
            console.log(`Collection "${collectionName}" exists.`);
        } else {
            console.log(`Collection "${collectionName}" does not exist. Creating it now...`);
            await db.createCollection(collectionName);
            console.log(`Collection "${collectionName}" created successfully.`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.close();
        console.log('Connection closed.');
    }
}

checkDatabaseAndCollection();
