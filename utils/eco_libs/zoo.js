
const { Zoo } = require('../../database/models');

module.exports = {
    
    async getZoo(userId) {
        const key = userId;
        
        
        if (!this.zooCache) this.zooCache = new Map();
        
        
        if (!this.zooCache.has(key)) {
            
            
            let zooData = await Zoo.findOne({ user_id: userId }).lean();
            
            if (!zooData) {
                
                
                zooData = { 
                    user_id: userId, 
                    animals: {} 
                };
            }

            
            if (!zooData.animals || typeof zooData.animals !== 'object' || Array.isArray(zooData.animals)) {
                zooData.animals = {};
            }

            
            this.zooCache.set(key, zooData);
        }
        
        return this.zooCache.get(key);
    },

    
    async addAnimals(userId, animalsList) {
        const key = userId;
        
        const zooData = await this.getZoo(userId);
        
        
        if (!zooData.animals) zooData.animals = {};

        for (const animal of animalsList) {
            const currentCount = zooData.animals[animal.id] || 0;
            zooData.animals[animal.id] = currentCount + 1;
        }

        
        this.zooCache.set(key, zooData);
        
        
        if (!this.dirty.zoo) this.dirty.zoo = new Set();
        this.dirty.zoo.add(key);
        
        return true;
    },

    
    async removeAnimals(userId, animalId, amount) {
        const key = userId;
        const zooData = await this.getZoo(userId);
        
        if (!zooData.animals) return false;

        const currentCount = zooData.animals[animalId] || 0;
        
        if (currentCount < amount) return false; 

        
        zooData.animals[animalId] = currentCount - amount;
        
        
        if (zooData.animals[animalId] <= 0) {
            delete zooData.animals[animalId];
        }

        
        this.zooCache.set(key, zooData);
        
        
        if (!this.dirty.zoo) this.dirty.zoo = new Set();
        this.dirty.zoo.add(key);
        
        return true;
    }
};