import { BlogStorage } from './blog-storage';

// Create a singleton instance
const blogStorage = new BlogStorage();

// Initialize the storage
blogStorage.init().catch(console.error);

export default blogStorage; 