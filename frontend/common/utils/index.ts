export const getStorage = (key: string): any => {
    try {
      const serializedData = localStorage.getItem(key);
      if (serializedData === null) {
        return null;
      }
      return JSON.parse(serializedData);
    } catch (error) {
      console.error('Error getting data from localStorage:', error);
      return null;
    }
  };

  export const setStorage = (key: string, value: any): void => {
    try {
      const serializedData = JSON.stringify(value);
      localStorage.setItem(key, serializedData);
    } catch (error) {
      console.error('Error setting data in localStorage:', error);
    }
  };